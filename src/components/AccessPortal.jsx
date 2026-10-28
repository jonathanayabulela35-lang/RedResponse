import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, LockKeyhole, Mail, Siren, AlertCircle, LoaderCircle } from 'lucide-react';
import { DEPARTMENTS } from '../lib/departmentConfig.js';
import { supabase, supabaseConfigured } from '../lib/supabaseClient.js';

const go = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0, 0); };
const serviceIcon = (Icon) => <Icon size={19}/>;

export default function AccessPortal({ mode='login' }) {
  const registering = mode === 'register';
  const readStep = () => { const match = window.location.pathname.match(/\/register\/step-(\d+)/); return Math.min(3, Math.max(1, Number(match?.[1] || 1))); };
  const [step, setStep] = useState(readStep);
  const [department, setDepartment] = useState('medical');
  const [orgName, setOrgName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [structure, setStructure] = useState('single');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const selected = DEPARTMENTS.find(d => d.id === department) || DEPARTMENTS[0];
  const draft = { department, orgName, facilityName, structure, contactName, email };

  useEffect(() => {
    const updateStep = () => setStep(readStep());
    window.addEventListener('popstate', updateStep);
    if (registering) {
      const saved = localStorage.getItem('rr_registration_draft') || localStorage.getItem('rr_pending_organisation');
      if (saved) { try { const data=JSON.parse(saved); setOrgName(data.orgName || data.name || ''); setDepartment(data.department || data.organization_type || 'medical'); setFacilityName(data.facilityName || data.facility_name || ''); setStructure(data.structure || 'single'); setContactName(data.contactName || data.contact_name || ''); setEmail(data.email || ''); } catch {} }
    }
    return () => window.removeEventListener('popstate', updateStep);
  }, [registering]);

  useEffect(() => { if (registering) localStorage.setItem('rr_registration_draft', JSON.stringify(draft)); }, [registering, department, orgName, facilityName, structure, contactName, email]);
  const navigateStep = (next) => { const safe = Math.min(3, Math.max(1, next)); const path = safe === 1 ? '/register' : `/register/step-${safe}`; window.history.pushState({}, '', path); setStep(safe); setError(''); setMessage(''); window.scrollTo(0, 0); };

  const registerOrganisation = async (userId) => {
    const payload = { p_name: orgName.trim(), p_organization_type: department, p_facility_name: facilityName.trim() || orgName.trim(), p_structure: structure, p_contact_name: contactName.trim() };
    const { error: rpcError } = await supabase.rpc('register_redresponse_organization', payload);
    if (rpcError) throw rpcError;
    localStorage.removeItem('rr_pending_organisation'); localStorage.removeItem('rr_registration_draft');
    window.location.assign('/app');
  };

  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!supabaseConfigured || !supabase) { setError('Connect this project to Supabase first. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Cloudflare Pages environment variables, and apply the supplied SQL migration.'); return; }
    if (!registering && password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    if (registering) { navigateStep(step + 1); return; }
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email:email.trim(), password });
      if (signInError) throw signInError;
      const pendingRaw = localStorage.getItem('rr_pending_organisation');
      if (pendingRaw) { await registerOrganisation(data.user.id); return; }
      go('/app');
    } catch (e) { setError(e.message || 'We could not complete that request. Please try again.'); }
    finally { setBusy(false); }
  };

  const submitRegistration = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    if (step === 1) { navigateStep(2); return; }
    if (step === 2) {
      if (!orgName.trim() || !contactName.trim()) { setError('Enter the organisation name and your full name.'); return; }
      navigateStep(3); return;
    }
    if (!email.trim() || password.length < 8) { setError('Enter a valid email and a password with at least 8 characters.'); return; }
    if (!supabaseConfigured || !supabase) { setError('Connect this project to Supabase first. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Cloudflare Pages, and apply the supplied SQL migrations.'); return; }
    setBusy(true);
    try {
      const pending = { name:orgName.trim(), organization_type:department, facility_name:facilityName.trim(), structure, contact_name:contactName.trim(), email:email.trim() };
      localStorage.setItem('rr_pending_organisation', JSON.stringify(pending));
      const { data, error: signUpError } = await supabase.auth.signUp({ email:email.trim(), password, options:{ data:{ full_name:contactName.trim() } } });
      if (signUpError) throw signUpError;
      if (data.session) { await registerOrganisation(data.user.id); return; }
      setMessage('Account created. Check your email to confirm your address. Then sign in on this device with the same email and password to finish organisation setup.');
    } catch (e) { setError(e.message || 'We could not complete registration. Please try again.'); }
    finally { setBusy(false); }
  };

  const stepNames = ['Service type', 'Organisation details', 'Admin account'];
  return <div className="rr-access-page"><header className="rr-access-header"><button className="rr-wordmark" onClick={() => go('/')}><span className="rr-mark"><Siren size={19}/></span><span>Red<span>Response</span><small>RESPONSE WORKSPACE</small></span></button><button className="rr-back-link" onClick={() => go('/')}><ArrowLeft size={15}/> Back to website</button></header><main className={`rr-access-layout ${registering?'rr-registration-layout':''}`}><aside className="rr-access-aside"><div className="rr-eyebrow">{registering ? 'ORGANISATION REGISTRATION' : 'SECURE ORGANISATION ACCESS'}</div><h1>{registering ? 'Set up your response workspace, one step at a time.' : 'Your operations, securely in reach.'}</h1><p>{registering ? 'A short guided setup will configure RedResponse around your service and organisation.' : 'Sign in to continue to your organisation’s authorised operational workspace.'}</p><div className="rr-access-benefits"><div><CheckCircle2 size={17}/><span>Dedicated department workspace</span></div><div><CheckCircle2 size={17}/><span>Organisation-based user access</span></div><div><CheckCircle2 size={17}/><span>Controlled cross-service coordination</span></div></div><div className="rr-access-aside-note"><LockKeyhole size={17}/><span>Access is subject to organisation membership and the permissions configured for your account.</span></div></aside><section className="rr-access-card"><div className="rr-card-heading"><span className="rr-card-icon"><Siren size={20}/></span><div><h2>{registering ? 'Register your organisation' : 'Welcome back'}</h2><p>{registering ? `Step ${step} of 3 · ${stepNames[step-1]}` : 'Sign in to RedResponse operations.'}</p></div></div>
    {registering && <div className="rr-stepper" aria-label="Registration progress">{stepNames.map((name,index)=><button type="button" key={name} className={`rr-stepper-item ${step===index+1?'is-current':''} ${step>index+1?'is-complete':''}`} onClick={()=>step>index+1&&navigateStep(index+1)} disabled={step<=index+1}><span>{step>index+1?<Check size={14}/>:index+1}</span><small>{name}</small></button>)}</div>}
    <form onSubmit={registering?submitRegistration:submit} className="rr-access-form">
      {registering && step===1 && <div className="rr-wizard-page"><div className="rr-wizard-intro"><h3>Which service are you registering?</h3><p>Choose the primary service this organisation is responsible for. Your workspace will be tailored to this selection.</p></div><div className="rr-service-options">{DEPARTMENTS.map(d=>{const Icon=d.icon;return <button type="button" key={d.id} className={`rr-service-option ${department===d.id?'is-selected':''}`} onClick={()=>setDepartment(d.id)}><span className={`rr-service-option-icon rr-service-${d.color}`}><Icon size={21}/></span><span><strong>{d.label}</strong><small>{d.description}</small></span><span className="rr-service-radio">{department===d.id&&<Check size={13}/>}</span></button>;})}</div></div>}
      {registering && step===2 && <div className="rr-wizard-page"><div className="rr-wizard-intro"><h3>Tell us about your organisation</h3><p>These details establish the organisation and the facility structure for your workspace.</p></div><label>Registered organisation name<input required value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="e.g. Central District Ambulance Service" autoComplete="organization"/></label><div className="rr-form-two"><label>Primary station or facility<input value={facilityName} onChange={e=>setFacilityName(e.target.value)} placeholder="e.g. Central Station"/></label><label>Organisation structure<select value={structure} onChange={e=>setStructure(e.target.value)}><option value="single">One facility</option><option value="multiple">Multiple facilities</option><option value="regional">Regional dispatch centre</option></select></label></div><label>Your full name<input required value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Organisation administrator" autoComplete="name"/></label></div>}
      {registering && step===3 && <div className="rr-wizard-page"><div className="rr-wizard-intro"><h3>Create your administrator account</h3><p>This account will be used to sign in and manage your organisation’s RedResponse workspace.</p></div><div className="rr-registration-summary"><span className={`rr-service-option-icon rr-service-${selected.color}`}><selected.icon size={20}/></span><div><strong>{orgName || 'Your organisation'}</strong><small>{selected.label} · {structure==='single'?'One facility':structure==='multiple'?'Multiple facilities':'Regional dispatch centre'}</small></div><button type="button" onClick={()=>navigateStep(2)}>Edit</button></div><label>Email address<span className="rr-input-wrap"><Mail size={16}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@organisation.org" autoComplete="email"/></span></label><label>Password<span className="rr-input-wrap"><LockKeyhole size={16}/><input required type={showPassword?'text':'password'} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password"/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></span></label></div>}
      {!registering && <><label>Email address<span className="rr-input-wrap"><Mail size={16}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@organisation.org" autoComplete="email"/></span></label><label>Password<span className="rr-input-wrap"><LockKeyhole size={16}/><input required type={showPassword?'text':'password'} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password"/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></span></label></>}
      {error && <div className="rr-message rr-error"><AlertCircle size={16}/><span>{error}</span></div>}{message && <div className="rr-message rr-success"><CheckCircle2 size={16}/><span>{message}</span></div>}
      <div className={`rr-wizard-actions ${registering&&step>1?'has-back':''}`}>{registering&&step>1&&<button className="rr-button rr-button-outline" type="button" onClick={()=>navigateStep(step-1)}><ArrowLeft size={16}/> Back</button>}<button className="rr-button rr-button-primary rr-submit" type="submit" disabled={busy}>{busy?<><LoaderCircle className="rr-spin" size={17}/> Processing securely…</>:registering?(step<3?<>Continue <ArrowRight size={17}/></>:<>Create account and workspace <ArrowRight size={17}/></>):<>Sign in securely <ArrowRight size={17}/></>}</button></div>
      <p className="rr-privacy-note"><LockKeyhole size={13}/> Credentials are handled by Supabase Authentication. Do not use this platform for live emergency reliance until deployment and operational validation are complete.</p>
    </form><div className="rr-switch-auth">{registering?'Already have an account?':'Need to register your service?'} <button onClick={()=>go(registering?'/login':'/register')}>{registering?'Sign in':'Register organisation'}</button></div></section></main><footer className="rr-access-footer">© {new Date().getFullYear()} RedResponse <span>Secure emergency operations platform</span></footer></div>;
}

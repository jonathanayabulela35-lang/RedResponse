import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Ambulance, CheckCircle2, ChevronDown, Flame, LockKeyhole, Mail, Shield, Siren, CarFront, AlertCircle, LoaderCircle } from 'lucide-react';
import { DEPARTMENTS } from '../lib/departmentConfig.js';
import { supabase, supabaseConfigured } from '../lib/supabaseClient.js';

const go = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0, 0); };
const serviceIcon = (Icon) => <Icon size={19}/>;

export default function AccessPortal({ mode='login' }) {
  const registering = mode === 'register';
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

  useEffect(() => { if (!registering) return; const saved = localStorage.getItem('rr_pending_organisation'); if (saved) { try { const data=JSON.parse(saved); setOrgName(data.name||''); setDepartment(data.organization_type||'medical'); setFacilityName(data.facility_name||''); setStructure(data.structure||'single'); setContactName(data.contact_name||''); } catch {} } }, [registering]);

  const registerOrganisation = async (userId) => {
    const payload = { p_name: orgName.trim(), p_organization_type: department, p_facility_name: facilityName.trim() || orgName.trim(), p_structure: structure, p_contact_name: contactName.trim() };
    const { error: rpcError } = await supabase.rpc('register_redresponse_organization', payload);
    if (rpcError) throw rpcError;
    localStorage.removeItem('rr_pending_organisation');
    window.location.assign('/app');
  };

  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!supabaseConfigured || !supabase) { setError('Connect this project to Supabase first. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Cloudflare Pages environment variables, and apply the supplied SQL migration.'); return; }
    if (password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    if (registering && (!orgName.trim() || !contactName.trim())) { setError('Enter the organisation name and your full name.'); return; }
    setBusy(true);
    try {
      if (registering) {
        const pending = { name:orgName.trim(), organization_type:department, facility_name:facilityName.trim(), structure, contact_name:contactName.trim() };
        localStorage.setItem('rr_pending_organisation', JSON.stringify(pending));
        const { data, error: signUpError } = await supabase.auth.signUp({ email:email.trim(), password, options:{ data:{ full_name:contactName.trim() } } });
        if (signUpError) throw signUpError;
        if (data.session) { await registerOrganisation(data.user.id); return; }
        setMessage('Account created. Check your email to confirm your address, then sign in with the same email and password to finish organisation setup.');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email:email.trim(), password });
        if (signInError) throw signInError;
        const pendingRaw = localStorage.getItem('rr_pending_organisation');
        if (pendingRaw) { await registerOrganisation(data.user.id); return; }
        go('/app');
      }
    } catch (e) { setError(e.message || 'We could not complete that request. Please try again.'); }
    finally { setBusy(false); }
  };

  return <div className="rr-access-page"><header className="rr-access-header"><button className="rr-wordmark" onClick={() => go('/')}><span className="rr-mark"><Siren size={19}/></span><span>Red<span>Response</span><small>EMERGENCY OPERATIONS</small></span></button><button className="rr-back-link" onClick={() => go('/')}><ArrowLeft size={15}/> Back to website</button></header><main className="rr-access-layout"><aside className="rr-access-aside"><div className="rr-eyebrow">SECURE ORGANISATION ACCESS</div><h1>{registering ? 'Build your response workspace around your service.' : 'Your operations, securely in reach.'}</h1><p>{registering ? 'Tell us which emergency service your organisation operates. RedResponse will configure a dedicated workspace for that service.' : 'Sign in to continue to your organisation’s authorised operational workspace.'}</p><div className="rr-access-benefits"><div><CheckCircle2 size={17}/><span>Dedicated department workspace</span></div><div><CheckCircle2 size={17}/><span>Organisation-based user access</span></div><div><CheckCircle2 size={17}/><span>Controlled cross-service coordination</span></div></div><div className="rr-access-aside-note"><LockKeyhole size={17}/><span>Access is subject to organisation membership and the permissions configured for your account.</span></div></aside><section className="rr-access-card"><div className="rr-card-heading"><span className="rr-card-icon"><Siren size={20}/></span><div><h2>{registering ? 'Register your organisation' : 'Welcome back'}</h2><p>{registering ? 'Create an account and configure your service.' : 'Sign in to RedResponse operations.'}</p></div></div><form onSubmit={submit} className="rr-access-form">
    {registering && <>
      <label>Emergency service type<select value={department} onChange={e=>setDepartment(e.target.value)}>{DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></label>
      <div className={`rr-selected-service rr-service-${selected.color}`}><span>{serviceIcon(selected.icon)}</span><div><strong>{selected.label}</strong><small>{selected.description}</small></div><ChevronDown size={15}/></div>
      <label>Registered organisation name<input required value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="e.g. Central District Ambulance Service" autoComplete="organization"/></label>
      <div className="rr-form-two"><label>Station or facility (optional)<input value={facilityName} onChange={e=>setFacilityName(e.target.value)} placeholder="e.g. Central Station"/></label><label>Organisation structure<select value={structure} onChange={e=>setStructure(e.target.value)}><option value="single">One facility</option><option value="multiple">Multiple facilities</option><option value="regional">Regional dispatch centre</option></select></label></div>
      <label>Your full name<input required value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Organisation administrator" autoComplete="name"/></label>
    </>}
    <label>Email address<span className="rr-input-wrap"><Mail size={16}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@organisation.org" autoComplete="email"/></span></label>
    <label>Password<span className="rr-input-wrap"><LockKeyhole size={16}/><input required type={showPassword?'text':'password'} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder={registering?'At least 8 characters':'Your password'} autoComplete={registering?'new-password':'current-password'}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></span></label>
    {error && <div className="rr-message rr-error"><AlertCircle size={16}/><span>{error}</span></div>}{message && <div className="rr-message rr-success"><CheckCircle2 size={16}/><span>{message}</span></div>}
    <button className="rr-button rr-button-primary rr-submit" type="submit" disabled={busy}>{busy?<><LoaderCircle className="rr-spin" size={17}/> Processing securely…</>:<>{registering?'Create account and register':'Sign in securely'} <ArrowRight size={17}/></>}</button>
    <p className="rr-privacy-note"><LockKeyhole size={13}/> Credentials are handled by Supabase Authentication. Do not use this platform for live emergency reliance until deployment and operational validation are complete.</p>
  </form><div className="rr-switch-auth">{registering?'Already have an account?':'Need to register your service?'} <button onClick={()=>go(registering?'/login':'/register')}>{registering?'Sign in':'Register organisation'}</button></div></section></main><footer className="rr-access-footer">© {new Date().getFullYear()} RedResponse <span>Secure emergency operations platform</span></footer></div>;
}

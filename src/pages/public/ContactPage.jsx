import React, { useState } from 'react';
import { ArrowRight, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import { supabase, supabaseConfigured } from '../../lib/supabaseClient.js';

export default function ContactPage() {
  const [contact,setContact] = useState({name:'',email:'',organisation:'',topic:'Organisation onboarding',message:''});
  const [busy,setBusy] = useState(false); const [success,setSuccess] = useState(''); const [error,setError] = useState('');
  const update = (key,value) => setContact(old=>({...old,[key]:value}));
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    if(!supabaseConfigured||!supabase){setError('The enquiry service is not configured yet. Please try again later.');setBusy(false);return;}
    const {error:saveError}=await supabase.rpc('submit_redresponse_enquiry',{p_name:contact.name.trim(),p_email:contact.email.trim(),p_organization:contact.organisation.trim()||null,p_topic:contact.topic,p_message:contact.message.trim()});
    if(saveError)setError(saveError.message||'We could not save your enquiry.');else{setSuccess('Your enquiry has been recorded for follow-up.');setContact({name:'',email:'',organisation:'',topic:'Organisation onboarding',message:''});}
    setBusy(false);
  };
  return <div className="rr-inner-page rr-contact-page">
    <section className="rr-page-hero"><div className="rr-section-kicker">CONTACT REDRESPONSE</div><h1>Let's talk about your response organisation.</h1><p>Ask about the platform, organisation onboarding or a potential partnership. Share enough context for us to understand your enquiry, but do not include sensitive patient or live incident details.</p></section>
    <section className="rr-contact-layout"><aside className="rr-contact-aside"><article><span><Mail size={20}/></span><h2>Platform enquiries</h2><p>Discuss your organisation's needs, service type and the workflows you want to support.</p></article><article><span><MessageSquare size={20}/></span><h2>Onboarding support</h2><p>Ask about setting up an organisation workspace and preparing the information needed for registration.</p></article><article><span><ShieldCheck size={20}/></span><h2>Responsible deployment</h2><p>RedResponse must be validated for security, reliability, integrations and operational procedures before it is relied on for live emergency response.</p></article></aside>
      <form className="rr-contact-form rr-contact-form-page" onSubmit={submit}><h2>Send an enquiry</h2><p>Fields marked required must be completed.</p><div className="rr-contact-fields"><label>Your name<input required value={contact.name} onChange={e=>update('name',e.target.value)} autoComplete="name"/></label><label>Email address<input required type="email" value={contact.email} onChange={e=>update('email',e.target.value)} autoComplete="email"/></label><label className="rr-contact-wide">Organisation (optional)<input value={contact.organisation} onChange={e=>update('organisation',e.target.value)} autoComplete="organization"/></label><label className="rr-contact-wide">Enquiry type<select value={contact.topic} onChange={e=>update('topic',e.target.value)}><option>Organisation onboarding</option><option>Platform information</option><option>Partnership enquiry</option><option>Technical support</option><option>Other enquiry</option></select></label><label className="rr-contact-wide">Message<textarea required minLength={10} maxLength={3000} rows={5} value={contact.message} onChange={e=>update('message',e.target.value)} placeholder="Tell us what you would like to discuss."/></label></div>{error&&<div className="rr-message rr-error">{error}</div>}{success&&<div className="rr-message rr-success">{success}</div>}<button className="rr-button rr-button-primary" type="submit" disabled={busy}>{busy?'Sending enquiry…':'Submit enquiry'} <ArrowRight size={16}/></button><small className="rr-contact-privacy">Please do not send emergency calls, patient details or confidential incident information through this form.</small></form>
    </section>
  </div>;
}

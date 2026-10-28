import React from 'react';
import { ArrowRight, LockKeyhole, RadioTower, ShieldCheck } from 'lucide-react';
import HomeMap from '../../components/HomeMap.jsx';

export default function HomePage({ navigate }) {
  return <>
    <section className="rr-home-hero">
      <div className="rr-home-copy">
        <div className="rr-eyebrow"><span /> PURPOSE BUILT FOR RESPONSE ORGANISATIONS</div>
        <h1>When every moment matters, <em>clarity matters too.</em></h1>
        <p>RedResponse gives emergency response organisations a dedicated place to record incidents, organise response units and keep operational information clear as situations develop.</p>
        <div className="rr-hero-actions"><button className="rr-button rr-button-primary" onClick={() => navigate('/register')}>Register your organisation <ArrowRight size={17}/></button><button className="rr-button rr-button-outline" onClick={() => navigate('/how-it-works')}>See how it works</button></div>
        <div className="rr-home-assurances"><span><LockKeyhole size={16}/> Organisation-specific access</span><span><ShieldCheck size={16}/> Controlled information sharing</span></div>
      </div>
      <div className="rr-home-map-panel"><div className="rr-home-map-heading"><div><span className="rr-map-heading-dot"/> RESPONSE AREA</div><span>JOHANNESBURG, SOUTH AFRICA</span></div><HomeMap /></div>
    </section>
    <section className="rr-home-intro rr-page-section"><div className="rr-section-kicker">A CLEARER WAY TO WORK</div><h2>Built around the service doing the work.</h2><p>Fire and rescue, medical response, police and road response each have different responsibilities. RedResponse starts with the organisation's service and shapes the workspace around it.</p><button className="rr-text-link" onClick={() => navigate('/services')}>Explore the services <ArrowRight size={16}/></button></section>
    <section className="rr-home-feature-strip"><article><RadioTower/><h3>Record the incident</h3><p>Keep incident details and status updates in one operational record.</p></article><article><ShieldCheck/><h3>Keep access focused</h3><p>Organisation membership and permissions shape who can access information.</p></article><article><LockKeyhole/><h3>Coordinate with control</h3><p>Request assistance from another service without opening every record by default.</p></article></section>
  </>;
}

import React from 'react';
import { ArrowRight, ClipboardList, RadioTower, Truck, History, Share2, CheckCircle2 } from 'lucide-react';

const steps = [
  { n:'01', icon:ClipboardList, title:'Capture the incident', body:'An authorised operator records the incident type, priority, description and a confirmed location. The incident record becomes the shared reference point for that organisation.' },
  { n:'02', icon:Truck, title:'Assign a response unit', body:'Dispatch staff review available units and create an assignment linked to the incident. The workspace reflects the assignment and its recorded status.' },
  { n:'03', icon:RadioTower, title:'Follow operational updates', body:'Incident and unit status changes help authorised staff follow the response as information is updated. Reliable field notifications and acknowledgement workflows require deployment-specific integration.' },
  { n:'04', icon:Share2, title:'Request cross-service support', body:'When another service is needed, an organisation can request assistance. Incident details should only become visible to the receiving organisation after the appropriate approval flow is implemented.' },
];
export default function HowItWorksPage({ navigate }) {
  return <div className="rr-inner-page">
    <section className="rr-page-hero"><div className="rr-section-kicker">HOW IT WORKS</div><h1>A structured path from incident to response.</h1><p>RedResponse organises the operational steps around a service's responsibilities, with records and access tied to the organisation.</p></section>
    <section className="rr-process-list">{steps.map(({n,icon:Icon,title,body})=><article className="rr-process-step" key={n}><div className="rr-process-number">{n}</div><div className="rr-process-icon"><Icon size={23}/></div><div className="rr-process-copy"><h2>{title}</h2><p>{body}</p></div></article>)}</section>
    <section className="rr-how-records"><div><div className="rr-section-kicker">DESIGNED FOR ACCOUNTABILITY</div><h2>Keep the operational picture connected.</h2><p>Incidents, assignments, unit status and event history are intended to work together rather than live in disconnected notes. Access and operational readiness depend on correct configuration and validated procedures.</p></div><div className="rr-how-points"><span><CheckCircle2/> Organisation-scoped records</span><span><CheckCircle2/> Unit and incident relationships</span><span><History/> Recorded operational history</span></div></section>
    <section className="rr-page-cta"><div><h2>Ready to set up your organisation?</h2><p>Start by selecting the service that best matches your operational responsibility.</p></div><button className="rr-button rr-button-primary" onClick={() => navigate('/register')}>Begin registration <ArrowRight size={16}/></button></section>
  </div>;
}

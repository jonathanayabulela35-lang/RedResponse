import React from 'react';
import { ArrowRight, Eye, Network, ClipboardCheck, Layers3 } from 'lucide-react';

const principles = [
  { icon:Eye, title:'A clearer operational picture', body:'Keep incident details, assignments and status updates connected so authorised staff can understand what has been recorded and what still needs attention.' },
  { icon:Layers3, title:'Workspaces that fit the service', body:'Give each organisation a service-focused environment instead of placing unrelated response departments into one crowded dashboard.' },
  { icon:Network, title:'Coordination with boundaries', body:'Support requests between services while preserving the originating organisation’s ownership and control of its incident records.' },
  { icon:ClipboardCheck, title:'A stronger record of activity', body:'Build toward more consistent event history and reviewable operational records, subject to configured permissions and audit capabilities.' },
];
export default function ImpactPage({ navigate }) {
  return <div className="rr-inner-page rr-impact-page">
    <section className="rr-impact-hero"><div className="rr-section-kicker">INTENDED IMPACT</div><h1>Less operational fragmentation. More clarity for the people responding.</h1><p>RedResponse is being built to help response organisations keep information organised, responsibilities clear and cross-service support deliberate.</p><div className="rr-impact-note">We do not publish unverified performance figures or claim proven emergency-response outcomes. Impact should be measured through real deployments, operational feedback and validated service data.</div></section>
    <section className="rr-impact-grid">{principles.map(({icon:Icon,title,body},i)=><article key={title}><span className="rr-impact-index">0{i+1}</span><div className="rr-impact-icon"><Icon size={23}/></div><h2>{title}</h2><p>{body}</p></article>)}</section>
    <section className="rr-impact-measure"><div><div className="rr-section-kicker">MEASURE WHAT MATTERS</div><h2>Impact should be visible in the work.</h2><p>Potential measures include completeness of incident records, time between incident creation and unit assignment, acknowledgement rates, status-update timeliness and the quality of cross-service handovers. These require reliable event capture and real operational use before results can be reported.</p></div><button className="rr-button rr-button-primary" onClick={() => navigate('/contact')}>Discuss an organisation pilot <ArrowRight size={16}/></button></section>
  </div>;
}

import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { DEPARTMENTS } from '../../lib/departmentConfig.js';

export default function ServicesPage({ navigate }) {
  return <div className="rr-inner-page">
    <section className="rr-page-hero"><div className="rr-section-kicker">SERVICES</div><h1>One service focus at a time.</h1><p>Choose the organisation's primary response responsibility. RedResponse uses that selection to shape the incidents, units and workflows presented in its workspace.</p></section>
    <section className="rr-service-list">{DEPARTMENTS.map(({id,label,description,icon:Icon,incidentTypes})=><article className="rr-service-detail" key={id}><div className="rr-service-detail-icon"><Icon size={25}/></div><div className="rr-service-detail-main"><h2>{label}</h2><p>{description}</p><div className="rr-service-tags">{incidentTypes.map(type=><span key={type}>{type}</span>)}</div></div><button className="rr-service-register" onClick={() => navigate('/register')}>Register this service <ArrowRight size={15}/></button></article>)}</section>
    <section className="rr-service-boundary"><CheckCircle2 size={22}/><div><h2>Separate workspaces. Deliberate coordination.</h2><p>Organisations do not automatically share a universal dashboard. Cross-service assistance is designed to be controlled and limited to the incident information that is approved for sharing.</p></div></section>
  </div>;
}

import React from 'react';
import { ArrowLeft, Clock3, MapPin, MessageSquare, Navigation, Radio, ShieldCheck, Truck } from 'lucide-react';

const statusText = status => {
  const value = String(status || 'Awaiting assignment').toLowerCase();
  if (value.includes('arriv')) return 'Arrived at scene';
  if (value.includes('en route') || value.includes('respond')) return 'En route to incident';
  if (value.includes('acknow')) return 'Assignment acknowledged';
  if (value.includes('dispatch') || value.includes('assign')) return 'Dispatched';
  if (value.includes('available') || value.includes('station')) return 'Assigned · awaiting departure';
  return status || 'Awaiting assignment';
};

export default function IncidentFocusPage({ incident, units = [], go, notify, dispatch, changeStatus }) {
  if (!incident?.id) {
    return <section className="rr-incident-focus"><button className="btn btn-secondary" onClick={() => go?.('Live map')}><ArrowLeft size={16}/> Back to live map</button><div className="panel rr-incident-focus-empty"><strong>No incident selected</strong><p>Return to the Live Map and double-click an active incident to open its incident channel.</p></div></section>;
  }
  const assignedUnits = (incident.units || []).map(unitId => units.find(unit => unit.id === unitId)).filter(Boolean);
  const isClosed = ['resolved', 'closed'].includes(String(incident.status || '').toLowerCase());
  const canMarkAttended = !['attended', 'resolved', 'closed'].includes(String(incident.status || '').toLowerCase());
  const availableUnits = units.filter(unit => ['Available', 'At station'].includes(String(unit.status || '')) && !((incident.units || []).includes(unit.id)));
  const isAttended = String(incident.status || '').toLowerCase() === 'attended';
  return <section className="rr-incident-focus">
    <div className="page-heading rr-incident-focus-heading">
      <div><div className="eyebrow">INCIDENT RESPONSE CHANNEL</div><h1>{incident.id}</h1><p>{incident.type} · {incident.area || 'Organisation incident'}</p></div>
      <button className="btn btn-secondary" onClick={() => go?.('Live map')}><ArrowLeft size={16}/> Back to live map</button>
    </div>
    <div className="rr-incident-focus-summary panel">
      <div className="rr-focus-status-icon"><Radio size={21}/></div>
      <div className="rr-focus-summary-copy"><span className="rr-focus-kicker">CURRENT INCIDENT STATUS</span><strong>{incident.status || 'New'}</strong><span>{isClosed ? 'This incident is marked as closed.' : 'Response coordination for this incident.'}</span></div>
      <div className="rr-focus-address"><MapPin size={17}/><span>{incident.address || 'No address recorded'}</span></div>
      <div className="rr-focus-actions">{canMarkAttended && <button className="btn btn-primary" onClick={() => changeStatus?.('Attended')}>Mark as Attended</button>}</div>
    </div>
    <div className="rr-incident-focus-grid">
      <section className="panel rr-focus-channel">
        <div className="panel-header"><div><h2>Response unit channel</h2><p>Units assigned to this incident and their latest recorded response status.</p></div><span className="rr-focus-count">{assignedUnits.length} {assignedUnits.length === 1 ? 'unit' : 'units'}</span></div>
        <div className="rr-focus-assign"><label htmlFor="rr-focus-unit-select">Assign a response unit</label><div className="rr-focus-assign-controls"><select id="rr-focus-unit-select" defaultValue=""><option value="">{availableUnits.length ? 'Select an available unit' : 'No unassigned available units'}</option>{availableUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.id}{unit.name ? ` · ${unit.name}` : ''}</option>)}</select><button className="btn btn-primary" disabled={!availableUnits.length} onClick={event => { const select = event.currentTarget.parentElement.querySelector('select'); if (select?.value) dispatch?.(select.value); }}>Assign unit</button></div></div>
        {assignedUnits.length ? <div className="rr-focus-unit-list">{assignedUnits.map(unit => <article className="rr-focus-unit" key={unit.id}>
          <div className="rr-focus-unit-icon"><Truck size={19}/></div>
          <div className="rr-focus-unit-main"><strong>{unit.id}{unit.name ? ` · ${unit.name}` : ''}</strong><span>{unit.type || 'Response unit'}{unit.dept ? ` · ${unit.dept}` : ''}</span><small><Clock3 size={13}/> {unit.updated ? `Last update: ${unit.updated}` : 'No recent location update'}</small></div>
          <span className={`rr-focus-unit-status ${/arriv/i.test(unit.status || '') ? 'is-arrived' : /route|respond/i.test(unit.status || '') ? 'is-moving' : ''}`}><i/>{statusText(unit.status)}</span>
        </article>)}</div> : <div className="rr-focus-no-units"><div className="rr-focus-no-units-icon"><Navigation size={20}/></div><strong>No response unit assigned yet</strong><span>When dispatch assigns a registered response unit, it will appear in this incident channel with its recorded response status.</span></div>}
        <div className="rr-focus-channel-note"><MessageSquare size={16}/><span>This channel currently shows saved assignments and response statuses. Crew messages and live acknowledgements will appear here when those communication events are connected.</span></div>
      </section>
      <aside className="rr-focus-side">
        <section className="panel rr-focus-details"><div className="panel-header"><div><h2>Incident details</h2><p>Information recorded by dispatch</p></div></div><div className="rr-focus-detail-row"><span>Incident reference</span><strong>{incident.id}</strong></div><div className="rr-focus-detail-row"><span>Incident type</span><strong>{incident.type || 'Not recorded'}</strong></div><div className="rr-focus-detail-row"><span>Logged at</span><strong>{incident.time || 'Time unavailable'}</strong></div><div className="rr-focus-detail-row"><span>Location</span><strong>{incident.address || 'Not recorded'}</strong></div>{incident.detail && <div className="rr-focus-description"><span>Incident briefing</span><p>{incident.detail}</p></div>}</section>
        <section className="panel rr-focus-progress"><div className="panel-header"><div><h2>Response progress</h2><p>Based on the latest saved status</p></div><ShieldCheck size={19}/></div><div className="rr-focus-progress-step is-complete"><span/><div><strong>Incident logged</strong><small>Recorded by dispatch</small></div></div><div className={`rr-focus-progress-step ${assignedUnits.length ? 'is-complete' : ''}`}><span/><div><strong>Unit assigned</strong><small>{assignedUnits.length ? `${assignedUnits.length} response unit(s) linked` : 'Awaiting assignment'}</small></div></div><div className={`rr-focus-progress-step ${assignedUnits.some(u => /route|respond|arriv/i.test(u.status || '')) ? 'is-complete' : ''}`}><span/><div><strong>Responding to location</strong><small>{assignedUnits.some(u => /arriv/i.test(u.status || '')) ? 'Unit arrival recorded' : assignedUnits.some(u => /route|respond/i.test(u.status || '')) ? 'At least one unit is responding' : 'Awaiting response status update'}</small></div></div><div className={`rr-focus-progress-step ${isAttended ? 'is-complete' : ''}`}><span/><div><strong>Attended</strong><small>{isAttended ? 'Incident marked as attended by dispatch' : 'Awaiting confirmation that the incident has been attended'}</small></div></div></section>
      </aside>
    </div>
  </section>;
}

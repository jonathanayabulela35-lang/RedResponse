import React, { useState } from 'react';
import { Ambulance, CarFront, Clock3, Flame, MapPin, MoreHorizontal, Navigation, Plus, RefreshCw, Shield, Users, X, LoaderCircle, AlertCircle } from 'lucide-react';
import { StatusPill } from '../components/operations/OperationalComponents.jsx';
import { supabase } from '../lib/supabaseClient.js';

const typesByService = {
  medical: ['Ambulance', 'Rapid response vehicle', 'Patient transport vehicle'],
  fire_rescue: ['Fire engine', 'Rescue unit', 'Hazmat unit', 'Command vehicle'],
  police: ['Patrol vehicle', 'Traffic unit', 'Command vehicle', 'Specialist response unit'],
  road_response: ['Road response vehicle', 'Traffic control unit', 'Recovery vehicle'],
};
const statusToDb = { 'Available':'available', 'At station':'at_station', 'En route':'en_route', 'Responding':'responding', 'Acknowledged':'acknowledged', 'Unavailable':'unavailable', 'Off duty':'off_duty' };

export default function ResponseUnitsPage(props) {
  const { units, setUnits, incidents, setSelected, go, notify, organization } = props;
  const [showForm,setShowForm] = useState(false);
  const [code,setCode] = useState(''); const [name,setName] = useState(''); const [type,setType] = useState((typesByService[organization.organization_type]||['Response unit'])[0]);
  const [crew,setCrew] = useState('2'); const [capabilities,setCapabilities] = useState('Primary response'); const [saving,setSaving] = useState(false); const [error,setError] = useState('');
  const allowedType = organization.organization_type;
  const registerUnit = async (event) => {
    event.preventDefault(); setError(''); setSaving(true);
    const {data,error:insertError}=await supabase.from('response_units').insert({organization_id:organization.id,unit_code:code.trim().toUpperCase(),name:name.trim(),unit_type:type,status:'at_station',capabilities:capabilities.split(',').map(v=>v.trim()).filter(Boolean),crew_count:Number(crew)||0}).select('*').single();
    if(insertError){setError(insertError.message);setSaving(false);return;}
    setUnits(prev=>[...prev,{dbId:data.id,id:data.unit_code,name:data.name,dept:organization.department?.short||organization.name,type:data.unit_type,status:'At station',area:organization.name,lat:null,lon:null,cap:data.capabilities||[],crew:`${data.crew_count||0} crew members`,updated:'Not recently updated'}]);
    setShowForm(false);setCode('');setName('');setCapabilities('Primary response');notify(`${data.unit_code} registered and saved`);setSaving(false);
  };
  const toggleAvailability = async (unit) => {
    const next=unit.status==='Available'?'At station':'Available';
    const {error:updateError}=await supabase.from('response_units').update({status:statusToDb[next],updated_at:new Date().toISOString()}).eq('id',unit.dbId).eq('organization_id',organization.id);
    if(updateError){notify(updateError.message);return;}
    setUnits(prev=>prev.map(u=>u.id===unit.id?{...u,status:next}:u));notify(`${unit.id} availability saved`);
  };
  return <>
    <div className="page-heading"><div><div className="eyebrow">{organization.department?.short?.toUpperCase()||'FIELD'} OPERATIONS</div><h1>Response units</h1><p>Manage units belonging to {organization.name}.</p></div><button className="btn btn-primary" onClick={()=>setShowForm(true)}><Plus size={17}/> Register unit</button></div>
    <div className="unit-toolbar"><span className="updated-tag"><span className="small-live"/>{units.length} registered units</span><span className="updated-tag"><Navigation size={13}/> Location is shown only when a validated location source is configured</span></div>
    <div className="unit-grid">{units.map(u=><div className="panel unit-card" key={u.id}><div className="unit-card-top"><div className={`unit-large-icon ${allowedType==='medical'?'red':allowedType==='police'?'blue':allowedType==='fire_rescue'?'orange':'green'}`}>{allowedType==='medical'?<Ambulance size={21}/>:allowedType==='police'?<Shield size={21}/>:allowedType==='fire_rescue'?<Flame size={21}/>:<CarFront size={21}/>}</div><StatusPill status={u.status}/><button className="icon-button subtle" title="Unit actions" onClick={()=>notify(`${u.id} · ${u.name}`)}><MoreHorizontal size={17}/></button></div><h3>{u.name}</h3><span className="unit-id">{u.id} · {u.dept}</span><div className="unit-card-info"><span><MapPin size={14}/>{u.area}</span><span><Users size={14}/>{u.crew}</span><span><Clock3 size={14}/>{u.updated}</span></div><div className="capability-list">{u.cap.map(c=><span key={c}>{c}</span>)}</div><div className="unit-card-actions"><button className="btn btn-secondary btn-small" onClick={()=>{const incident=incidents.find(i=>i.units.includes(u.id));if(incident){setSelected(incident.id);go('Live incidents')}else notify(`${u.id} has no active incident assignment`)}}>View assignment</button><button className="btn btn-secondary btn-small" disabled={!u.dbId} onClick={()=>toggleAvailability(u)}>{u.status==='Available'?'Set at station':'Mark available'}</button></div></div>)}{!units.length&&<div className="panel empty-state"><Navigation size={25}/><strong>No response units registered</strong><span>Register your organisation's first unit to begin managing availability.</span></div>}</div>
    {showForm&&<div className="modal-backdrop" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><span className="modal-kicker">ORGANISATION SETUP</span><h2>Register response unit</h2><p>This unit will belong to {organization.name} only.</p></div><button className="icon-button" onClick={()=>setShowForm(false)}><X size={19}/></button></div><form onSubmit={registerUnit}><label>Unit code<input required value={code} onChange={e=>setCode(e.target.value)} placeholder="e.g. MED-01"/></label><label>Unit name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Ambulance 01"/></label><label>Unit type<select value={type} onChange={e=>setType(e.target.value)}>{(typesByService[allowedType]||['Response unit']).map(v=><option key={v}>{v}</option>)}</select></label><div className="form-two"><label>Crew count<input type="number" min="0" max="100" value={crew} onChange={e=>setCrew(e.target.value)}/></label><label>Initial status<input value="At station" readOnly/></label></div><label>Capabilities (comma separated)<input value={capabilities} onChange={e=>setCapabilities(e.target.value)} placeholder="e.g. First aid, rescue, transport"/></label>{error&&<div className="rr-message rr-error"><AlertCircle size={15}/>{error}</div>}<div className="form-note">Only authorised organisation administrators can register units. Unit availability changes are saved to the organisation database.</div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving} type="submit">{saving?<><LoaderCircle size={15}/> Saving…</>:<><Plus size={15}/> Save unit</>}</button></div></form></div></div>}
  </>;
}

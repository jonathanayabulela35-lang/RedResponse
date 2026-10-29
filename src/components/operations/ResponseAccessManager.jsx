import React, { useEffect, useState } from 'react';
import { Copy, KeyRound, LockKeyhole, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase.js';

export default function ResponseAccessManager({ onClose, notify }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [organizationId, setOrganizationId] = useState('');
  const [unitMode, setUnitMode] = useState('new');
  const [existingUnits, setExistingUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitType, setUnitType] = useState('medical');
  const [crewEmail, setCrewEmail] = useState('');
  const [crewName, setCrewName] = useState('');
  const [expires, setExpires] = useState('24');
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { if (active) setSession(next); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session?.user || !supabase) return;
    (async () => {
      setLoading(true); setError('');
      const { data, error: queryError } = await supabase.from('organization_memberships')
        .select('organization_id, role, organizations(id, name)')
        .eq('user_id', session.user.id).eq('is_active', true);
      if (queryError) setError(queryError.message);
      const allowed = (data || []).filter(row => ['department_admin', 'dispatcher', 'supervisor', 'platform_admin'].includes(row.role));
      setOrgs(allowed);
      if (allowed.length === 1) setOrganizationId(allowed[0].organization_id);
      setLoading(false);
    })();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user || !organizationId || !supabase) { setExistingUnits([]); setSelectedUnitId(''); return; }
    let active = true;
    supabase.from('response_units').select('id, unit_code, name, unit_type').eq('organization_id', organizationId).eq('is_active', true).order('unit_code')
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        const rows = data || [];
        setExistingUnits(rows);
        setSelectedUnitId(rows[0]?.id || '');
      });
    return () => { active = false; };
  }, [session?.user?.id, organizationId]);

  async function signIn(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) setError(signInError.message);
    setBusy(false);
  }

  async function createAccess(e) {
    e.preventDefault(); setBusy(true); setError(''); setGenerated(null);
    const { data, error: rpcError } = unitMode === 'existing'
      ? await supabase.rpc('create_response_member_invite_for_unit', {
          p_organization_id: organizationId,
          p_unit_id: selectedUnitId,
          p_invited_email: crewEmail.trim().toLowerCase(),
          p_display_name: crewName.trim() || null,
          p_expires_in_hours: Number(expires)
        })
      : await supabase.rpc('create_response_unit_invite', {
          p_organization_id: organizationId,
          p_unit_code: unitCode.trim().toUpperCase(),
          p_name: unitName.trim(),
          p_unit_type: unitType,
          p_invited_email: crewEmail.trim().toLowerCase(),
          p_display_name: crewName.trim() || null,
          p_expires_in_hours: Number(expires)
        });
    if (rpcError) setError(rpcError.message);
    else {
      const row = Array.isArray(data) ? data[0] : data;
      setGenerated(row);
      notify?.('Response unit and activation code created. Copy the code now; it is only shown once.');
      if (unitMode === 'new') { setUnitCode(''); setUnitName(''); } setCrewEmail(''); setCrewName('');
    }
    setBusy(false);
  }

  async function copyCode() {
    if (!generated?.activation_code) return;
    try { await navigator.clipboard.writeText(generated.activation_code); notify?.('Activation code copied.'); }
    catch { setError('Clipboard access was blocked. Select and copy the code manually.'); }
  }

  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal dispatch-modal" role="dialog" aria-modal="true" aria-labelledby="crew-access-title">
      <div className="modal-header"><div><span className="modal-kicker">RESPONSE TEAM ACCESS</span><h2 id="crew-access-title">Create crew access</h2><p>Create a registered unit and issue a one-time activation code to a named crew member.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>
      {!isSupabaseConfigured ? <div className="form-note"><LockKeyhole size={15}/> The dispatch website needs VITE_SUPABASE_URL and VITE_SUPABASE_KEY in its environment before this feature can connect to your shared project.</div>
      : loading ? <div className="empty-state"><RefreshCw size={20}/><span>Checking dispatch access…</span></div>
      : !session ? <form onSubmit={signIn}><div className="form-note"><ShieldCheck size={15}/> Sign in with an existing authorised RedResponse dispatch account. Access is checked by Supabase; this form does not create dispatcher accounts.</div><label>Dispatch work email<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="dispatcher@organisation.co.za"/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error && <p className="access-error">{error}</p>}<div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></div></form>
      : orgs.length === 0 ? <div className="form-note"><LockKeyhole size={15}/> This account has no active organisation membership with a dispatch, supervisor or administrator role. Ask your platform administrator to grant the appropriate access.{error ? ` ${error}` : ''}</div>
      : <>
        {generated ? <><div className="dispatch-destination"><KeyRound size={18}/><div><strong>Unit {generated.unit_code} · {generated.unit_name}</strong><span>Invite for {generated.invited_email} · expires {new Date(generated.expires_at).toLocaleString()}</span></div></div><label>One-time activation code<div className="access-code-row"><code>{generated.activation_code}</code><button className="btn btn-secondary btn-small" onClick={copyCode} type="button"><Copy size={14}/> Copy code</button></div></label><div className="form-note"><ShieldCheck size={15}/> Share this code only with the named crew member. It is bound to their email address, expires automatically and can only be redeemed once. The full code is not stored in readable form, so close this window only after copying it.</div><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setGenerated(null)} type="button">Create another</button><button className="btn btn-primary" onClick={onClose} type="button">Done</button></div></>
        : <form onSubmit={createAccess}>
          <label>Organisation<select required value={organizationId} onChange={e=>setOrganizationId(e.target.value)}><option value="">Select organisation</option>{orgs.map(row=><option key={row.organization_id} value={row.organization_id}>{row.organizations?.name || row.organization_id}</option>)}</select></label>
          <label>Unit setup<select value={unitMode} onChange={e=>setUnitMode(e.target.value)}><option value="new">Register a new response unit</option><option value="existing">Add a crew member to an existing unit</option></select></label>
          {unitMode === 'existing' ? <label>Existing response unit<select required value={selectedUnitId} onChange={e=>setSelectedUnitId(e.target.value)}><option value="">Select an active unit</option>{existingUnits.map(unit=><option key={unit.id} value={unit.id}>{unit.unit_code} · {unit.name}</option>)}</select>{existingUnits.length === 0 && <span className="unit-id">No active units were found for this organisation.</span>}</label> : <><div className="form-two"><label>Unit code<input required value={unitCode} onChange={e=>setUnitCode(e.target.value)} placeholder="MED-04" autoCapitalize="characters"/></label><label>Unit type<select value={unitType} onChange={e=>setUnitType(e.target.value)}><option value="medical">Medical / Ambulance</option><option value="fire_rescue">Fire & Rescue</option><option value="police">Police</option><option value="road_response">Road Response</option><option value="other">Other response</option></select></label></div><label>Unit display name<input required value={unitName} onChange={e=>setUnitName(e.target.value)} placeholder="Ambulance Unit 04"/></label></>}
          <div className="form-two"><label>Crew member name<input value={crewName} onChange={e=>setCrewName(e.target.value)} placeholder="Full name"/></label><label>Crew member email<input type="email" required value={crewEmail} onChange={e=>setCrewEmail(e.target.value)} placeholder="crew@organisation.co.za"/></label></div>
          <label>Code validity<select value={expires} onChange={e=>setExpires(e.target.value)}><option value="1">1 hour</option><option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option></select></label>
          {error && <p className="access-error">{error}</p>}
          <div className="form-note"><LockKeyhole size={15}/> A new unit and a one-time email-bound invite will be created in the shared Supabase project. The crew member uses the code to activate their own authenticated account. Existing units and incidents are not changed.</div>
          <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy || !organizationId || (unitMode === 'existing' && !selectedUnitId)}>{busy ? 'Creating…' : (unitMode === 'existing' ? 'Issue crew activation code' : 'Create unit and access code')}</button></div>
        </form>}
      </>}
    </section>
  </div>;
}

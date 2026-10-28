import React, { useEffect, useState } from 'react';
import { AlertTriangle, LoaderCircle, LogOut, RefreshCw, Siren } from 'lucide-react';
import PublicPortal from './components/PublicPortal.jsx';
import AccessPortal from './components/AccessPortal.jsx';
import { supabase, supabaseConfigured } from './lib/supabaseClient.js';
import { departmentById } from './lib/departmentConfig.js';
import OperationsWorkspace from './App.jsx';

function routePath() { return window.location.pathname.replace(/\/$/, '') || '/'; }
export default function RootApp() {
  const [path,setPath] = useState(routePath());
  const [session,setSession] = useState(null);
  const [organisation,setOrganisation] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  useEffect(() => { const pop=()=>setPath(routePath()); window.addEventListener('popstate',pop); return()=>window.removeEventListener('popstate',pop); },[]);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) { setLoading(false); return; }
    let alive=true;
    const resolve = async (nextSession) => {
      if (!alive) return;
      setSession(nextSession); setError('');
      if (!nextSession) { setOrganisation(null); setLoading(false); return; }
      setLoading(true);
      try {
        const { data, error: memberError } = await supabase.from('organization_memberships').select('role,organization_id,organizations(id,name,organization_type,is_active,facility_structure,primary_facility_name)').eq('user_id',nextSession.user.id).eq('is_active',true);
        if (memberError) throw memberError;
        const membership=(data||[]).find(m=>m.organizations?.is_active) || (data||[])[0];
        if (membership?.organizations) setOrganisation({...membership.organizations,role:membership.role,userId:nextSession.user.id, email:nextSession.user.email,department:departmentById(membership.organizations.organization_type)});
        else setOrganisation(null);
      } catch(e) { setError(e.message||'Unable to load organisation access.'); setOrganisation(null); }
      finally { if(alive) setLoading(false); }
    };
    supabase.auth.getSession().then(({data})=>resolve(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{resolve(next)});
    return()=>{alive=false;subscription.unsubscribe();};
  },[]);

  if (path==='/' || path==='/platform' || path==='/services' || path==='/contact') return <PublicPortal/>;
  if (path==='/register') return <AccessPortal mode="register"/>;
  if (path==='/login') return <AccessPortal mode="login"/>;
  if (path==='/app' || path.startsWith('/app/') || ['/overview','/incidents','/dispatch','/map','/units','/reports','/settings'].includes(path)) {
    if (!supabaseConfigured) return <div className="rr-gate"><div className="rr-gate-card"><span className="rr-mark"><Siren size={20}/></span><h1>Connect RedResponse to its backend</h1><p>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your deployment environment and apply the supplied database migrations. The operational workspace is not available without authenticated backend access.</p><button className="rr-button rr-button-primary" onClick={()=>{window.history.pushState({},'','/login');setPath('/login')}}>Go to sign in</button></div></div>;
    if (loading) return <div className="rr-gate"><div className="rr-gate-card"><LoaderCircle className="rr-spin" size={28}/><h1>Loading secure workspace</h1><p>Verifying your account and organisation permissions.</p></div></div>;
    if (!session) return <AccessPortal mode="login"/>;
    if (!organisation) return <div className="rr-gate"><div className="rr-gate-card"><span className="rr-mark"><Siren size={20}/></span><h1>No organisation workspace found</h1><p>Your account is signed in, but it is not linked to an active RedResponse organisation. Register an organisation or ask its administrator to invite you.</p>{error&&<p className="rr-gate-error">{error}</p>}<div className="rr-gate-actions"><button className="rr-button rr-button-primary" onClick={()=>{window.history.pushState({},'','/register');setPath('/register')}}>Register organisation</button><button className="rr-button rr-button-outline" onClick={async()=>{await supabase.auth.signOut();window.history.pushState({},'','/login');setPath('/login')}}><LogOut size={15}/> Sign out</button></div></div></div>;
    return <OperationsWorkspace key={organisation.id} organization={organisation} onSignOut={async()=>{await supabase.auth.signOut();window.history.pushState({},'','/login');setPath('/login')}}/>;
  }
  window.history.replaceState({},'','/'); return <PublicPortal/>;
}

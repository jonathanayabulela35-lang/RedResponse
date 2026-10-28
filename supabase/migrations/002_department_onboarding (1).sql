-- Department-specific onboarding and secure organisation creation.
-- Run after 001_initial_schema.sql in the RedResponse Supabase project.

alter table public.organizations
  add column if not exists facility_structure text not null default 'single'
    check (facility_structure in ('single','multiple','regional'));
alter table public.organizations
  add column if not exists primary_facility_name text;
alter table public.organizations
  add column if not exists onboarding_contact_name text;

create or replace function public.register_redresponse_organization(
  p_name text,
  p_organization_type text,
  p_facility_name text default null,
  p_structure text default 'single',
  p_contact_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  normalized_name text := trim(coalesce(p_name,''));
begin
  if auth.uid() is null then
    raise exception 'Sign in is required to register an organisation';
  end if;
  if length(normalized_name) < 3 then
    raise exception 'Organisation name must contain at least 3 characters';
  end if;
  if p_organization_type not in ('police','medical','fire_rescue','road_response') then
    raise exception 'Select a supported emergency service type';
  end if;
  if coalesce(p_structure,'single') not in ('single','multiple','regional') then
    raise exception 'Select a valid organisation structure';
  end if;
  if exists (
    select 1 from public.organization_memberships m
    where m.user_id = auth.uid() and m.is_active
      and exists (select 1 from public.organizations o where o.id=m.organization_id and lower(o.name)=lower(normalized_name))
  ) then
    raise exception 'You are already a member of an organisation with this name';
  end if;

  insert into public.organizations(name, organization_type, facility_structure, primary_facility_name, onboarding_contact_name)
  values (normalized_name, p_organization_type, coalesce(p_structure,'single'), nullif(trim(coalesce(p_facility_name,'')),''), nullif(trim(coalesce(p_contact_name,'')),''))
  returning id into new_org_id;

  insert into public.organization_memberships(organization_id,user_id,role,display_name,is_active)
  values (new_org_id,auth.uid(),'department_admin',nullif(trim(coalesce(p_contact_name,'')),''),true);

  insert into public.audit_events(actor_user_id,organization_id,action,resource_type,resource_id,metadata)
  values (auth.uid(),new_org_id,'organization.registered','organization',new_org_id::text,jsonb_build_object('organization_type',p_organization_type,'facility_structure',coalesce(p_structure,'single')));

  return new_org_id;
end;
$$;

revoke all on function public.register_redresponse_organization(text,text,text,text,text) from public;
grant execute on function public.register_redresponse_organization(text,text,text,text,text) to authenticated;


-- Return only basic organisation identity for cross-service coordination.
create or replace function public.list_redresponse_partner_organizations(p_exclude_organization_id uuid)
returns table(id uuid, name text, organization_type text, primary_facility_name text)
language sql
security definer
stable
set search_path = public
as $$
  select o.id, o.name, o.organization_type, o.primary_facility_name
  from public.organizations o
  where o.is_active
    and o.id <> p_exclude_organization_id
    and public.is_active_member(p_exclude_organization_id)
    and not exists (
      select 1 from public.organization_memberships m
      where m.organization_id=o.id and m.user_id=auth.uid() and m.is_active
    )
  order by o.name;
$$;
revoke all on function public.list_redresponse_partner_organizations(uuid) from public;
grant execute on function public.list_redresponse_partner_organizations(uuid) to authenticated;

-- Create a scoped assistance request and the corresponding incident share atomically.
create or replace function public.request_redresponse_assistance(
  p_incident_id uuid,
  p_receiving_organization_id uuid,
  p_request_type text,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_org uuid;
  request_id uuid;
  share_reason text;
begin
  if auth.uid() is null then raise exception 'Sign in is required'; end if;
  select i.organization_id into owner_org from public.incidents i where i.id=p_incident_id;
  if owner_org is null then raise exception 'Incident not found'; end if;
  if not public.has_org_role(owner_org, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]) then
    raise exception 'You do not have permission to request assistance for this incident';
  end if;
  if not exists(select 1 from public.organizations o where o.id=p_receiving_organization_id and o.is_active) then
    raise exception 'Receiving organisation is not available';
  end if;
  if owner_org=p_receiving_organization_id then raise exception 'Choose a different receiving organisation'; end if;
  if length(trim(coalesce(p_request_type,'')))<3 then raise exception 'Select the type of assistance required'; end if;

  share_reason := trim(p_request_type) || case when nullif(trim(coalesce(p_message,'')),'') is null then '' else ': ' || left(trim(p_message),1500) end;
  insert into public.incident_shares(incident_id,owner_organization_id,receiving_organization_id,shared_by,reason,shared_fields,status,approved_by,approved_at)
  values (p_incident_id,owner_org,p_receiving_organization_id,auth.uid(),share_reason,array['incident_type','priority','status','address_text','location','description'],'pending',null,null)
  on conflict (incident_id,receiving_organization_id) do update set reason=excluded.reason,status='pending',shared_by=excluded.shared_by,approved_by=null,approved_at=null;

  insert into public.assistance_requests(incident_id,requesting_organization_id,receiving_organization_id,requested_by,request_type,message,status)
  values (p_incident_id,owner_org,p_receiving_organization_id,auth.uid(),trim(p_request_type),nullif(trim(coalesce(p_message,'')),''),'requested')
  returning id into request_id;

  insert into public.incident_events(incident_id,organization_id,actor_user_id,event_type,message,metadata)
  values (p_incident_id,owner_org,auth.uid(),'assistance.requested','Cross-service assistance request sent',jsonb_build_object('receiving_organization_id',p_receiving_organization_id,'request_type',trim(p_request_type),'request_id',request_id));
  return request_id;
end;
$$;
revoke all on function public.request_redresponse_assistance(uuid,uuid,text,text) from public;
grant execute on function public.request_redresponse_assistance(uuid,uuid,text,text) to authenticated;


-- Public enquiries are captured server-side without exposing a table insert policy.
create table if not exists public.public_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  email text not null check (length(trim(email)) between 5 and 320),
  organization_name text,
  topic text not null check (topic in ('Organisation onboarding','Platform information','Partnership enquiry','Technical support','Other enquiry')),
  message text not null check (length(trim(message)) between 10 and 3000),
  status text not null default 'new' check (status in ('new','in_review','responded','closed')),
  created_at timestamptz not null default now()
);
alter table public.public_enquiries enable row level security;

create or replace function public.submit_redresponse_enquiry(
  p_name text,
  p_email text,
  p_organization text default null,
  p_topic text default 'Other enquiry',
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare enquiry_id uuid;
begin
  if length(trim(coalesce(p_name,''))) not between 2 and 160 then raise exception 'Enter your name'; end if;
  if length(trim(coalesce(p_email,''))) not between 5 and 320 or position('@' in p_email)=0 then raise exception 'Enter a valid email address'; end if;
  if p_topic not in ('Organisation onboarding','Platform information','Partnership enquiry','Technical support','Other enquiry') then raise exception 'Choose a valid enquiry type'; end if;
  if length(trim(coalesce(p_message,''))) not between 10 and 3000 then raise exception 'Message must contain between 10 and 3000 characters'; end if;
  insert into public.public_enquiries(name,email,organization_name,topic,message)
  values (trim(p_name),trim(p_email),nullif(trim(coalesce(p_organization,'')),''),p_topic,trim(p_message))
  returning id into enquiry_id;
  return enquiry_id;
end;
$$;
revoke all on function public.submit_redresponse_enquiry(text,text,text,text,text) from public;
grant execute on function public.submit_redresponse_enquiry(text,text,text,text,text) to anon, authenticated;

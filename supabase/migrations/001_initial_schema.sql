-- RedResponse foundation schema for Supabase/PostgreSQL.
-- Review and test all policies in a non-production project before use.
create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.member_role as enum ('platform_admin','department_admin','dispatcher','supervisor','responder','viewer');
create type public.unit_status as enum ('available','at_station','en_route','responding','acknowledged','unavailable','off_duty');
create type public.incident_priority as enum ('critical','high','medium','low');
create type public.incident_status as enum ('new','dispatched','acknowledged','en_route','on_scene','resolved','closed');
create type public.assignment_status as enum ('pending','sent','acknowledged','en_route','on_scene','completed','cancelled','delivery_failed');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_type text not null check (organization_type in ('police','medical','fire_rescue','road_response','other')),
  external_reference text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index memberships_user_idx on public.organization_memberships(user_id, organization_id) where is_active;

create table public.stations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  location geography(point, 4326),
  coverage_area geometry(multipolygon, 4326),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index stations_location_idx on public.stations using gist(location);

create table public.response_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  station_id uuid references public.stations(id) on delete set null,
  unit_code text not null,
  name text not null,
  unit_type text not null,
  status public.unit_status not null default 'at_station',
  capabilities text[] not null default '{}',
  crew_count integer not null default 0 check (crew_count >= 0),
  current_location geography(point, 4326),
  location_accuracy_m numeric,
  location_updated_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, unit_code)
);
create index response_units_location_idx on public.response_units using gist(current_location);
create index response_units_dispatch_idx on public.response_units(organization_id, status) where is_active;

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_number bigint generated always as identity unique,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  incident_type text not null,
  priority public.incident_priority not null default 'medium',
  status public.incident_status not null default 'new',
  address_text text not null,
  location geography(point, 4326),
  location_source text not null default 'operator_entered' check (location_source in ('operator_entered','caller_confirmed','network_provided','device_gps','external_system','approximate')),
  location_accuracy_m numeric,
  location_confirmed boolean not null default false,
  caller_name text,
  caller_phone text,
  description text,
  intake_source text not null default 'operator_entered',
  opened_at timestamptz not null default now(),
  arrived_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index incidents_org_status_idx on public.incidents(organization_id, status, priority, opened_at desc);
create index incidents_location_idx on public.incidents using gist(location);

create table public.incident_assignments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  unit_id uuid not null references public.response_units(id) on delete restrict,
  assigned_by uuid references auth.users(id) on delete set null,
  status public.assignment_status not null default 'pending',
  dispatched_at timestamptz,
  acknowledged_at timestamptz,
  en_route_at timestamptz,
  on_scene_at timestamptz,
  completed_at timestamptz,
  delivery_attempts integer not null default 0,
  last_delivery_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assignments_incident_idx on public.incident_assignments(incident_id, created_at);
create index assignments_unit_status_idx on public.incident_assignments(unit_id, status);

create table public.incident_shares (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  owner_organization_id uuid not null references public.organizations(id) on delete restrict,
  receiving_organization_id uuid not null references public.organizations(id) on delete restrict,
  shared_by uuid references auth.users(id) on delete set null,
  reason text not null,
  shared_fields text[] not null default array['incident_type','priority','status','address_text','location','description'],
  status text not null default 'active' check (status in ('pending','active','revoked','completed')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (incident_id, receiving_organization_id)
);
create index incident_shares_receiving_idx on public.incident_shares(receiving_organization_id, status);

create table public.assistance_requests (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  requesting_organization_id uuid not null references public.organizations(id) on delete restrict,
  receiving_organization_id uuid not null references public.organizations(id) on delete restrict,
  requested_by uuid references auth.users(id) on delete set null,
  request_type text not null,
  message text,
  status text not null default 'requested' check (status in ('requested','accepted','declined','cancelled','completed')),
  decision_by uuid references auth.users(id) on delete set null,
  decision_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index incident_events_timeline_idx on public.incident_events(incident_id, created_at);

create table public.unit_location_history (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  unit_id uuid not null references public.response_units(id) on delete cascade,
  location geography(point, 4326) not null,
  accuracy_m numeric,
  recorded_at timestamptz not null default now()
);
create index unit_location_history_unit_time_idx on public.unit_location_history(unit_id, recorded_at desc);
create index unit_location_history_geo_idx on public.unit_location_history using gist(location);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  outcome text not null default 'success',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_events_org_time_idx on public.audit_events(organization_id, created_at desc);

-- Security helper. SECURITY DEFINER avoids recursive RLS evaluation on membership checks.
create or replace function public.is_active_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.organization_memberships m where m.organization_id = target_org and m.user_id = auth.uid() and m.is_active); $$;

create or replace function public.has_org_role(target_org uuid, allowed_roles public.member_role[])
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.organization_memberships m where m.organization_id = target_org and m.user_id = auth.uid() and m.is_active and m.role = any(allowed_roles)); $$;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.stations enable row level security;
alter table public.response_units enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_assignments enable row level security;
alter table public.incident_shares enable row level security;
alter table public.assistance_requests enable row level security;
alter table public.incident_events enable row level security;
alter table public.unit_location_history enable row level security;
alter table public.audit_events enable row level security;

create policy "members can read own organizations" on public.organizations for select to authenticated using (public.is_active_member(id));
create policy "members can read own memberships" on public.organization_memberships for select to authenticated using (public.is_active_member(organization_id));
create policy "department admins manage memberships" on public.organization_memberships for all to authenticated using (public.has_org_role(organization_id, array['department_admin','platform_admin']::public.member_role[])) with check (public.has_org_role(organization_id, array['department_admin','platform_admin']::public.member_role[]));
create policy "members read stations" on public.stations for select to authenticated using (public.is_active_member(organization_id));
create policy "admins manage stations" on public.stations for all to authenticated using (public.has_org_role(organization_id, array['department_admin','platform_admin']::public.member_role[])) with check (public.has_org_role(organization_id, array['department_admin','platform_admin']::public.member_role[]));
create policy "members read units" on public.response_units for select to authenticated using (public.is_active_member(organization_id));
create policy "authorized users update units" on public.response_units for update to authenticated using (public.has_org_role(organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[])) with check (public.has_org_role(organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]));
create policy "admins insert units" on public.response_units for insert to authenticated with check (public.has_org_role(organization_id, array['department_admin','platform_admin']::public.member_role[]));
create policy "members read own incidents" on public.incidents for select to authenticated using (public.is_active_member(organization_id) or exists (select 1 from public.incident_shares s where s.incident_id = incidents.id and s.receiving_organization_id in (select m.organization_id from public.organization_memberships m where m.user_id = auth.uid() and m.is_active) and s.status = 'active' and (s.expires_at is null or s.expires_at > now())));
create policy "dispatch roles create incidents" on public.incidents for insert to authenticated with check (public.has_org_role(organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]));
create policy "dispatch roles update incidents" on public.incidents for update to authenticated using (public.has_org_role(organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[])) with check (public.has_org_role(organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]));
create policy "members read assignments in org" on public.incident_assignments for select to authenticated using (public.is_active_member(organization_id));
create policy "dispatch roles manage assignments" on public.incident_assignments for all to authenticated using (public.has_org_role(organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[])) with check (public.has_org_role(organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]));
create policy "participants read shares" on public.incident_shares for select to authenticated using (public.is_active_member(owner_organization_id) or public.is_active_member(receiving_organization_id));
create policy "owner dispatch roles create shares" on public.incident_shares for insert to authenticated with check (public.has_org_role(owner_organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]));
create policy "owner admins update shares" on public.incident_shares for update to authenticated using (public.has_org_role(owner_organization_id, array['department_admin','supervisor','platform_admin']::public.member_role[])) with check (public.has_org_role(owner_organization_id, array['department_admin','supervisor','platform_admin']::public.member_role[]));
create policy "participants read assistance requests" on public.assistance_requests for select to authenticated using (public.is_active_member(requesting_organization_id) or public.is_active_member(receiving_organization_id));
create policy "requesting dispatch roles create assistance" on public.assistance_requests for insert to authenticated with check (public.has_org_role(requesting_organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]));
create policy "receiving dispatch roles update assistance" on public.assistance_requests for update to authenticated using (public.has_org_role(receiving_organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[])) with check (public.has_org_role(receiving_organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]));
create policy "members read incident events in org" on public.incident_events for select to authenticated using (public.is_active_member(organization_id));
create policy "dispatch roles write incident events" on public.incident_events for insert to authenticated with check (public.has_org_role(organization_id, array['department_admin','dispatcher','supervisor','responder','platform_admin']::public.member_role[]));
create policy "members read unit location history" on public.unit_location_history for select to authenticated using (public.is_active_member(organization_id));
create policy "responders write own org locations" on public.unit_location_history for insert to authenticated with check (public.has_org_role(organization_id, array['department_admin','dispatcher','supervisor','responder','platform_admin']::public.member_role[]));
create policy "admins read audit events" on public.audit_events for select to authenticated using (public.has_org_role(organization_id, array['department_admin','supervisor','platform_admin']::public.member_role[]));
create policy "authenticated audit insert" on public.audit_events for insert to authenticated with check (organization_id is null or public.is_active_member(organization_id));

-- NOTE: This schema is a starting point, not a production security certification.
-- Add hardened RPCs for dispatch/assignment transitions, immutable audit enforcement,
-- rate limits, retention controls, emergency data policies, and tested cross-org sharing.

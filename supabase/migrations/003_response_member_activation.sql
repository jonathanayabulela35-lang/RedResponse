-- Dispatch-managed response-unit onboarding.
-- Apply after 001_initial_schema.sql and 002_department_onboarding.sql in the SAME Supabase project.
-- The crew activation code is shown once, stored only as a SHA-256 hash, email-bound, expiring and single-use.
begin;

create table if not exists public.response_member_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid not null references public.response_units(id) on delete cascade,
  invited_email text not null,
  display_name text,
  code_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  constraint response_member_invite_expiry_check check (expires_at > created_at)
);
create index if not exists response_member_invites_unit_idx on public.response_member_invites(unit_id, created_at desc);
create index if not exists response_member_invites_org_idx on public.response_member_invites(organization_id, created_at desc);
alter table public.response_member_invites enable row level security;

create table if not exists public.response_team_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid not null references public.response_units(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  unique(unit_id, user_id)
);
alter table public.response_team_profiles add column if not exists display_name text;
alter table public.response_team_profiles enable row level security;
drop policy if exists "crew reads own response profile" on public.response_team_profiles;
create policy "crew reads own response profile" on public.response_team_profiles for select to authenticated using (user_id = auth.uid());

-- No direct table access is granted to browser/mobile clients. All writes go through guarded RPCs.
revoke all on public.response_member_invites from anon, authenticated;

create or replace function public.create_response_unit_invite(
  p_organization_id uuid,
  p_unit_code text,
  p_name text,
  p_unit_type text,
  p_invited_email text,
  p_display_name text default null,
  p_expires_in_hours integer default 24
)
returns table(unit_id uuid, unit_code text, unit_name text, invited_email text, activation_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_unit public.response_units%rowtype;
  v_code text;
  v_expiry timestamptz;
  v_email text;
begin
  if auth.uid() is null then raise exception 'Sign in is required'; end if;
  if not public.has_org_role(p_organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]) then
    raise exception 'You do not have permission to create response-unit access';
  end if;
  if nullif(trim(p_unit_code), '') is null or nullif(trim(p_name), '') is null then raise exception 'Unit code and unit name are required'; end if;
  if nullif(trim(p_invited_email), '') is null or position('@' in p_invited_email) < 2 then raise exception 'A valid crew member email is required'; end if;
  if p_expires_in_hours is null or p_expires_in_hours < 1 or p_expires_in_hours > 168 then raise exception 'Code expiry must be between 1 hour and 7 days'; end if;
  v_email := lower(trim(p_invited_email));
  v_code := upper(encode(gen_random_bytes(6), 'hex'));
  v_expiry := now() + make_interval(hours => p_expires_in_hours);

  insert into public.response_units (organization_id, unit_code, name, unit_type, status, is_active)
  values (p_organization_id, upper(trim(p_unit_code)), trim(p_name), coalesce(nullif(trim(p_unit_type), ''), 'other'), 'at_station', true)
  returning * into v_unit;

  insert into public.response_member_invites (organization_id, unit_id, invited_email, display_name, code_hash, created_by, expires_at)
  values (p_organization_id, v_unit.id, v_email, nullif(trim(p_display_name), ''), encode(digest(v_code, 'sha256'), 'hex'), auth.uid(), v_expiry);

  return query select v_unit.id, v_unit.unit_code, v_unit.name, v_email, v_code, v_expiry;
end;
$$;

create or replace function public.create_response_member_invite_for_unit(
  p_organization_id uuid,
  p_unit_id uuid,
  p_invited_email text,
  p_display_name text default null,
  p_expires_in_hours integer default 24
)
returns table(unit_id uuid, unit_code text, unit_name text, invited_email text, activation_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_unit public.response_units%rowtype;
  v_code text;
  v_expiry timestamptz;
  v_email text;
begin
  if auth.uid() is null then raise exception 'Sign in is required'; end if;
  if not public.has_org_role(p_organization_id, array['department_admin','dispatcher','supervisor','platform_admin']::public.member_role[]) then
    raise exception 'You do not have permission to create response-unit access';
  end if;
  if nullif(trim(p_invited_email), '') is null or position('@' in p_invited_email) < 2 then raise exception 'A valid crew member email is required'; end if;
  if p_expires_in_hours is null or p_expires_in_hours < 1 or p_expires_in_hours > 168 then raise exception 'Code expiry must be between 1 hour and 7 days'; end if;
  select * into v_unit from public.response_units ru where ru.id = p_unit_id and ru.organization_id = p_organization_id and coalesce(ru.is_active, true) = true;
  if v_unit.id is null then raise exception 'Select an active response unit in your organisation'; end if;
  v_email := lower(trim(p_invited_email));
  v_code := upper(encode(gen_random_bytes(6), 'hex'));
  v_expiry := now() + make_interval(hours => p_expires_in_hours);
  insert into public.response_member_invites (organization_id, unit_id, invited_email, display_name, code_hash, created_by, expires_at)
  values (p_organization_id, v_unit.id, v_email, nullif(trim(p_display_name), ''), encode(digest(v_code, 'sha256'), 'hex'), auth.uid(), v_expiry);
  return query select v_unit.id, v_unit.unit_code, v_unit.name, v_email, v_code, v_expiry;
end;
$$;

create or replace function public.redeem_response_member_invite(p_activation_code text)
returns table(id uuid, organization_id uuid, unit_code text, name text, unit_type text, status text)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_email text;
  v_invite public.response_member_invites%rowtype;
  v_unit public.response_units%rowtype;
  v_code_hash text;
begin
  if auth.uid() is null then raise exception 'Create an account or sign in before entering an activation code'; end if;
  select lower(email) into v_user_email from auth.users where id = auth.uid();
  if v_user_email is null then raise exception 'Your account email could not be verified'; end if;
  if nullif(trim(p_activation_code), '') is null then raise exception 'Enter the activation code provided by Dispatch'; end if;
  v_code_hash := encode(digest(upper(trim(p_activation_code)), 'sha256'), 'hex');

  select * into v_invite from public.response_member_invites i
   where i.code_hash = v_code_hash and i.redeemed_at is null and i.revoked_at is null and i.expires_at > now()
   for update;
  if v_invite.id is null then raise exception 'This activation code is invalid, expired, revoked or already used'; end if;
  if lower(v_invite.invited_email) <> v_user_email then raise exception 'Sign in with the email address that Dispatch assigned to this code'; end if;
  if exists(select 1 from public.response_team_profiles p where p.user_id = auth.uid()) then
    raise exception 'This account is already linked to a response unit. Contact Dispatch if it needs to be changed';
  end if;

  update public.response_member_invites set redeemed_at = now(), redeemed_by = auth.uid() where id = v_invite.id and redeemed_at is null;
  if not found then raise exception 'This activation code has already been used'; end if;
  insert into public.response_team_profiles(user_id, organization_id, unit_id, display_name)
    values(auth.uid(), v_invite.organization_id, v_invite.unit_id, v_invite.display_name);
  select * into v_unit from public.response_units where id = v_invite.unit_id and organization_id = v_invite.organization_id and is_active = true;
  if v_unit.id is null then raise exception 'This response unit is no longer active'; end if;
  return query select v_unit.id, v_unit.organization_id, v_unit.unit_code, v_unit.name, v_unit.unit_type, v_unit.status::text;
end;
$$;

revoke all on function public.create_response_unit_invite(uuid,text,text,text,text,text,integer) from public, anon;
revoke all on function public.create_response_member_invite_for_unit(uuid,uuid,text,text,integer) from public, anon;
revoke all on function public.redeem_response_member_invite(text) from public, anon;
grant execute on function public.create_response_unit_invite(uuid,text,text,text,text,text,integer) to authenticated;
grant execute on function public.create_response_member_invite_for_unit(uuid,uuid,text,text,integer) to authenticated;
grant execute on function public.redeem_response_member_invite(text) to authenticated;
commit;

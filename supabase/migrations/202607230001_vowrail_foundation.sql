create extension if not exists pgcrypto;

create type public.staff_role as enum ('agency_principal','licensed_agent','account_manager');
create type public.policy_status as enum ('quoting','bind_requested','bound','active','renewal_pending','lapsed','cancelled');
create type public.requirement_kind as enum ('document_upload','attestation','inspection_photo','prior_coverage_proof');

create table public.agencies (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table public.staff_profiles (id uuid primary key references auth.users(id), agency_id uuid not null references public.agencies(id), role public.staff_role not null, bind_override_delegated boolean not null default false, created_at timestamptz not null default now());
create table public.carriers (id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id), name text not null, created_at timestamptz not null default now());
create table public.policy_types (id uuid primary key default gen_random_uuid(), carrier_id uuid not null references public.carriers(id), name text not null, created_at timestamptz not null default now());
create table public.prebind_requirements (id uuid primary key default gen_random_uuid(), policy_type_id uuid not null references public.policy_types(id), requirement_name text not null, requirement_type public.requirement_kind not null, mandatory boolean not null default true, created_at timestamptz not null default now());
create table public.clients (id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id), full_name text not null, contact_email text not null, created_at timestamptz not null default now());
create table public.policies (id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id), policy_type_id uuid not null references public.policy_types(id), status public.policy_status not null default 'quoting', effective_date date, expiration_date date, created_at timestamptz not null default now());
create table public.prebind_fulfillments (id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.policies(id), requirement_id uuid not null references public.prebind_requirements(id), fulfilled boolean not null default false, storage_path text, evidence_sha256 text, fulfilled_by uuid not null references auth.users(id), fulfilled_at timestamptz not null default now(), created_at timestamptz not null default now(), unique(policy_id,requirement_id));
create table public.bind_overrides (id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.policies(id), justification_note text not null check (length(trim(justification_note)) >= 20), authorized_by uuid not null references auth.users(id), evidence_sha256 text not null, solana_signature text, created_at timestamptz not null default now());
create table public.claims (id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.policies(id), raw_client_statement text not null, drafted_intake jsonb, status text not null default 'drafting' check(status in ('drafting','reviewed','filed_with_carrier')), reviewed_by uuid references auth.users(id), reviewed_at timestamptz, created_at timestamptz not null default now());
create table public.renewal_outreach_log (id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.policies(id), interval_days integer not null, outreach_type text not null, outreach_at timestamptz not null default now(), response_received boolean not null default false, unique(policy_id,interval_days));
create table public.audit_events (id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id), actor_id uuid references auth.users(id), event_type text not null, entity_type text not null, entity_id uuid not null, payload jsonb not null default '{}'::jsonb, evidence_sha256 text not null, solana_signature text, created_at timestamptz not null default now());

create or replace function public.reject_mutation() returns trigger language plpgsql as $$ begin raise exception 'immutable audit record'; end $$;
create trigger prebind_fulfillments_no_update_or_delete before update or delete on public.prebind_fulfillments for each row execute function public.reject_mutation();
create trigger bind_overrides_no_update_or_delete before update or delete on public.bind_overrides for each row execute function public.reject_mutation();
create trigger audit_events_no_update_or_delete before update or delete on public.audit_events for each row execute function public.reject_mutation();

create or replace function public.enforce_bind_transition() returns trigger language plpgsql security definer set search_path=public as $$
declare missing_count integer; actor public.staff_profiles%rowtype; override_count integer;
begin
  if new.status='bound' and old.status is distinct from 'bound' then
    select count(*) into missing_count from public.prebind_requirements requirement
      where requirement.policy_type_id=new.policy_type_id and requirement.mandatory
      and not exists(select 1 from public.prebind_fulfillments fulfillment where fulfillment.policy_id=new.id and fulfillment.requirement_id=requirement.id and fulfillment.fulfilled);
    if missing_count>0 then
      select * into actor from public.staff_profiles where id=auth.uid();
      select count(*) into override_count from public.bind_overrides where policy_id=new.id and authorized_by=auth.uid();
      if actor.id is null or not(actor.role='agency_principal' or (actor.role='licensed_agent' and actor.bind_override_delegated)) or override_count=0 then
        raise exception 'binding blocked: mandatory pre-bind evidence is missing';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger policies_enforce_bind before update of status on public.policies for each row execute function public.enforce_bind_transition();

alter table public.staff_profiles enable row level security; alter table public.clients enable row level security; alter table public.policies enable row level security; alter table public.prebind_fulfillments enable row level security; alter table public.bind_overrides enable row level security; alter table public.claims enable row level security; alter table public.renewal_outreach_log enable row level security; alter table public.audit_events enable row level security;

create function public.current_agency_id() returns uuid language sql stable security definer set search_path=public as $$ select agency_id from public.staff_profiles where id=auth.uid() $$;
create policy staff_read_own_profile on public.staff_profiles for select using(id=auth.uid() or agency_id=public.current_agency_id());
create policy agency_clients on public.clients for all using(agency_id=public.current_agency_id()) with check(agency_id=public.current_agency_id());
create policy agency_policies_read on public.policies for select using(exists(select 1 from public.clients c where c.id=client_id and c.agency_id=public.current_agency_id()));
create policy licensed_policy_updates on public.policies for update using(exists(select 1 from public.staff_profiles s where s.id=auth.uid() and s.role in('agency_principal','licensed_agent')));
create policy fulfillment_read on public.prebind_fulfillments for select using(exists(select 1 from public.policies p join public.clients c on c.id=p.client_id where p.id=policy_id and c.agency_id=public.current_agency_id()));
create policy fulfillment_insert on public.prebind_fulfillments for insert with check(exists(select 1 from public.staff_profiles s where s.id=auth.uid() and s.role in('agency_principal','licensed_agent')));
create policy override_read on public.bind_overrides for select using(exists(select 1 from public.policies p join public.clients c on c.id=p.client_id where p.id=policy_id and c.agency_id=public.current_agency_id()));
create policy override_insert on public.bind_overrides for insert with check(exists(select 1 from public.staff_profiles s where s.id=auth.uid() and (s.role='agency_principal' or(s.role='licensed_agent' and s.bind_override_delegated))));
create policy claims_agency_access on public.claims for all using(exists(select 1 from public.policies p join public.clients c on c.id=p.client_id where p.id=policy_id and c.agency_id=public.current_agency_id()));
create policy renewal_agency_access on public.renewal_outreach_log for all using(exists(select 1 from public.policies p join public.clients c on c.id=p.client_id where p.id=policy_id and c.agency_id=public.current_agency_id()));
create policy audit_read_only on public.audit_events for select using(agency_id=public.current_agency_id());

revoke update,delete on public.prebind_fulfillments,public.bind_overrides,public.audit_events from authenticated,anon;

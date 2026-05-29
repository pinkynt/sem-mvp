create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('admin', 'operator')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permit_holder_accounts (
  id uuid primary key default gen_random_uuid(),
  permit_holder_id uuid not null unique references public.permit_holders(id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  password_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.permit_holders
  add column if not exists updated_at timestamptz not null default now();

alter table public.user_profiles enable row level security;
alter table public.permit_holder_accounts enable row level security;

create or replace function public.is_dashboard_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.active = true
      and profile.role in ('admin', 'operator')
  );
$$;

drop policy if exists "dashboard users read profiles" on public.user_profiles;
create policy "dashboard users read profiles" on public.user_profiles for select to authenticated using (public.is_dashboard_user());
drop policy if exists "dashboard users read zones" on public.zones;
create policy "dashboard users read zones" on public.zones for select to authenticated using (public.is_dashboard_user());
drop policy if exists "dashboard users read tariffs" on public.tariffs;
create policy "dashboard users read tariffs" on public.tariffs for select to authenticated using (public.is_dashboard_user());
drop policy if exists "dashboard users read permit holders" on public.permit_holders;
create policy "dashboard users read permit holders" on public.permit_holders for select to authenticated using (public.is_dashboard_user());
drop policy if exists "dashboard users read sessions" on public.parking_sessions;
create policy "dashboard users read sessions" on public.parking_sessions for select to authenticated using (public.is_dashboard_user());
drop policy if exists "dashboard users read payments" on public.payments;
create policy "dashboard users read payments" on public.payments for select to authenticated using (public.is_dashboard_user());
drop policy if exists "dashboard users read gateway refs" on public.payment_gateway_refs;
create policy "dashboard users read gateway refs" on public.payment_gateway_refs for select to authenticated using (public.is_dashboard_user());
drop policy if exists "dashboard users read permit holder accounts" on public.permit_holder_accounts;
create policy "dashboard users read permit holder accounts" on public.permit_holder_accounts for select to authenticated using (public.is_dashboard_user());

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at before update on public.user_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_permit_holders_updated_at on public.permit_holders;
create trigger set_permit_holders_updated_at before update on public.permit_holders for each row execute function public.set_updated_at();
drop trigger if exists set_permit_holder_accounts_updated_at on public.permit_holder_accounts;
create trigger set_permit_holder_accounts_updated_at before update on public.permit_holder_accounts for each row execute function public.set_updated_at();

do $$
begin
  alter publication supabase_realtime add table public.payments;
exception when duplicate_object then null; when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.parking_sessions;
exception when duplicate_object then null; when undefined_object then null;
end $$;

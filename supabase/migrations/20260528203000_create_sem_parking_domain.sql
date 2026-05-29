create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tariffs (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones(id),
  vehicle_kind text not null check (vehicle_kind in ('auto', 'moto')),
  label text not null,
  hourly_rate_cents integer not null check (hourly_rate_cents > 0),
  digital_discount_percent integer not null default 0 check (digital_discount_percent between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (zone_id, vehicle_kind, active)
);

create table if not exists public.permit_holders (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones(id),
  display_name text not null,
  file_number text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.parking_sessions (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones(id),
  permit_holder_id uuid not null references public.permit_holders(id),
  license_plate text not null,
  vehicle_kind text not null check (vehicle_kind in ('auto', 'moto')),
  status text not null default 'active' check (status in ('active', 'closed')),
  started_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones(id),
  permit_holder_id uuid not null references public.permit_holders(id),
  parking_session_id uuid references public.parking_sessions(id),
  license_plate text not null,
  vehicle_kind text not null check (vehicle_kind in ('auto', 'moto')),
  method text not null check (method in ('cash', 'digital')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'expired', 'cancelled', 'failed', 'refunded')),
  amount_cents integer not null check (amount_cents >= 0),
  base_amount_cents integer not null check (base_amount_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  valid_until timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_gateway_refs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  provider text not null check (provider in ('mercadopago')),
  provider_order_id text unique,
  provider_payment_id text,
  external_reference text not null unique,
  qr_data text,
  qr_image_data_url text,
  raw_provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists parking_sessions_active_idx
  on public.parking_sessions (permit_holder_id, status, started_at desc);

create unique index if not exists parking_sessions_one_active_plate_idx
  on public.parking_sessions (permit_holder_id, license_plate)
  where status = 'active';

create index if not exists payments_permit_holder_created_at_idx
  on public.payments (permit_holder_id, created_at desc);

create unique index if not exists payments_one_open_close_payment_idx
  on public.payments (parking_session_id)
  where parking_session_id is not null and status in ('pending', 'confirmed');

create index if not exists payment_gateway_refs_provider_order_id_idx
  on public.payment_gateway_refs (provider_order_id);

create unique index if not exists payment_gateway_refs_payment_id_idx
  on public.payment_gateway_refs (payment_id);

alter table public.zones enable row level security;
alter table public.tariffs enable row level security;
alter table public.permit_holders enable row level security;
alter table public.parking_sessions enable row level security;
alter table public.payments enable row level security;
alter table public.payment_gateway_refs enable row level security;

drop trigger if exists set_parking_sessions_updated_at on public.parking_sessions;
create trigger set_parking_sessions_updated_at
before update on public.parking_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_gateway_refs_updated_at on public.payment_gateway_refs;
create trigger set_payment_gateway_refs_updated_at
before update on public.payment_gateway_refs
for each row execute function public.set_updated_at();

insert into public.zones (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Centro A')
on conflict (name) do update set active = excluded.active;

insert into public.tariffs (
  id,
  zone_id,
  vehicle_kind,
  label,
  hourly_rate_cents,
  digital_discount_percent
)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'auto', 'Auto', 70000, 20),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'moto', 'Moto', 30000, 20)
on conflict (zone_id, vehicle_kind, active) do update set
  label = excluded.label,
  hourly_rate_cents = excluded.hourly_rate_cents,
  digital_discount_percent = excluded.digital_discount_percent;

insert into public.permit_holders (id, zone_id, display_name, file_number)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Juan Pérez',
  'DEMO-001'
)
on conflict (file_number) do update set
  zone_id = excluded.zone_id,
  display_name = excluded.display_name,
  active = true;

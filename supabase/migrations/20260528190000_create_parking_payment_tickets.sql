create table if not exists public.parking_payment_tickets (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  mercado_pago_order_id text unique,
  mercado_pago_payment_id text,
  amount numeric(12, 2) not null,
  description text not null,
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'expired', 'cancelled', 'refunded', 'failed')
  ),
  status_detail text,
  qr_data text,
  provider_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists parking_payment_tickets_status_idx
  on public.parking_payment_tickets (status);

create index if not exists parking_payment_tickets_mercado_pago_order_id_idx
  on public.parking_payment_tickets (mercado_pago_order_id);

alter table public.parking_payment_tickets enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_parking_payment_tickets_updated_at
  on public.parking_payment_tickets;

create trigger set_parking_payment_tickets_updated_at
before update on public.parking_payment_tickets
for each row
execute function public.set_updated_at();

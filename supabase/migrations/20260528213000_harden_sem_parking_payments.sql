alter table public.payments
  drop constraint if exists payments_status_check;

alter table public.payments
  add constraint payments_status_check
  check (status in ('pending', 'confirmed', 'expired', 'cancelled', 'failed', 'refunded'));

create unique index if not exists parking_sessions_one_active_plate_idx
  on public.parking_sessions (permit_holder_id, license_plate)
  where status = 'active';

create unique index if not exists payments_one_open_close_payment_idx
  on public.payments (parking_session_id)
  where parking_session_id is not null and status in ('pending', 'confirmed');

create unique index if not exists payment_gateway_refs_payment_id_idx
  on public.payment_gateway_refs (payment_id);

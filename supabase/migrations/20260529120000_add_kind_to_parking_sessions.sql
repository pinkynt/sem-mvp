alter table public.parking_sessions
  add column if not exists kind text not null default 'pospago'
  check (kind in ('prepago','pospago'));

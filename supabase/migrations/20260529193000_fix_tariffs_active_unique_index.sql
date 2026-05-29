alter table public.tariffs
  drop constraint if exists tariffs_zone_id_vehicle_kind_active_key;

create unique index if not exists tariffs_one_active_per_zone_vehicle_idx
  on public.tariffs (zone_id, vehicle_kind)
  where active = true;

-- Seed QA permit holder login account for demo testing.
-- Username: demo
-- Password: demo1234  (CLEARTEXT, demo-only — do NOT use in production)
-- Hash regenerated with:
--   docker compose run --rm node node -e "
--     const {randomBytes, scrypt: s, timingSafeEqual} = require('crypto');
--     const {promisify} = require('util');
--     const scrypt = promisify(s);
--     const salt = randomBytes(16).toString('hex');
--     scrypt('demo1234', salt, 64).then(d => console.log('scrypt$' + salt + '$' + d.toString('hex')));
--   "

insert into public.permit_holders (id, display_name, file_number, zone_id, active)
select
  '00000000-0000-0000-0000-000000000d01',
  'Permisionario Demo',
  'DEMO-001',
  (select id from public.zones order by created_at limit 1),
  true
where exists (select 1 from public.zones limit 1)
on conflict (id) do nothing;

insert into public.permit_holder_accounts (
  permit_holder_id,
  username,
  password_hash,
  active,
  created_by,
  password_updated_at
)
values (
  '00000000-0000-0000-0000-000000000d01',
  'demo',
  'scrypt$63f47b5fe0be32ffae115e7214a50d52$a3cc3f81b72d057513bfb62f64e67a9e09a6aa92dcc9ab520e0fa8dc9b834330be930a071d3f25dc54d80766579cf54983e39997bbc468fc3328ba86bdd749b2',
  true,
  null,
  now()
)
on conflict (permit_holder_id) do nothing;

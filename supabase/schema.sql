-- Run in the Supabase SQL editor. Only the server service-role client can access this table.
create table if not exists public.shared_results (
 id uuid primary key default gen_random_uuid(),
 verdict jsonb not null,
 created_at timestamptz not null default now(),
 constraint valid_verdict check (
  jsonb_typeof(verdict) = 'object'
  and verdict ?& array['version','item','amount','lineId']
  and (verdict->>'version') in ('1','2')
  and char_length(verdict->>'item') between 1 and 40
  and (verdict->>'amount')::numeric between 1 and 999999999
 )
);
alter table public.shared_results enable row level security;
revoke all on table public.shared_results from anon, authenticated;
grant all on table public.shared_results to service_role;

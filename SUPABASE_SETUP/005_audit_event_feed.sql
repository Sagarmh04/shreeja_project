alter table public.audit_logs
add column if not exists event_key text;

alter table public.audit_logs
add column if not exists entity_type text;

alter table public.audit_logs
add column if not exists entity_id text;

alter table public.audit_logs
add column if not exists entity_label text;

alter table public.audit_logs
add column if not exists event_metadata jsonb;

update public.audit_logs
set event_key = coalesce(event_key, 'legacy_event')
where event_key is null;

alter table public.audit_logs
alter column event_key set not null;

create index if not exists audit_logs_event_key_idx
on public.audit_logs (event_key);

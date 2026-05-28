alter table public.audit_logs
add column if not exists change_on_label text;

-- Run this in the Supabase SQL editor after you replace the placeholders in .env.local
-- and after Drizzle has created the core tables from the schema.

create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('record-attachments', 'record-attachments', false)
on conflict (id) do nothing;

alter table if exists profiles enable row level security;
alter table if exists personal_records enable row level security;
alter table if exists record_attachments enable row level security;
alter table if exists audit_logs enable row level security;
alter table if exists login_history enable row level security;

create policy "profiles_select_own"
on profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on profiles for update
using (auth.uid() = id);

create policy "records_select_own"
on personal_records for select
using (auth.uid() = user_id);

create policy "records_insert_own"
on personal_records for insert
with check (auth.uid() = user_id);

create policy "records_update_own"
on personal_records for update
using (auth.uid() = user_id);

create policy "records_delete_own"
on personal_records for delete
using (auth.uid() = user_id);

create policy "attachments_select_own"
on record_attachments for select
using (auth.uid() = user_id);

create policy "attachments_insert_own"
on record_attachments for insert
with check (auth.uid() = user_id);

create policy "attachments_delete_own"
on record_attachments for delete
using (auth.uid() = user_id);

create policy "login_history_select_own"
on login_history for select
using (auth.uid() = user_id);

create policy "audit_logs_select_admin"
on audit_logs for select
using (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "storage_select_own"
on storage.objects for select
using (
  bucket_id = 'record-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'record-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_delete_own"
on storage.objects for delete
using (
  bucket_id = 'record-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

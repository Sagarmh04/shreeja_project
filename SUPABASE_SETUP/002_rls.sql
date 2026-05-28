create or replace function public.is_admin_email()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'admin@northernstar.com';
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin_email()
    or exists (
      select 1
      from public.profiles p
      where p.auth_user_id = auth.uid()
        and p.is_active = true
    );
$$;

alter table public.store_profile enable row level security;
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "store_profile_select_active_users" on public.store_profile;
create policy "store_profile_select_active_users"
on public.store_profile
for select
using (public.is_active_user());

drop policy if exists "store_profile_update_admin" on public.store_profile;
create policy "store_profile_update_admin"
on public.store_profile
for update
using (public.is_admin_email())
with check (public.is_admin_email());

drop policy if exists "profiles_select_admin_or_self" on public.profiles;
create policy "profiles_select_admin_or_self"
on public.profiles
for select
using (
  public.is_admin_email()
  or (
    auth.uid() = auth_user_id
    and public.is_active_user()
  )
);

drop policy if exists "profiles_update_admin_or_self" on public.profiles;
create policy "profiles_update_admin_or_self"
on public.profiles
for update
using (
  public.is_admin_email()
  or (
    auth.uid() = auth_user_id
    and public.is_active_user()
  )
)
with check (
  public.is_admin_email()
  or (
    auth.uid() = auth_user_id
    and public.is_active_user()
  )
);

drop policy if exists "items_select_active_or_admin" on public.items;
create policy "items_select_active_or_admin"
on public.items
for select
using (
  public.is_admin_email()
  or (public.is_active_user() and is_active = true)
);

drop policy if exists "items_insert_admin" on public.items;
create policy "items_insert_admin"
on public.items
for insert
with check (public.is_admin_email());

drop policy if exists "items_update_admin" on public.items;
create policy "items_update_admin"
on public.items
for update
using (public.is_admin_email())
with check (public.is_admin_email());

drop policy if exists "orders_select_admin_or_owner" on public.orders;
create policy "orders_select_admin_or_owner"
on public.orders
for select
using (
  public.is_admin_email()
  or (
    public.is_active_user()
    and ordered_by_user_id = public.current_profile_id()
  )
);

drop policy if exists "orders_insert_owner_only" on public.orders;
create policy "orders_insert_owner_only"
on public.orders
for insert
with check (
  public.is_active_user()
  and ordered_by_user_id = public.current_profile_id()
);

drop policy if exists "order_items_select_admin_or_order_owner" on public.order_items;
create policy "order_items_select_admin_or_order_owner"
on public.order_items
for select
using (
  public.is_admin_email()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.ordered_by_user_id = public.current_profile_id()
      and public.is_active_user()
  )
);

drop policy if exists "order_items_insert_admin_or_order_owner" on public.order_items;
create policy "order_items_insert_admin_or_order_owner"
on public.order_items
for insert
with check (
  public.is_admin_email()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.ordered_by_user_id = public.current_profile_id()
      and public.is_active_user()
  )
);

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
on public.audit_logs
for select
using (public.is_admin_email());

drop policy if exists "audit_logs_insert_current_user" on public.audit_logs;
create policy "audit_logs_insert_current_user"
on public.audit_logs
for insert
with check (
  public.is_active_user()
  and user_id = public.current_profile_id()
);

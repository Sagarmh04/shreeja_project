create extension if not exists pgcrypto;

create schema if not exists app_private;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.store_profile (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  store_name text not null,
  phone text not null,
  address text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'staff')),
  name text not null,
  staff_id text unique,
  phone text not null,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint staff_id_required_for_staff check (
    (role = 'admin' and staff_id is null) or (role = 'staff' and staff_id is not null)
  )
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  ordered_by_user_id uuid not null references public.profiles(id) on delete restrict,
  ordered_at timestamptz not null default timezone('utc', now()),
  order_number text not null unique default ('NS-' || nextval('public.order_number_seq')::text),
  total_discount numeric(10, 2) not null default 0 check (total_discount >= 0),
  total_price numeric(10, 2) not null check (total_price >= 0)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total_price numeric(10, 2) not null check (total_price >= 0)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default timezone('utc', now()),
  user_id uuid references public.profiles(id) on delete set null,
  change_type text not null,
  change_on_id text,
  change_on_label text,
  from_value jsonb,
  to_value jsonb
);

alter table public.audit_logs
add column if not exists change_on_label text;

create index if not exists profiles_auth_user_id_idx on public.profiles (auth_user_id);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists items_is_active_idx on public.items (is_active);
create index if not exists orders_ordered_by_user_id_idx on public.orders (ordered_by_user_id);
create index if not exists orders_ordered_at_idx on public.orders (ordered_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists audit_logs_timestamp_idx on public.audit_logs (timestamp desc);
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);

create trigger set_store_profile_updated_at
before update on public.store_profile
for each row
execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_items_updated_at
before update on public.items
for each row
execute function public.set_updated_at();

create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_role text;
  derived_name text;
  derived_staff_id text;
begin
  derived_role := case
    when new.email = 'admin@northernstar.com' then 'admin'
    else 'staff'
  end;

  derived_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, 'staff'), '@', 1)
  );

  derived_staff_id := case
    when derived_role = 'admin' then null
    else coalesce(
      nullif(new.raw_user_meta_data ->> 'staff_id', ''),
      'TEMP-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
    )
  end;

  insert into public.profiles (
    auth_user_id,
    role,
    name,
    staff_id,
    phone,
    email,
    is_active
  )
  values (
    new.id,
    derived_role,
    derived_name,
    derived_staff_id,
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.email, ''),
    true
  )
  on conflict (auth_user_id) do update
  set
    role = excluded.role,
    name = excluded.name,
    staff_id = excluded.staff_id,
    phone = excluded.phone,
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function app_private.handle_new_auth_user();

insert into public.profiles (
  auth_user_id,
  role,
  name,
  staff_id,
  phone,
  email,
  is_active
)
select
  u.id,
  case when u.email = 'admin@northernstar.com' then 'admin' else 'staff' end,
  coalesce(u.raw_user_meta_data ->> 'name', split_part(coalesce(u.email, 'staff'), '@', 1)),
  case
    when u.email = 'admin@northernstar.com' then null
    else coalesce(
      nullif(u.raw_user_meta_data ->> 'staff_id', ''),
      'TEMP-' || upper(substr(replace(u.id::text, '-', ''), 1, 8))
    )
  end,
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  coalesce(u.email, ''),
  true
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.auth_user_id = u.id
);

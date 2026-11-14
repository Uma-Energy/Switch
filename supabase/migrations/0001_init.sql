-- Switch: initial schema (rides, package dispatch, restaurant delivery)
create extension if not exists "pgcrypto";

create type user_role as enum ('customer','driver','admin');
create type service_type as enum ('ride','package','food');
create type job_status as enum ('requested','accepted','arrived','in_progress','completed','cancelled');
create type order_status as enum ('placed','confirmed','preparing','ready','picked_up','delivered','cancelled');
create type payment_method as enum ('cash','card','wallet');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'customer',
  full_name text,
  phone text unique,
  city text,
  created_at timestamptz not null default now()
);

create table drivers (
  id uuid primary key references profiles(id) on delete cascade,
  vehicle_type text not null check (vehicle_type in ('bike','car','van')),
  plate_number text,
  is_online boolean not null default false,
  lat double precision,
  lng double precision,
  verified boolean not null default false,
  rating numeric(3,2) default 5.00,
  updated_at timestamptz not null default now()
);

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id),
  name text not null,
  city text not null,
  address text,
  lat double precision,
  lng double precision,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  price_ngn integer not null check (price_ngn >= 0),
  available boolean not null default true
);

-- Rides and package dispatch share one jobs table
create table jobs (
  id uuid primary key default gen_random_uuid(),
  service service_type not null check (service in ('ride','package')),
  customer_id uuid not null references profiles(id),
  driver_id uuid references drivers(id),
  city text not null,
  pickup_address text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_address text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  distance_km numeric(6,2) not null,
  duration_min numeric(6,1) not null,
  fare_ngn integer not null,          -- upfront fare, locked at request time
  payment payment_method not null default 'cash',
  package_note text,
  status job_status not null default 'requested',
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  restaurant_id uuid not null references restaurants(id),
  driver_id uuid references drivers(id),
  dropoff_address text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  items_total_ngn integer not null,
  delivery_fee_ngn integer not null,  -- upfront
  payment payment_method not null default 'cash',
  status order_status not null default 'placed',
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  qty integer not null check (qty > 0),
  unit_price_ngn integer not null
);

create index on jobs (status, city);
create index on orders (status);
create index on drivers (is_online);

-- Row level security
alter table profiles enable row level security;
alter table drivers enable row level security;
alter table restaurants enable row level security;
alter table menu_items enable row level security;
alter table jobs enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create or replace function is_admin() returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create policy "own profile" on profiles for select using (id = auth.uid() or is_admin());
create policy "update own profile" on profiles for update using (id = auth.uid());
create policy "driver self" on drivers for all using (id = auth.uid() or is_admin());
create policy "public restaurants" on restaurants for select using (true);
create policy "public menu" on menu_items for select using (true);
create policy "admin manage restaurants" on restaurants for all using (is_admin());
create policy "customer own jobs" on jobs for select using (customer_id = auth.uid() or driver_id = auth.uid() or is_admin());
create policy "customer create jobs" on jobs for insert with check (customer_id = auth.uid());
create policy "driver sees open jobs" on jobs for select using (status = 'requested' and exists (select 1 from drivers d where d.id = auth.uid() and d.is_online and d.verified));
create policy "driver updates job" on jobs for update using (driver_id = auth.uid() or is_admin() or status = 'requested');
create policy "own orders" on orders for select using (customer_id = auth.uid() or driver_id = auth.uid() or is_admin());
create policy "customer create orders" on orders for insert with check (customer_id = auth.uid());
create policy "order items via order" on order_items for select using (exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or o.driver_id = auth.uid() or is_admin())));

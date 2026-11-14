-- Dispatch: lock down sensitive writes, add checked RPCs, auto-create profiles, enable realtime.

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Auto-create a profile row for every new auth user
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', nullif(new.phone, ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Profiles: users may edit only name, phone and city (never role)
drop policy "update own profile" on profiles;
create policy "update own profile" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on profiles from anon, authenticated;
grant update (full_name, phone, city) on profiles to authenticated;

-- Drivers: read own row; may toggle online and report location; never self-verify
drop policy "driver self" on drivers;
create policy "driver read" on drivers for select using (id = auth.uid() or is_admin());
create policy "driver update self" on drivers for update using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update on drivers from anon, authenticated;
grant update (is_online, lat, lng, updated_at) on drivers to authenticated;

-- Jobs: no direct updates; all changes go through the functions below
drop policy "driver updates job" on jobs;
revoke update, delete on jobs from anon, authenticated;
create index on jobs (customer_id);
create index on jobs (driver_id);
create index on orders (customer_id);
create index on orders (driver_id);

create or replace function register_driver(p_vehicle text, p_plate text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_vehicle not in ('bike','car','van') then raise exception 'invalid vehicle'; end if;
  if exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admins cannot register as drivers';
  end if;
  update profiles set role = 'driver' where id = auth.uid();
  insert into drivers (id, vehicle_type, plate_number) values (auth.uid(), p_vehicle, p_plate)
  on conflict (id) do update set vehicle_type = excluded.vehicle_type, plate_number = excluded.plate_number;
end $$;

create or replace function verify_driver(p_driver uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  update drivers set verified = p_ok, is_online = case when p_ok then is_online else false end where id = p_driver;
end $$;

create or replace function accept_job(p_job uuid) returns jobs
language plpgsql security definer set search_path = public as $$
declare j jobs;
begin
  if not exists (select 1 from drivers where id = auth.uid() and verified and is_online) then
    raise exception 'driver must be verified and online';
  end if;
  update jobs set driver_id = auth.uid(), status = 'accepted'
  where id = p_job and status = 'requested' and driver_id is null
  returning * into j;
  if j.id is null then raise exception 'job no longer available'; end if;
  return j;
end $$;

create or replace function advance_job(p_job uuid, p_status job_status) returns jobs
language plpgsql security definer set search_path = public as $$
declare j jobs; prev job_status;
begin
  prev := case p_status when 'arrived' then 'accepted' when 'in_progress' then 'arrived' when 'completed' then 'in_progress' end;
  if prev is null then raise exception 'invalid status'; end if;
  update jobs set status = p_status where id = p_job and driver_id = auth.uid() and status = prev returning * into j;
  if j.id is null then raise exception 'invalid transition'; end if;
  return j;
end $$;

create or replace function cancel_job(p_job uuid) returns jobs
language plpgsql security definer set search_path = public as $$
declare j jobs;
begin
  update jobs set status = 'cancelled'
  where id = p_job and customer_id = auth.uid() and status in ('requested','accepted') returning * into j;
  if j.id is null then raise exception 'cannot cancel this job'; end if;
  return j;
end $$;

revoke execute on function register_driver(text,text), verify_driver(uuid,boolean), accept_job(uuid), advance_job(uuid,job_status), cancel_job(uuid) from public, anon;
grant execute on function register_driver(text,text), verify_driver(uuid,boolean), accept_job(uuid), advance_job(uuid,job_status), cancel_job(uuid) to authenticated;

alter publication supabase_realtime add table jobs, orders;

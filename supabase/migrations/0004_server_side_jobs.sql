-- Jobs are now created only by the server (service role), with fares computed from the real route.
alter table jobs add column vehicle_type text not null default 'car' check (vehicle_type in ('bike','car','van'));
alter table jobs alter column vehicle_type drop default;

drop policy "customer create jobs" on jobs;
revoke insert on jobs from anon, authenticated;

-- Drivers only see and accept jobs that match their vehicle type
drop policy "driver sees open jobs" on jobs;
create policy "driver sees open jobs" on jobs for select using (
  status = 'requested' and exists (
    select 1 from drivers d where d.id = auth.uid() and d.is_online and d.verified and d.vehicle_type = jobs.vehicle_type
  )
);

create or replace function accept_job(p_job uuid) returns jobs
language plpgsql security definer set search_path = public as $$
declare j jobs;
begin
  if not exists (select 1 from drivers where id = auth.uid() and verified and is_online) then
    raise exception 'driver must be verified and online';
  end if;
  update jobs set driver_id = auth.uid(), status = 'accepted'
  where id = p_job and status = 'requested' and driver_id is null
    and vehicle_type = (select vehicle_type from drivers where id = auth.uid())
  returning * into j;
  if j.id is null then raise exception 'job no longer available'; end if;
  return j;
end $$;

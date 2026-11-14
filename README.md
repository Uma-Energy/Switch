# Switch

Rides, package dispatch and restaurant delivery across Nigeria. Upfront fares in NGN. Customer, Driver and Admin portals in one Next.js PWA, backed by Supabase.

## Run locally
```bash
cp .env.example .env.local   # Supabase URL, publishable key, service role key (+ optional MAPBOX_TOKEN)
npm install
npm run dev
```

## Structure
- `src/app/customer`, `driver`, `admin`: the three portals
- `src/lib/fare.ts`: upfront fare engine (NGN, per-vehicle and per-city rates)
- `supabase/migrations/0001_init.sql`: schema and row level security

## Database
Apply `supabase/migrations/` in order (0001 to 0004). Job changes go through checked functions
(`accept_job`, `advance_job`, `cancel_job`, `verify_driver`, `register_driver`); clients cannot edit roles, verification or job status directly.

Make your first admin in the SQL editor:
```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```

## Maps, routing and fares
Address search, route preview and pricing run on the server (`/api/geocode`, `/api/quote`, `/api/jobs`). The fare is computed from the real route and jobs are inserted with the service role, so clients cannot set their own price. Drivers only receive jobs that match their vehicle type.
Set `MAPBOX_TOKEN` for production (traffic-aware routing, better Nigerian addresses). Without it the app uses free OpenStreetMap services, which are for development only (no autocomplete at scale, rate limited).

## Status
Working: email sign-in, address search with route map, server-priced ride and package requests, realtime dispatch (accept, arrive, start, complete), cancellation, driver registration and admin verification, navigation link for drivers.
Next: restaurants and ordering, payments (Paystack/Flutterwave), phone OTP, rate limiting on the API routes, driver location tracking.

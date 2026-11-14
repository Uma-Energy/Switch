# Switch

Rides, package dispatch and restaurant delivery across Nigeria. Upfront fares in NGN. Customer, Driver and Admin portals in one Next.js PWA, backed by Supabase.

## Run locally
```bash
cp .env.example .env.local   # Supabase URL + publishable key (Project Settings > API)
npm install
npm run dev
```

## Structure
- `src/app/customer`, `driver`, `admin`: the three portals
- `src/lib/fare.ts`: upfront fare engine (NGN, per-vehicle and per-city rates)
- `supabase/migrations/0001_init.sql`: schema and row level security

## Database
Apply `supabase/migrations/` in order (0001 to 0003). Job changes go through checked functions
(`accept_job`, `advance_job`, `cancel_job`, `verify_driver`, `register_driver`); clients cannot edit roles, verification or job status directly.

Make your first admin in the SQL editor:
```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```

## Status
Working: email sign-in, ride and package requests, realtime driver dispatch (accept, arrive, start, complete), cancellation, driver registration and admin verification.
Known gaps: fares are computed in the browser (move server-side with routing), addresses use city-centre placeholder coordinates (needs maps and geocoding), phone OTP, restaurants and ordering, payments (Paystack/Flutterwave).

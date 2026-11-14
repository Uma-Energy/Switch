# Switch

Rides, package dispatch and restaurant delivery across Nigeria. Upfront fares in NGN. Customer, Driver and Admin portals in one Next.js PWA, backed by Supabase.

## Run locally
```bash
cp .env.example .env.local   # add your Supabase URL and anon key
npm install
npm run dev
```

## Structure
- `src/app/customer`, `driver`, `admin`: the three portals
- `src/lib/fare.ts`: upfront fare engine (NGN, per-vehicle and per-city rates)
- `supabase/migrations/0001_init.sql`: schema and row level security

## Status
Portals run on demo data. Next: Supabase auth, live job dispatch, maps and routing, restaurants and ordering, payments (Paystack/Flutterwave).

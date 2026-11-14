import Link from "next/link";

const services = [
  { title: "Rides", body: "Bike or car, with the fare locked in before you book." },
  { title: "Package dispatch", body: "Send parcels across town or between cities." },
  { title: "Food delivery", body: "Order from restaurants near you, delivered hot." },
];

const portals = [
  { href: "/customer", label: "Book now", sub: "Customer app" },
  { href: "/driver", label: "Drive with Switch", sub: "Driver app" },
  { href: "/admin", label: "Operations", sub: "Admin dashboard" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-charcoal-deep text-white">
      <section className="mx-auto max-w-5xl px-4 py-20">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-brand">Across Nigeria</p>
        <h1 className="max-w-2xl text-5xl font-bold leading-tight">
          Rides, packages and food. One app, one upfront price in naira.
        </h1>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {portals.map((p) => (
            <Link key={p.href} href={p.href} className="rounded-2xl bg-emerald-brand p-5 text-charcoal-deep transition hover:bg-emerald-400">
              <div className="text-lg font-bold">{p.label}</div>
              <div className="text-sm opacity-80">{p.sub}</div>
            </Link>
          ))}
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="rounded-2xl border border-white/10 bg-charcoal p-5">
              <h2 className="font-semibold text-emerald-brand">{s.title}</h2>
              <p className="mt-1 text-sm text-white/70">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

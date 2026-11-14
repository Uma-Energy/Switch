import Link from "next/link";

const nav = [
  { href: "/customer", label: "Customer" },
  { href: "/driver", label: "Driver" },
  { href: "/admin", label: "Admin" },
];

export function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-charcoal-deep text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-emerald-brand">Switch</span>
          </Link>
          <nav className="flex gap-1 text-sm">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 hover:bg-white/10">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}

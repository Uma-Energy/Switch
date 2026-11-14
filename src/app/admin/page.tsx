import { Shell } from "@/components/Shell";
import { formatNGN } from "@/lib/fare";

const stats = [
  { label: "Active trips", value: "128" },
  { label: "Drivers online", value: "342" },
  { label: "Pending verifications", value: "17" },
  { label: "Today's gross", value: formatNGN(4820000) },
];

const queue = [
  { name: "Chinedu O.", city: "Port Harcourt", vehicle: "Car", doc: "Licence + vehicle papers" },
  { name: "Aisha B.", city: "Kano", vehicle: "Bike", doc: "Licence" },
  { name: "Tunde A.", city: "Lagos", vehicle: "Van", doc: "Licence + vehicle papers" },
];

export default function AdminPage() {
  return (
    <Shell title="Operations">
      <p className="mb-4 text-sm text-charcoal/70">Demo figures until Supabase is connected.</p>
      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-sm text-charcoal/70">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>
      <h2 className="mb-2 mt-8 font-semibold">Driver verification queue</h2>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-charcoal-deep text-white">
            <tr>{["Driver", "City", "Vehicle", "Documents", ""].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {queue.map((d) => (
              <tr key={d.name} className="border-t border-black/5">
                <td className="px-4 py-2">{d.name}</td><td className="px-4 py-2">{d.city}</td>
                <td className="px-4 py-2">{d.vehicle}</td><td className="px-4 py-2">{d.doc}</td>
                <td className="px-4 py-2 text-right"><button className="rounded-full bg-emerald-brand px-3 py-1 font-medium text-charcoal-deep">Approve</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

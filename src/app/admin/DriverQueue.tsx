"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PendingDriver = {
  id: string; vehicle_type: string; plate_number: string | null;
  profiles: { full_name: string | null; city: string | null } | null;
};

export function DriverQueue({ drivers }: { drivers: PendingDriver[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function approve(id: string) {
    const { error } = await createClient().rpc("verify_driver", { p_driver: id, p_ok: true });
    setError(error?.message ?? "");
    router.refresh();
  }

  if (drivers.length === 0) return <p className="text-sm text-charcoal/70">No drivers waiting for verification.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      {error && <p className="p-3 text-sm text-red-600">{error}</p>}
      <table className="w-full text-left text-sm">
        <thead className="bg-charcoal-deep text-white">
          <tr>{["Driver", "City", "Vehicle", "Plate", ""].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr key={d.id} className="border-t border-black/5">
              <td className="px-4 py-2">{d.profiles?.full_name ?? "Unnamed"}</td>
              <td className="px-4 py-2">{d.profiles?.city ?? "-"}</td>
              <td className="px-4 py-2 capitalize">{d.vehicle_type}</td>
              <td className="px-4 py-2">{d.plate_number ?? "-"}</td>
              <td className="px-4 py-2 text-right">
                <button onClick={() => approve(d.id)} className="rounded-full bg-emerald-brand px-3 py-1 font-medium text-charcoal-deep">Approve</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

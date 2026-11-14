import { Suspense } from "react";
import { Shell } from "@/components/Shell";
import { formatNGN } from "@/lib/fare";
import { createClient } from "@/lib/supabase/server";
import { DriverQueue, type PendingDriver } from "./DriverQueue";

export default function AdminPage() {
  return (
    <Shell title="Operations">
      <Suspense fallback={<p className="text-sm">Loading...</p>}>
        <AdminContent />
      </Suspense>
    </Shell>
  );
}

async function AdminContent() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", auth.user!.id).single();
  if (me?.role !== "admin") {
    return <p className="rounded-2xl bg-white p-5 text-sm shadow-sm">You do not have access to the admin dashboard.</p>;
  }

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const [active, online, pending, gross] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }).in("status", ["accepted", "arrived", "in_progress"]),
    supabase.from("drivers").select("id", { count: "exact", head: true }).eq("is_online", true),
    supabase.from("drivers").select("id, vehicle_type, plate_number, profiles(full_name, city)").eq("verified", false),
    supabase.from("jobs").select("fare_ngn").eq("status", "completed").gte("created_at", startOfDay.toISOString()),
  ]);
  const total = (gross.data ?? []).reduce((s, j) => s + j.fare_ngn, 0);
  const stats = [
    { label: "Active trips", value: String(active.count ?? 0) },
    { label: "Drivers online", value: String(online.count ?? 0) },
    { label: "Pending verifications", value: String(pending.data?.length ?? 0) },
    { label: "Completed today", value: formatNGN(total) },
  ];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-sm text-charcoal/70">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>
      <h2 className="mb-2 mt-8 font-semibold">Driver verification queue</h2>
      <DriverQueue drivers={(pending.data ?? []) as unknown as PendingDriver[]} />
    </>
  );
}

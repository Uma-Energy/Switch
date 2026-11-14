"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatNGN } from "@/lib/fare";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABEL, type Job } from "@/lib/types";

type Driver = { id: string; vehicle_type: string; is_online: boolean; verified: boolean };
const NEXT: Record<string, { to: string; label: string }> = {
  accepted: { to: "arrived", label: "I have arrived" },
  arrived: { to: "in_progress", label: "Start trip" },
  in_progress: { to: "completed", label: "Complete trip" },
};

export function DriverPanel() {
  const supabase = useMemo(() => createClient(), []);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<Job[]>([]);
  const [current, setCurrent] = useState<Job | null>(null);
  const [vehicle, setVehicle] = useState("bike");
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const { data: d } = await supabase.from("drivers").select("*").eq("id", auth.user!.id).maybeSingle();
    setDriver(d as Driver | null);
    setLoaded(true);
    if (d?.verified) {
      const { data: mine } = await supabase.from("jobs").select("*").eq("driver_id", d.id)
        .in("status", ["accepted", "arrived", "in_progress"]).limit(1);
      setCurrent((mine?.[0] as Job) ?? null);
      if (d.is_online) {
        const { data: jobs } = await supabase.from("jobs").select("*").eq("status", "requested").order("created_at");
        setOpen((jobs as Job[]) ?? []);
      } else setOpen([]);
    }
  }, [supabase]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const ch = supabase.channel("driver-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, refresh]);

  const run = async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p;
    setError(error?.message ?? "");
    refresh();
  };

  if (!loaded) return <p className="text-sm">Loading...</p>;

  if (!driver) {
    return (
      <div className="max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Become a Switch driver</h2>
        <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2.5">
          <option value="bike">Bike</option><option value="car">Car</option><option value="van">Van</option>
        </select>
        <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Plate number" className="w-full rounded-xl border border-black/10 px-3 py-2.5" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={() => run(supabase.rpc("register_driver", { p_vehicle: vehicle, p_plate: plate }))}
          className="w-full rounded-xl bg-emerald-brand py-3 font-semibold text-charcoal-deep">Submit for verification</button>
      </div>
    );
  }

  if (!driver.verified) {
    return <p className="max-w-md rounded-2xl bg-white p-5 text-sm shadow-sm">Your application is awaiting verification by Switch. You will be able to go online once approved.</p>;
  }

  return (
    <div className="max-w-md space-y-4">
      <button onClick={() => run(supabase.from("drivers").update({ is_online: !driver.is_online, updated_at: new Date().toISOString() }).eq("id", driver.id))}
        className={`w-full rounded-2xl py-4 text-lg font-bold ${driver.is_online ? "bg-emerald-brand text-charcoal-deep" : "bg-charcoal-deep text-white"}`}>
        {driver.is_online ? "You are online" : "Go online"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {current && (
        <div className="rounded-2xl border-2 border-emerald-brand bg-white p-4">
          <div className="text-sm font-semibold text-emerald-deep">{STATUS_LABEL[current.status]}</div>
          <p className="mt-1">{current.pickup_address} to {current.dropoff_address}</p>
          {current.package_note && <p className="text-sm text-charcoal/70">Package: {current.package_note}</p>}
          <a target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-emerald-deep underline"
            href={`https://www.google.com/maps/dir/?api=1&destination=${current.status === "accepted" ? `${current.pickup_lat},${current.pickup_lng}` : `${current.dropoff_lat},${current.dropoff_lng}`}`}>
            Navigate to {current.status === "accepted" ? "pickup" : "drop-off"}
          </a>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-bold">{formatNGN(current.fare_ngn)}</span>
            {NEXT[current.status] && (
              <button onClick={() => run(supabase.rpc("advance_job", { p_job: current.id, p_status: NEXT[current.status].to }))}
                className="rounded-full bg-charcoal-deep px-4 py-1.5 text-sm text-white">{NEXT[current.status].label}</button>
            )}
          </div>
        </div>
      )}

      {driver.is_online && !current && (
        open.length === 0 ? <p className="text-sm text-charcoal/70">No requests right now. New ones appear here instantly.</p> : (
          <ul className="space-y-3">
            {open.map((j) => (
              <li key={j.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold capitalize text-emerald-deep">{j.service} · {j.city}</span>
                  <span>{j.distance_km} km</span>
                </div>
                <p className="mt-1">{j.pickup_address} to {j.dropoff_address}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xl font-bold">{formatNGN(j.fare_ngn)}</span>
                  <button onClick={() => run(supabase.rpc("accept_job", { p_job: j.id }))}
                    className="rounded-full bg-charcoal-deep px-4 py-1.5 text-sm text-white">Accept</button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

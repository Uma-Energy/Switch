"use client";
import { useEffect, useMemo, useState } from "react";
import { formatNGN, upfrontFare, type Service, type Vehicle } from "@/lib/fare";
import { CITIES, CITY_CENTRES } from "@/lib/cities";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABEL, type Job } from "@/lib/types";

const TABS: { id: Service; label: string }[] = [
  { id: "ride", label: "Ride" },
  { id: "package", label: "Package" },
  { id: "food", label: "Food" },
];

export function FareEstimator() {
  const supabase = useMemo(() => createClient(), []);
  const [service, setService] = useState<Service>("ride");
  const [city, setCity] = useState("Lagos");
  const [vehicle, setVehicle] = useState<Vehicle>("car");
  const [km, setKm] = useState(8);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [note, setNote] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const minutes = Math.round(km * 3.2); // placeholder until routing API
  const fare = useMemo(
    () => upfrontFare({ vehicle, distanceKm: km, durationMin: minutes, city, service }),
    [vehicle, km, minutes, city, service],
  );

  // Resume the customer's active job, then follow it in realtime.
  useEffect(() => {
    supabase
      .from("jobs")
      .select("*")
      .in("status", ["requested", "accepted", "arrived", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => data?.[0] && setJob(data[0] as Job));
  }, [supabase]);

  useEffect(() => {
    if (!job) return;
    const ch = supabase
      .channel(`job-${job.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${job.id}` },
        (p) => setJob(p.new as Job))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, job?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function request() {
    setBusy(true);
    setError("");
    const { data: auth } = await supabase.auth.getUser();
    const c = CITY_CENTRES[city];
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        service, customer_id: auth.user!.id, city,
        pickup_address: pickup, pickup_lat: c.lat, pickup_lng: c.lng,
        dropoff_address: dropoff, dropoff_lat: c.lat, dropoff_lng: c.lng,
        distance_km: km, duration_min: minutes, fare_ngn: fare,
        package_note: service === "package" ? note || null : null,
      })
      .select()
      .single();
    setBusy(false);
    if (error) setError(error.message);
    else setJob(data as Job);
  }

  async function cancel() {
    if (!job) return;
    const { data, error } = await supabase.rpc("cancel_job", { p_job: job.id });
    if (error) setError(error.message);
    else setJob(data as Job);
  }

  const input = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-charcoal-deep outline-none focus:border-emerald-brand";
  const active = job && !["completed", "cancelled"].includes(job.status);

  if (job) {
    return (
      <div className="max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="rounded-xl bg-charcoal-deep p-4 text-white">
          <div className="text-sm text-emerald-brand">{STATUS_LABEL[job.status]}</div>
          <div className="mt-1 text-2xl font-bold">{formatNGN(job.fare_ngn)}</div>
        </div>
        <p className="text-sm text-charcoal">{job.pickup_address} to {job.dropoff_address}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {active && ["requested", "accepted"].includes(job.status) && (
          <button onClick={cancel} className="w-full rounded-xl border border-black/10 py-2.5 text-sm">Cancel request</button>
        )}
        {!active && (
          <button onClick={() => setJob(null)} className="w-full rounded-xl bg-emerald-brand py-3 font-semibold text-charcoal-deep">Book another</button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex gap-1 rounded-full bg-black/5 p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setService(t.id)}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${service === t.id ? "bg-charcoal-deep text-white" : "text-charcoal"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {service === "food" ? (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-charcoal">
          Restaurant browsing and ordering is the next module. Delivery fees will use the same upfront engine.
        </p>
      ) : (
        <div className="space-y-3">
          <select className={input} value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className={input} placeholder="Pickup address" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          <input className={input} placeholder="Drop-off address" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
          {service === "package" && (
            <input className={input} placeholder="What are you sending?" value={note} onChange={(e) => setNote(e.target.value)} />
          )}
          <div className="flex gap-2">
            {(["bike", "car", "van"] as Vehicle[])
              .filter((v) => service === "package" || v !== "van")
              .map((v) => (
                <button key={v} onClick={() => setVehicle(v)}
                  className={`flex-1 rounded-xl border py-2 text-sm capitalize ${vehicle === v ? "border-emerald-brand bg-emerald-50 font-semibold" : "border-black/10"}`}>
                  {v}
                </button>
              ))}
          </div>
          <label className="block text-sm text-charcoal">
            Distance (demo until maps): {km} km
            <input type="range" min={1} max={40} value={km} onChange={(e) => setKm(+e.target.value)} className="w-full accent-emerald-600" />
          </label>
          <div className="flex items-baseline justify-between rounded-xl bg-charcoal-deep p-4 text-white">
            <span className="text-sm text-white/70">Upfront fare</span>
            <span className="text-2xl font-bold text-emerald-brand">{formatNGN(fare)}</span>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy || !pickup || !dropoff} onClick={request}
            className="w-full rounded-xl bg-emerald-brand py-3 font-semibold text-charcoal-deep hover:bg-emerald-400 disabled:opacity-50">
            Request {service === "ride" ? "ride" : "dispatch"}
          </button>
        </div>
      )}
    </div>
  );
}

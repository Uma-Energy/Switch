"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { AddressInput } from "@/components/AddressInput";
import { formatNGN, type Service, type Vehicle } from "@/lib/fare";
import { CITIES } from "@/lib/cities";
import type { Place } from "@/lib/geo";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABEL, type Job } from "@/lib/types";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-xl bg-black/5" />,
});

const TABS: { id: Service; label: string }[] = [
  { id: "ride", label: "Ride" },
  { id: "package", label: "Package" },
  { id: "food", label: "Food" },
];

type Quote = { distanceKm: number; durationMin: number; fare: number; geometry: [number, number][] };

export function FareEstimator() {
  const supabase = useMemo(() => createClient(), []);
  const [service, setService] = useState<Service>("ride");
  const [city, setCity] = useState("Lagos");
  const [vehicle, setVehicle] = useState<Vehicle>("car");
  const [pickup, setPickup] = useState<Place | null>(null);
  const [dropoff, setDropoff] = useState<Place | null>(null);
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const payload = useMemo(
    () => pickup && dropoff && service !== "food" ? {
      service, vehicle, city,
      pickup: { address: pickup.label, lat: pickup.lat, lng: pickup.lng },
      dropoff: { address: dropoff.label, lat: dropoff.lat, lng: dropoff.lng },
    } : null,
    [service, vehicle, city, pickup, dropoff],
  );

  // Server prices the real route; the browser never decides the fare.
  useEffect(() => {
    setQuote(null);
    if (!payload) return;
    const ctl = new AbortController();
    setQuoting(true);
    setError("");
    fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctl.signal })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Could not price this trip");
        setQuote(j as Quote);
      })
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => setQuoting(false));
    return () => ctl.abort();
  }, [payload]);

  // Resume the customer's active job, then follow it in realtime.
  useEffect(() => {
    supabase.from("jobs").select("*").in("status", ["requested", "accepted", "arrived", "in_progress"])
      .order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => data?.[0] && setJob(data[0] as Job));
  }, [supabase]);

  useEffect(() => {
    if (!job) return;
    const ch = supabase.channel(`job-${job.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${job.id}` },
        (p) => setJob(p.new as Job))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, job?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function request() {
    if (!payload) return;
    setBusy(true);
    setError("");
    const r = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, note: service === "package" ? note : undefined }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) setError(j.error ?? "Could not create the request");
    else setJob(j as Job);
  }

  async function cancel() {
    if (!job) return;
    const { data, error } = await supabase.rpc("cancel_job", { p_job: job.id });
    if (error) setError(error.message);
    else setJob(data as Job);
  }

  function reset() {
    setJob(null); setPickup(null); setDropoff(null); setQuote(null); setNote("");
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
        <RouteMap pickup={[job.pickup_lat, job.pickup_lng]} dropoff={[job.dropoff_lat, job.dropoff_lng]} geometry={null} />
        <p className="text-sm text-charcoal">{job.pickup_address} to {job.dropoff_address}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {active && ["requested", "accepted"].includes(job.status) && (
          <button onClick={cancel} className="w-full rounded-xl border border-black/10 py-2.5 text-sm">Cancel request</button>
        )}
        {!active && (
          <button onClick={reset} className="w-full rounded-xl bg-emerald-brand py-3 font-semibold text-charcoal-deep">Book another</button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex gap-1 rounded-full bg-black/5 p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setService(t.id); if (t.id === "ride" && vehicle === "van") setVehicle("car"); }}
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
          <select className={input} value={city} onChange={(e) => { setCity(e.target.value); setPickup(null); setDropoff(null); }}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <AddressInput key={`p-${city}`} placeholder="Pickup address" city={city} value={pickup} onSelect={setPickup} />
          <AddressInput key={`d-${city}`} placeholder="Drop-off address" city={city} value={dropoff} onSelect={setDropoff} />
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
          {(pickup || dropoff) && (
            <RouteMap pickup={pickup && [pickup.lat, pickup.lng]} dropoff={dropoff && [dropoff.lat, dropoff.lng]} geometry={quote?.geometry ?? null} />
          )}
          <div className="rounded-xl bg-charcoal-deep p-4 text-white">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-white/70">Upfront fare</span>
              <span className="text-2xl font-bold text-emerald-brand">
                {quote ? formatNGN(quote.fare) : quoting ? "Pricing..." : "-"}
              </span>
            </div>
            {quote && <p className="mt-1 text-xs text-white/60">{quote.distanceKm} km, about {Math.round(quote.durationMin)} min</p>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy || !quote || (service === "package" && !note.trim())} onClick={request}
            className="w-full rounded-xl bg-emerald-brand py-3 font-semibold text-charcoal-deep hover:bg-emerald-400 disabled:opacity-50">
            Request {service === "ride" ? "ride" : "dispatch"}
          </button>
        </div>
      )}
    </div>
  );
}

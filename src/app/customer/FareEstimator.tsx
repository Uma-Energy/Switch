"use client";
import { useMemo, useState } from "react";
import { formatNGN, upfrontFare, type Service, type Vehicle } from "@/lib/fare";

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin City", "Kaduna", "Owerri"];
const TABS: { id: Service; label: string }[] = [
  { id: "ride", label: "Ride" },
  { id: "package", label: "Package" },
  { id: "food", label: "Food" },
];

export function FareEstimator() {
  const [service, setService] = useState<Service>("ride");
  const [city, setCity] = useState("Lagos");
  const [vehicle, setVehicle] = useState<Vehicle>("car");
  const [km, setKm] = useState(8);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  // Placeholder: real distance and duration come from a routing API later.
  const minutes = Math.round(km * 3.2);
  const fare = useMemo(
    () => upfrontFare({ vehicle, distanceKm: km, durationMin: minutes, city, service }),
    [vehicle, km, minutes, city, service],
  );

  const input = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-charcoal-deep outline-none focus:border-emerald-brand";

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
            Distance (demo): {km} km
            <input type="range" min={1} max={40} value={km} onChange={(e) => setKm(+e.target.value)} className="w-full accent-emerald-600" />
          </label>
          <div className="flex items-baseline justify-between rounded-xl bg-charcoal-deep p-4 text-white">
            <span className="text-sm text-white/70">Upfront fare</span>
            <span className="text-2xl font-bold text-emerald-brand">{formatNGN(fare)}</span>
          </div>
          <button className="w-full rounded-xl bg-emerald-brand py-3 font-semibold text-charcoal-deep hover:bg-emerald-400">
            Request {service === "ride" ? "ride" : "dispatch"}
          </button>
        </div>
      )}
    </div>
  );
}

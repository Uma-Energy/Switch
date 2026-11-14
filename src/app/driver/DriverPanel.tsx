"use client";
import { useState } from "react";
import { formatNGN } from "@/lib/fare";

const DEMO_JOBS = [
  { id: "1", kind: "Ride", from: "Ikeja City Mall", to: "Victoria Island", km: 21, fare: 6200 },
  { id: "2", kind: "Package", from: "Yaba", to: "Lekki Phase 1", km: 18, fare: 5450 },
  { id: "3", kind: "Food", from: "Chicken Republic, Surulere", to: "Ojuelegba", km: 4, fare: 1500 },
];

export function DriverPanel() {
  const [online, setOnline] = useState(false);
  return (
    <div className="max-w-md space-y-4">
      <button onClick={() => setOnline(!online)}
        className={`w-full rounded-2xl py-4 text-lg font-bold ${online ? "bg-emerald-brand text-charcoal-deep" : "bg-charcoal-deep text-white"}`}>
        {online ? "You are online" : "Go online"}
      </button>
      {online ? (
        <ul className="space-y-3">
          {DEMO_JOBS.map((j) => (
            <li key={j.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-emerald-deep">{j.kind}</span>
                <span className="text-charcoal">{j.km} km</span>
              </div>
              <p className="mt-1 text-charcoal-deep">{j.from} to {j.to}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xl font-bold">{formatNGN(j.fare)}</span>
                <button className="rounded-full bg-charcoal-deep px-4 py-1.5 text-sm text-white">Accept</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-charcoal/70">Go online to see nearby requests. (Demo data until Supabase is connected.)</p>
      )}
    </div>
  );
}

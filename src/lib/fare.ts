// Upfront fare engine. All amounts in whole Nigerian naira (NGN).
export type Service = "ride" | "package" | "food";
export type Vehicle = "bike" | "car" | "van";

type Rate = { base: number; perKm: number; perMin: number; min: number };

// Starting rates; tune per city from the admin dashboard later.
const RATES: Record<Vehicle, Rate> = {
  bike: { base: 300, perKm: 90, perMin: 8, min: 600 },
  car: { base: 500, perKm: 150, perMin: 12, min: 1000 },
  van: { base: 1200, perKm: 260, perMin: 18, min: 2500 },
};

// Cost-of-operation multipliers by city tier.
const CITY_MULTIPLIER: Record<string, number> = {
  lagos: 1.15,
  abuja: 1.1,
  "port harcourt": 1.05,
};

export type FareInput = {
  vehicle: Vehicle;
  distanceKm: number;
  durationMin: number;
  city: string;
  surge?: number; // 1.0 = no surge
  service?: Service;
};

export function upfrontFare(i: FareInput): number {
  const r = RATES[i.vehicle];
  const cityMult = CITY_MULTIPLIER[i.city.trim().toLowerCase()] ?? 1;
  const surge = Math.min(Math.max(i.surge ?? 1, 1), 2.5);
  const pkgMult = i.service === "package" ? 1.1 : 1;
  const raw = (r.base + r.perKm * i.distanceKm + r.perMin * i.durationMin) * cityMult * surge * pkgMult;
  const rounded = Math.ceil(Math.max(raw, r.min) / 50) * 50;
  return rounded;
}

export const formatNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

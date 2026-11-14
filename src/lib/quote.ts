import { z } from "zod";
import { CITIES } from "./cities";
import { upfrontFare } from "./fare";
import { route } from "./geo";

const point = z.object({
  address: z.string().min(2).max(300),
  lat: z.number().min(3.5).max(14.5),   // Nigeria bounding box
  lng: z.number().min(2.5).max(15),
});

export const quoteSchema = z
  .object({
    service: z.enum(["ride", "package"]),
    vehicle: z.enum(["bike", "car", "van"]),
    city: z.enum(CITIES as [string, ...string[]]),
    pickup: point,
    dropoff: point,
    note: z.string().max(200).optional(),
  })
  .refine((v) => !(v.service === "ride" && v.vehicle === "van"), { message: "Vans are for packages only" });

export type QuoteInput = z.infer<typeof quoteSchema>;

export async function buildQuote(q: QuoteInput) {
  const rt = await route(q.pickup, q.dropoff);
  if (rt.distanceKm < 0.2) throw new Error("Pickup and drop-off are too close together");
  if (rt.distanceKm > 2000) throw new Error("Trip is too long");
  const fare = upfrontFare({
    vehicle: q.vehicle, distanceKm: rt.distanceKm, durationMin: rt.durationMin, city: q.city, service: q.service,
  });
  return { ...rt, fare };
}

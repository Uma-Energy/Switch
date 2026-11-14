import { NextResponse } from "next/server";
import { buildQuote, quoteSchema } from "@/lib/quote";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Jobs are created here, never from the browser, so the fare always comes from the server-side route.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const q = parsed.data;

  const { count } = await supabase.from("jobs").select("id", { count: "exact", head: true })
    .in("status", ["requested", "accepted", "arrived", "in_progress"]);
  if ((count ?? 0) > 0) return NextResponse.json({ error: "You already have an active request" }, { status: 409 });

  let quote;
  try {
    quote = await buildQuote(q);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not price this trip" }, { status: 422 });
  }

  const { data, error } = await createAdminClient().from("jobs").insert({
    service: q.service, vehicle_type: q.vehicle, customer_id: auth.user.id, city: q.city,
    pickup_address: q.pickup.address, pickup_lat: q.pickup.lat, pickup_lng: q.pickup.lng,
    dropoff_address: q.dropoff.address, dropoff_lat: q.dropoff.lat, dropoff_lng: q.dropoff.lng,
    distance_km: quote.distanceKm, duration_min: quote.durationMin, fare_ngn: quote.fare,
    package_note: q.service === "package" ? q.note ?? null : null,
  }).select().single();
  if (error) return NextResponse.json({ error: "Could not create the request" }, { status: 500 });
  return NextResponse.json(data);
}

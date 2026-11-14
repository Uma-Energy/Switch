import { NextResponse } from "next/server";
import { CITIES } from "@/lib/cities";
import { geocode } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const city = searchParams.get("city") ?? "";
  if (q.length < 3 || q.length > 200 || !CITIES.includes(city)) return NextResponse.json({ places: [] });
  try {
    return NextResponse.json({ places: await geocode(q, city) });
  } catch {
    return NextResponse.json({ error: "Address search is unavailable right now" }, { status: 502 });
  }
}

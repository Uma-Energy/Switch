import { NextResponse } from "next/server";
import { buildQuote, quoteSchema } from "@/lib/quote";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  try {
    return NextResponse.json(await buildQuote(parsed.data));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not price this trip" }, { status: 422 });
  }
}

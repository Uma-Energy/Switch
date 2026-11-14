"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    const { data, error } =
      mode === "up"
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (!data.session) return setMsg("Check your email to confirm your account, then sign in.");
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = next && next.startsWith("/") ? next : "/customer";
  }

  const input = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-charcoal-deep outline-none focus:border-emerald-brand";
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-deep px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h1 className="mb-1 text-2xl font-bold"><span className="text-emerald-deep">Switch</span></h1>
        <p className="mb-4 text-sm text-charcoal/70">{mode === "in" ? "Sign in to continue" : "Create your account"}</p>
        <div className="space-y-3">
          {mode === "up" && <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />}
          <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy || !email || password.length < 8} onClick={submit}
            className="w-full rounded-xl bg-emerald-brand py-3 font-semibold text-charcoal-deep disabled:opacity-50">
            {mode === "in" ? "Sign in" : "Sign up"}
          </button>
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <button className="w-full text-sm text-charcoal underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

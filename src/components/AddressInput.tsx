"use client";
import { useEffect, useState } from "react";
import type { Place } from "@/lib/geo";

export function AddressInput({
  placeholder, city, value, onSelect,
}: { placeholder: string; city: string; value: Place | null; onSelect: (p: Place | null) => void }) {
  const [text, setText] = useState(value?.label ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (value || text.trim().length < 3) { setResults([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(text)}&city=${encodeURIComponent(city)}`, { signal: ctl.signal });
        const j = await r.json();
        setResults(j.places ?? []);
        setNote(r.ok ? (j.places?.length ? "" : "No matches. Try a landmark or street name.") : j.error ?? "");
        setOpen(true);
      } catch { /* aborted */ }
    }, 400);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [text, city, value]);

  return (
    <div className="relative">
      <input
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-charcoal-deep outline-none focus:border-emerald-brand"
        placeholder={placeholder}
        value={text}
        onChange={(e) => { setText(e.target.value); if (value) onSelect(null); }}
        onFocus={() => setOpen(true)}
      />
      {open && !value && (results.length > 0 || note) && (
        <ul className="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-black/10 bg-white text-sm shadow-lg">
          {results.map((p) => (
            <li key={`${p.lat},${p.lng}`}>
              <button type="button" className="w-full px-3 py-2 text-left hover:bg-emerald-50"
                onClick={() => { setText(p.label); setOpen(false); onSelect(p); }}>
                {p.label}
              </button>
            </li>
          ))}
          {results.length === 0 && note && <li className="px-3 py-2 text-charcoal/70">{note}</li>}
        </ul>
      )}
    </div>
  );
}

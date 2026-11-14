// Geocoding and routing. Uses Mapbox when MAPBOX_TOKEN is set (recommended for production),
// otherwise falls back to OpenStreetMap services, which are for development only.
import { CITY_CENTRES } from "./cities";

export type Place = { label: string; lat: number; lng: number };
export type Route = { distanceKm: number; durationMin: number; geometry: [number, number][] }; // [lng, lat]

const MAPBOX = process.env.MAPBOX_TOKEN;
const UA = { "User-Agent": "Switch-dispatch/0.1 (dev)" };

export async function geocode(q: string, city: string): Promise<Place[]> {
  const c = CITY_CENTRES[city];
  if (MAPBOX) {
    const u = new URL("https://api.mapbox.com/search/geocode/v6/forward");
    u.search = new URLSearchParams({
      q: `${q}, ${city}`, country: "ng", proximity: `${c.lng},${c.lat}`, limit: "5", access_token: MAPBOX,
    }).toString();
    const r = await fetch(u, { cache: "no-store" });
    if (!r.ok) throw new Error("geocoding failed");
    const j = (await r.json()) as {
      features: { properties: { full_address?: string; name: string }; geometry: { coordinates: [number, number] } }[];
    };
    return j.features.map((f) => ({
      label: f.properties.full_address ?? f.properties.name,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
  }
  const d = 0.35;
  const u = new URL("https://nominatim.openstreetmap.org/search");
  u.search = new URLSearchParams({
    q, format: "jsonv2", countrycodes: "ng", limit: "5", bounded: "1",
    viewbox: `${c.lng - d},${c.lat + d},${c.lng + d},${c.lat - d}`,
  }).toString();
  const r = await fetch(u, { headers: UA, cache: "no-store" });
  if (!r.ok) throw new Error("geocoding failed");
  const j = (await r.json()) as { display_name: string; lat: string; lon: string }[];
  return j.map((p) => ({ label: p.display_name, lat: +p.lat, lng: +p.lon }));
}

export async function route(a: { lat: number; lng: number }, b: { lat: number; lng: number }): Promise<Route> {
  const coords = `${a.lng},${a.lat};${b.lng},${b.lat}`;
  let url: string;
  if (MAPBOX) {
    url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?geometries=geojson&overview=full&access_token=${MAPBOX}`;
  } else {
    url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  }
  const r = await fetch(url, { headers: MAPBOX ? undefined : UA, cache: "no-store" });
  if (!r.ok) throw new Error("routing failed");
  const j = (await r.json()) as {
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
  };
  const rt = j.routes?.[0];
  if (!rt) throw new Error("no route found");
  return {
    distanceKm: Math.round((rt.distance / 1000) * 100) / 100,
    durationMin: Math.round((rt.duration / 60) * 10) / 10,
    geometry: rt.geometry.coordinates,
  };
}

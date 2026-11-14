"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

type LL = [number, number];

function Fit({ points }: { points: LL[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 15);
    else if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 16 });
  }, [map, points]);
  return null;
}

export default function RouteMap({
  pickup, dropoff, geometry,
}: { pickup: LL | null; dropoff: LL | null; geometry: [number, number][] | null }) {
  const line = useMemo<LL[]>(() => (geometry ?? []).map(([lng, lat]) => [lat, lng]), [geometry]);
  const points = useMemo<LL[]>(
    () => (line.length ? line : ([pickup, dropoff].filter(Boolean) as LL[])),
    [line, pickup, dropoff],
  );
  return (
    <MapContainer center={[9.08, 8.67]} zoom={6} className="h-56 w-full rounded-xl" scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {line.length > 0 && <Polyline positions={line} pathOptions={{ color: "#10b981", weight: 5 }} />}
      {pickup && <CircleMarker center={pickup} radius={8} pathOptions={{ color: "#059669", fillColor: "#10b981", fillOpacity: 1 }} />}
      {dropoff && <CircleMarker center={dropoff} radius={8} pathOptions={{ color: "#111827", fillColor: "#1f2937", fillOpacity: 1 }} />}
      <Fit points={points} />
    </MapContainer>
  );
}

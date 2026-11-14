import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Switch",
    short_name: "Switch",
    description: "Rides, package dispatch and food delivery across Nigeria",
    start_url: "/customer",
    display: "standalone",
    background_color: "#111827",
    theme_color: "#10b981",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}

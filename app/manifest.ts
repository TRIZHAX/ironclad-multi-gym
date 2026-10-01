import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "IRONCLAD Multi-Gym System",
    short_name: "IRONCLAD",
    description: "Gym memberships, plans, and secure QR access in one place.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b100e",
    theme_color: "#0b100e",
    icons: [
      { src: "/icons/ironclad-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/ironclad-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/ironclad-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}

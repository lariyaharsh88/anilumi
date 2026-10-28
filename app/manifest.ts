import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    categories: ["entertainment"],
    shortcuts: [
      { name: "My list", url: "/my", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "This week's schedule", short_name: "Schedule", url: "/schedule", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
    background_color: "#0b0d13",
    theme_color: "#0b0d13",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}

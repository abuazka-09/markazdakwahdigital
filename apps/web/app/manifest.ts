import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MARKAZ DAKWAH DIGITAL",
    short_name: "Markaz",
    description: "Realtime Smart Education Dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#f7faf7",
    theme_color: "#1f6f5b",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pearl",
    short_name: "Pearl",
    description: "Period & cycle tracker — know your body, feel your best",
    start_url: "/calendario",
    display: "standalone",
    background_color: "#FFF9F5",
    theme_color: "#D4A0A0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

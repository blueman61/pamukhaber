import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pamuk Haber",
    short_name: "Pamuk Haber",
    description: "Sadece iç ısıtan haberler. Kaydır, gülümse.",
    lang: "tr",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffaf5",
    theme_color: "#fbcfe8",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

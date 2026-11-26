import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bitzy",
    short_name: "Bitzy",
    description: "Miles de juegos gratis y un creador de juegos con IA.",
    start_url: "/",
    display: "standalone",
    background_color: "#07070d",
    theme_color: "#07070d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

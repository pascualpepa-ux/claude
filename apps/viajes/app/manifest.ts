import type { MetadataRoute } from "next";

// Para cuando guardan Rumbo en la pantalla de inicio (Android; el iPhone usa app/apple-icon.png).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rumbo Traveling",
    short_name: "Rumbo",
    description: "Planificá tu viaje y dividí los gastos: itinerario, vuelos, hoteles, clima y presupuesto en un solo lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2ecdc",
    theme_color: "#575b40",
    lang: "es",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

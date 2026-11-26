import type { Metadata } from "next";
import { Creador } from "@/components/Creador";

export const metadata: Metadata = {
  title: "Creador de juegos con IA",
  description: "Creá tu propio videojuego charlando con una IA: describilo, jugalo al instante, cambialo hablando y publicalo en Bitzy.",
  alternates: { canonical: "/crear" },
};

export default async function Crear({ searchParams }: { searchParams: Promise<{ remix?: string }> }) {
  const { remix } = await searchParams;
  return <Creador key={remix ?? "nuevo"} remixId={remix} />;
}

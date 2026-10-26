import type { Metadata } from "next";
import { textosActuales } from "@/lib/idioma-servidor";
import { Suspense } from "react";
import { VistaViaje } from "./VistaViaje";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await textosActuales();
  return { title: t.meta.viaje };
}

export default function Viaje() {
  return (
    <Suspense>
      <VistaViaje />
    </Suspense>
  );
}

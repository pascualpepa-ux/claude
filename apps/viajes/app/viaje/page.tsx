import type { Metadata } from "next";
import { textosActuales } from "@/lib/idioma-servidor";
import { Suspense } from "react";
import { suscripcionesActivas } from "@/lib/suscripciones";
import { VistaViaje } from "./VistaViaje";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await textosActuales();
  return { title: t.meta.viaje };
}

export default function Viaje() {
  return (
    <Suspense>
      <VistaViaje suscripciones={suscripcionesActivas()} />
    </Suspense>
  );
}

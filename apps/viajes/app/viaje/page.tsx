import type { Metadata } from "next";
import { textosActuales } from "@/lib/idioma-servidor";
import { NO_INDEXAR, metadatosPagina } from "@/lib/seo";
import { Suspense } from "react";
import { suscripcionesActivas } from "@/lib/suscripciones";
import { VistaViaje } from "./VistaViaje";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ ejemplo?: string }> }): Promise<Metadata> {
  const { idioma, t } = await textosActuales();
  // El viaje de ejemplo es público; el viaje de cada persona es privado y no va a Google.
  if ((await searchParams).ejemplo === "1") {
    return metadatosPagina({ ruta: "/viaje?ejemplo=1", idioma, titulo: t.meta.ejemplo, descripcion: t.meta.ejemploDescripcion, tituloAbsoluto: true });
  }
  return { title: { absolute: t.meta.viaje }, robots: NO_INDEXAR };
}

export default function Viaje() {
  return (
    <Suspense>
      <VistaViaje suscripciones={suscripcionesActivas()} />
    </Suspense>
  );
}

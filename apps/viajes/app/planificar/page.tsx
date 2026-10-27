import type { Metadata } from "next";
import { textosActuales } from "@/lib/idioma-servidor";
import { metadatosPagina } from "@/lib/seo";
import { Asistente } from "./Asistente";

export async function generateMetadata(): Promise<Metadata> {
  const { idioma, t } = await textosActuales();
  return metadatosPagina({ ruta: "/planificar", idioma, titulo: t.meta.planificar, descripcion: t.meta.planificarDescripcion, tituloAbsoluto: true });
}

export default function Planificar() {
  return <Asistente />;
}

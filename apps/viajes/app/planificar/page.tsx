import type { Metadata } from "next";
import { textosActuales } from "@/lib/idioma-servidor";
import { Asistente } from "./Asistente";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await textosActuales();
  return { title: t.meta.planificar };
}

export default function Planificar() {
  return <Asistente />;
}

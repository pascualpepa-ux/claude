import type { Metadata } from "next";
import { dbConfigurada } from "@/lib/db";
import { textosActuales } from "@/lib/idioma-servidor";
import { suscriptorPorBaja } from "@/lib/suscripciones";
import { Baja } from "./Baja";

export const metadata: Metadata = { title: "Rumbo Traveling", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Pagina({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const { idioma: idiomaWeb } = await textosActuales();
  const s = t && dbConfigurada() ? await suscriptorPorBaja(t).catch(() => null) : null;
  return <Baja token={t ?? ""} email={s?.email ?? null} idioma={s?.idioma ?? idiomaWeb} yaDeBaja={s?.estado === "baja"} />;
}

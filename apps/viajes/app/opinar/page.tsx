import type { Metadata } from "next";
import { Calificacion } from "@/components/Calificacion";
import { textosActuales } from "@/lib/idioma-servidor";
import { metadatosPagina } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { idioma, t } = await textosActuales();
  return metadatosPagina({ ruta: "/opinar", idioma, titulo: t.opinion.metaTitulo, descripcion: t.opinion.metaDescripcion, tituloAbsoluto: true });
}

export default async function Opinar() {
  const { t } = await textosActuales();
  return (
    <main className="mx-auto max-w-xl px-4 pt-10 pb-20 md:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t.opinion.titulo}</h1>
      <p className="mt-3 text-arena-600 dark:text-arena-400">{t.opinion.bajada}</p>
      <div className="mt-8">
        <Calificacion pagina="/opinar" titulo={t.opinion.estrellas} />
      </div>
    </main>
  );
}

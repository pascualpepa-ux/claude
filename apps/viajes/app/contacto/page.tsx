import type { Metadata } from "next";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { FormularioContacto } from "@/components/FormularioContacto";
import { textosActuales } from "@/lib/idioma-servidor";
import { metadatosPagina } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { idioma, t } = await textosActuales();
  return metadatosPagina({ ruta: "/contacto", idioma, titulo: t.contacto.metaTitulo, descripcion: t.contacto.metaDescripcion, tituloAbsoluto: true });
}

export default async function Contacto() {
  const { t } = await textosActuales();
  const T = t.contacto;
  return (
    <main className="mx-auto max-w-xl px-4 pt-10 pb-20 md:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{T.titulo}</h1>
      <p className="mt-3 text-arena-600 dark:text-arena-400">{T.bajada}</p>
      <a
        href={`mailto:${T.email}`}
        className="mt-8 flex items-center gap-4 rounded-2xl border border-oliva-600/40 bg-oliva-100/60 p-5 transition hover:border-oliva-700 dark:border-oliva-300/30 dark:bg-oliva-900/40 dark:hover:border-oliva-300"
      >
        <EnvelopeSimple size={36} weight="duotone" className="shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
        <span>
          <span className="block text-sm text-arena-600 dark:text-arena-400">{T.porEmail}</span>
          <span className="block text-lg font-semibold break-all text-oliva-800 md:text-xl dark:text-oliva-100">{T.email}</span>
        </span>
      </a>
      <h2 className="mt-10 mb-4 text-lg font-semibold">{T.oFormulario}</h2>
      <FormularioContacto />
    </main>
  );
}

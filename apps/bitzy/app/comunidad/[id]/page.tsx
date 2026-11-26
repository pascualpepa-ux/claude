import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gamepad2, Repeat2, User } from "lucide-react";
import { listarComunidad, obtenerComunidad } from "@/lib/comunidad";
import { formatoNumero } from "@/lib/texto";
import { BotonCompartir } from "@/components/AccionesJuego";
import { BotonRemix, LikeComunidad, MarcoJuego } from "@/components/AccionesComunidad";
import { TarjetaComunidad } from "@/components/TarjetaComunidad";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const j = await obtenerComunidad((await params).id);
  if (!j) return { title: "Juego no encontrado" };
  return { title: `${j.titulo} — juego de ${j.autor}`, description: j.descripcion, alternates: { canonical: `/comunidad/${j.id}` }, openGraph: { title: j.titulo, description: j.descripcion } };
}

export default async function JuegoComunidad({ params }: P) {
  const j = await obtenerComunidad((await params).id);
  if (!j) notFound();
  const otros = (await listarComunidad(13)).filter((x) => x.id !== j.id).slice(0, 12);
  return (
    <div className="mx-auto max-w-[1300px] px-4 pb-10 pt-6 sm:px-6">
      <nav className="text-sm text-tenue"><Link href="/comunidad" className="hover:text-texto">Comunidad</Link> / <span className="text-texto">{j.titulo}</span></nav>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
        <MarcoJuego id={j.id} titulo={j.titulo} />
        <div>
          <span className="rounded-full bg-rosa px-2.5 py-1 text-[11px] font-bold uppercase text-fondo">Hecho por la comunidad</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{j.titulo}</h1>
          <p className="mt-2 flex items-center gap-4 text-sm text-tenue"><span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {j.autor}</span><span className="flex items-center gap-1.5"><Gamepad2 className="h-4 w-4" /> {formatoNumero(j.partidas)} partidas</span></p>
          {j.remixDe && <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-capa-2 px-3 py-2 text-sm text-tenue"><Repeat2 className="h-4 w-4 text-rosa" /> Remix de <Link href={`/comunidad/${j.remixDe.id}`} className="font-semibold text-texto hover:underline">{j.remixDe.titulo}</Link> de {j.remixDe.autor}</p>}
          <p className="mt-4 leading-relaxed text-tenue">{j.descripcion}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <LikeComunidad id={j.id} inicial={j.likes} />
            <BotonRemix id={j.id} />
            <BotonCompartir ruta={`/comunidad/${j.id}`} titulo={j.titulo} />
          </div>
          <p className="mt-6 text-xs text-tenue">Por seguridad, los juegos de la comunidad corren aislados: no tienen acceso a tu cuenta ni a internet.</p>
        </div>
      </div>
      {otros.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">Más de la comunidad</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{otros.map((x) => <TarjetaComunidad key={x.id} juego={x} />)}</div>
        </section>
      )}
    </div>
  );
}

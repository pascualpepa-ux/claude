"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMarca } from "./Logo";

export function Pie() {
  const ruta = usePathname();
  if (ruta.startsWith("/jugar/") || ruta.startsWith("/embed/")) return null;
  return (
    <footer className="mt-20 border-t border-borde/70 bg-capa-1/40 pb-24 lg:pb-0">
      <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-lg font-extrabold"><LogoMarca className="h-7 w-7" /> Playforge</div>
          <p className="mt-3 max-w-sm text-sm text-tenue">Miles de juegos gratis en tu navegador y un creador con IA para inventar los tuyos. Sin descargas, en celular, tablet o computadora.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Jugar</h3>
          <ul className="space-y-2 text-sm text-tenue">
            <li><Link className="hover:text-texto" href="/explorar">Explorar catálogo</Link></li>
            <li><Link className="hover:text-texto" href="/desafio">Desafío del día</Link></li>
            <li><Link className="hover:text-texto" href="/explorar?orden=nuevo">Novedades</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Crear</h3>
          <ul className="space-y-2 text-sm text-tenue">
            <li><Link className="hover:text-texto" href="/crear">Creador con IA</Link></li>
            <li><Link className="hover:text-texto" href="/comunidad">Hechos por la comunidad</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Géneros</h3>
          <ul className="space-y-2 text-sm text-tenue">
            <li><Link className="hover:text-texto" href="/explorar?genero=plataformas">Plataformas</Link></li>
            <li><Link className="hover:text-texto" href="/explorar?genero=carreras">Carreras</Link></li>
            <li><Link className="hover:text-texto" href="/explorar?genero=puzzles">Puzzles</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-borde/70">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-tenue sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Playforge</span>
          <span>Un proyecto de <strong className="font-semibold text-texto">Pascual Pepa</strong></span>
        </div>
      </div>
    </footer>
  );
}

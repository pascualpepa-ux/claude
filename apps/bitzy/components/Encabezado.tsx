"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Car, Compass, Dices, Home, Search, Sparkles, Trophy } from "lucide-react";
import { Logo } from "./Logo";
import { Ruleta } from "./Ruleta";

const ENLACES = [
  { href: "/", texto: "Inicio", icono: Home },
  { href: "/coches", texto: "Coches", icono: Car },
  { href: "/explorar", texto: "Explorar", icono: Compass },
  { href: "/desafio", texto: "Desafío", icono: Trophy },
  { href: "/crear", texto: "Crear con IA", icono: Sparkles },
];

export function Encabezado() {
  const ruta = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [ruleta, setRuleta] = useState(false);
  const [scroll, setScroll] = useState(false);
  const cerrar = useCallback(() => setRuleta(false), []);

  useEffect(() => {
    const f = () => setScroll(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  useEffect(() => {
    const abrir = () => setRuleta(true);
    window.addEventListener("pf:azar", abrir);
    return () => window.removeEventListener("pf:azar", abrir);
  }, []);

  if (ruta.startsWith("/jugar/") || ruta.startsWith("/embed/")) return null;
  const activo = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));

  return (
    <>
      <header className={`sticky top-0 z-50 transition-colors duration-300 ${scroll ? "border-b border-borde/70 bg-fondo/80 backdrop-blur-xl" : "border-b border-transparent"}`}>
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link href="/" className="shrink-0 transition-transform hover:scale-[1.03]" aria-label="Bitzy, inicio">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {ENLACES.map(({ href, texto, icono: I }) => (
              <Link key={href} href={href} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${activo(href) ? "bg-capa-3 text-texto" : "text-tenue hover:bg-capa-2 hover:text-texto"}`}>
                <I className="h-4 w-4" /> {texto}
              </Link>
            ))}
          </nav>
          <form
            className="relative ml-auto flex-1 sm:max-w-md"
            onSubmit={(e) => { e.preventDefault(); router.push(`/explorar${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }}
            role="search"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar juegos"
              aria-label="Buscar juegos"
              className="h-10 w-full rounded-xl border border-borde bg-capa-1/80 pl-10 pr-3 text-sm outline-none transition placeholder:text-tenue/70 focus:border-marca focus:bg-capa-2 focus:ring-4 focus:ring-marca/20"
            />
          </form>
          <button
            onClick={() => setRuleta(true)}
            className="group hidden items-center gap-2 rounded-xl bg-gradient-to-r from-ambar to-rosa px-4 py-2 text-sm font-bold text-fondo shadow-lg shadow-rosa/20 transition hover:scale-[1.03] hover:shadow-rosa/40 active:scale-95 sm:flex"
          >
            <Dices className="h-4 w-4 transition-transform duration-500 group-hover:rotate-[360deg]" /> Jugar algo al azar
          </button>
        </div>
      </header>
      {/* Barra inferior en celulares */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-borde bg-fondo/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Navegación principal">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {ENLACES.slice(0, 2).map(({ href, texto, icono: I }) => (
            <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${activo(href) ? "text-marca-2" : "text-tenue"}`}>
              <I className="h-5 w-5" /> {texto}
            </Link>
          ))}
          <button onClick={() => setRuleta(true)} className="-mt-5 flex flex-col items-center gap-0.5 text-[11px] text-tenue" aria-label="Jugar algo al azar">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-ambar to-rosa text-fondo shadow-lg shadow-rosa/30"><Dices className="h-6 w-6" /></span>
            Azar
          </button>
          {[ENLACES[2], ENLACES[4]].map(({ href, texto, icono: I }) => (
            <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${activo(href) ? "text-marca-2" : "text-tenue"}`}>
              <I className="h-5 w-5" /> {texto.replace(" con IA", "")}
            </Link>
          ))}
        </div>
      </nav>
      <Ruleta abierta={ruleta} cerrar={cerrar} />
    </>
  );
}

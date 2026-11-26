"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Maximize, Repeat2 } from "lucide-react";
import { leerLocal, escribirLocal } from "@/lib/cliente/local";

export function LikeComunidad({ id, inicial }: { id: string; inicial: number }) {
  const [likes, setLikes] = useState(inicial);
  const [dado, setDado] = useState(false);
  useEffect(() => setDado(leerLocal<string[]>("pf:likes", []).includes(id)), [id]);
  const alternar = async () => {
    const quitar = dado;
    setDado(!quitar); setLikes((l) => l + (quitar ? -1 : 1));
    const lista = leerLocal<string[]>("pf:likes", []);
    escribirLocal("pf:likes", quitar ? lista.filter((x) => x !== id) : [...lista, id]);
    fetch(`/api/comunidad/${id}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quitar }) }).catch(() => undefined);
  };
  return (
    <button onClick={alternar} aria-pressed={dado} className={`flex h-12 items-center gap-2 rounded-2xl border px-4 font-semibold transition active:scale-95 ${dado ? "border-rosa bg-rosa/15 text-rosa" : "border-borde bg-capa-2 hover:bg-capa-3"}`}>
      <Heart className="h-5 w-5" fill={dado ? "currentColor" : "none"} /> {likes.toLocaleString("es")}
    </button>
  );
}

export function BotonRemix({ id }: { id: string }) {
  return (
    <Link href={`/crear?remix=${id}`} className="flex h-12 items-center gap-2 rounded-2xl border border-marca/60 bg-marca/15 px-4 font-semibold transition hover:bg-marca/25">
      <Repeat2 className="h-5 w-5" /> Remix
    </Link>
  );
}

/** Reproductor de juegos de la comunidad: iframe aislado (sandbox sin same-origin). */
export function MarcoJuego({ id, titulo }: { id: string; titulo: string }) {
  const [activo, setActivo] = useState(false);
  const pantalla = () => document.getElementById("marco-juego")?.requestFullscreen?.().catch(() => undefined);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-borde bg-black" style={{ aspectRatio: "3 / 4", maxHeight: "78vh" }}>
      {activo ? (
        <>
          <iframe id="marco-juego" src={`/api/comunidad/${id}/html?jugar=1`} title={titulo} sandbox="allow-scripts" allow="autoplay; fullscreen" className="h-full w-full border-0" />
          <button onClick={pantalla} className="absolute right-3 top-3 rounded-xl bg-black/60 p-2 backdrop-blur hover:bg-black/80" aria-label="Pantalla completa"><Maximize className="h-4 w-4" /></button>
        </>
      ) : (
        <button onClick={() => setActivo(true)} className="group absolute inset-0 grid place-items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/portada/${id}`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105" />
          <span className="relative rounded-2xl bg-white px-8 py-4 text-lg font-extrabold text-fondo shadow-2xl transition group-hover:scale-105">▶ Jugar</span>
        </button>
      )}
    </div>
  );
}

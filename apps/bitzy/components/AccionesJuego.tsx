"use client";

import { useEffect, useState } from "react";
import { Check, Code2, Copy, Heart, Link2, Share2, Trophy, X } from "lucide-react";
import { alternarFavorito, favoritos, record, type Record } from "@/lib/cliente/local";

export function RecordPersonal({ id }: { id: string }) {
  const [r, setR] = useState<Record | null>(null);
  useEffect(() => setR(record(id)), [id]);
  if (!r) return <p className="text-sm text-tenue">Todavía no jugaste. ¡Marcá tu primer récord!</p>;
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-ambar" /> Récord: <strong>{r.puntos.toLocaleString("es")}</strong></span>
      <span className="text-tenue">{r.partidas} partidas · {r.victorias} victorias</span>
    </div>
  );
}

export function BotonFavorito({ id }: { id: string }) {
  const [fav, setFav] = useState(false);
  useEffect(() => setFav(favoritos().includes(id)), [id]);
  return (
    <button onClick={() => setFav(alternarFavorito(id))} aria-pressed={fav} className={`flex h-12 items-center gap-2 rounded-2xl border px-4 font-medium transition active:scale-95 ${fav ? "border-rosa bg-rosa/15 text-rosa" : "border-borde bg-capa-2 hover:bg-capa-3"}`}>
      <Heart className={`h-5 w-5 transition ${fav ? "scale-110" : ""}`} fill={fav ? "currentColor" : "none"} /> {fav ? "En favoritos" : "Favorito"}
    </button>
  );
}

/** Compartir: link directo (con vista previa), redes y código para insertar el juego. */
export function BotonCompartir({ ruta, titulo, rutaEmbed }: { ruta: string; titulo: string; rutaEmbed?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [origen, setOrigen] = useState("");
  useEffect(() => setOrigen(window.location.origin), []);
  const url = `${origen}${ruta}`;
  const embed = rutaEmbed ? `<iframe src="${origen}${rutaEmbed}" width="800" height="500" style="border:0;border-radius:12px;max-width:100%" allow="autoplay; fullscreen" title="${titulo.replace(/"/g, "&quot;")}"></iframe>` : "";
  const copiar = async (t: string, que: string) => { try { await navigator.clipboard.writeText(t); setCopiado(que); setTimeout(() => setCopiado(null), 1800); } catch {} };
  const compartir = async () => {
    if (navigator.share) { try { await navigator.share({ title: titulo, text: `¡Jugá ${titulo} en Bitzy!`, url }); return; } catch {} }
    setAbierto(true);
  };
  const texto = encodeURIComponent(`¡Jugá ${titulo} en Bitzy! ${url}`);
  return (
    <>
      <button onClick={compartir} onContextMenu={(e) => { e.preventDefault(); setAbierto(true); }} className="flex h-12 items-center gap-2 rounded-2xl border border-borde bg-capa-2 px-4 font-medium transition hover:bg-capa-3 active:scale-95">
        <Share2 className="h-5 w-5" /> Compartir
      </button>
      {rutaEmbed && <button onClick={() => setAbierto(true)} className="flex h-12 items-center gap-2 rounded-2xl border border-borde bg-capa-2 px-4 font-medium transition hover:bg-capa-3"><Code2 className="h-5 w-5" /> Insertar</button>}
      {abierto && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur animate-entrar" onClick={() => setAbierto(false)} role="dialog" aria-modal="true" aria-label="Compartir">
          <div className="w-full max-w-lg rounded-3xl border border-borde bg-capa-1 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Compartir «{titulo}»</h2><button onClick={() => setAbierto(false)} className="rounded-full p-1.5 hover:bg-capa-3" aria-label="Cerrar"><X className="h-5 w-5" /></button></div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
              <a className="rounded-2xl bg-[#25d366]/15 p-3 hover:bg-[#25d366]/25" href={`https://wa.me/?text=${texto}`} target="_blank" rel="noopener">WhatsApp</a>
              <a className="rounded-2xl bg-[#1d9bf0]/15 p-3 hover:bg-[#1d9bf0]/25" href={`https://twitter.com/intent/tweet?text=${texto}`} target="_blank" rel="noopener">X</a>
              <a className="rounded-2xl bg-[#1877f2]/15 p-3 hover:bg-[#1877f2]/25" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener">Facebook</a>
              <a className="rounded-2xl bg-[#229ed9]/15 p-3 hover:bg-[#229ed9]/25" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(titulo)}`} target="_blank" rel="noopener">Telegram</a>
            </div>
            <p className="mt-3 text-xs text-tenue">Para Instagram: copiá el link y pegalo en tu historia con el sticker de enlace.</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-tenue">Link directo</label>
            <div className="mt-1.5 flex gap-2"><input readOnly value={url} className="h-11 flex-1 rounded-xl border border-borde bg-capa-2 px-3 text-sm" onFocus={(e) => e.target.select()} /><button onClick={() => copiar(url, "link")} className="flex items-center gap-1.5 rounded-xl bg-marca px-4 text-sm font-semibold">{copiado === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} Copiar</button></div>
            {embed && <>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-tenue">Código para insertar en tu web</label>
              <textarea readOnly value={embed} rows={3} className="mt-1.5 w-full rounded-xl border border-borde bg-capa-2 p-3 font-mono text-xs" onFocus={(e) => e.target.select()} />
              <button onClick={() => copiar(embed, "embed")} className="mt-2 flex items-center gap-1.5 rounded-xl border border-borde px-4 py-2 text-sm">{copiado === "embed" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copiar código</button>
            </>}
          </div>
        </div>
      )}
    </>
  );
}

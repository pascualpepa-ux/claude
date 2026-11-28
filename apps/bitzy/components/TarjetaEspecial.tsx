import { Play } from "lucide-react";
import type { JuegoEspecial } from "@/lib/catalogo/especiales";

/** Portada de Heat City: costa neón al atardecer (dibujo vectorial, sin imágenes externas). */
function ArteHeatCity() {
  const edificios = [[20, 70], [60, 110], [95, 85], [130, 140], [170, 95], [205, 160], [245, 120], [285, 90], [320, 130], [360, 100], [395, 150], [435, 105], [470, 80]];
  return (
    <svg viewBox="0 0 520 260" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="hc-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a0f45" /><stop offset=".55" stopColor="#ff3d8b" /><stop offset="1" stopColor="#ff9a3d" /></linearGradient>
        <linearGradient id="hc-mar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b1f6e" /><stop offset="1" stopColor="#0d0a1a" /></linearGradient>
      </defs>
      <rect width="520" height="260" fill="url(#hc-cielo)" />
      <circle cx="380" cy="170" r="58" fill="#ffd23f" opacity=".9" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x="300" y={180 + i * 9} width="160" height="4" fill="#ff3d8b" opacity=".55" />)}
      {edificios.map(([x, h], i) => (
        <g key={i}>
          <rect x={x} y={200 - h} width="34" height={h} fill="#160c2c" />
          {Array.from({ length: Math.floor(h / 18) }, (_, k) => <rect key={k} x={x + 6 + (k % 2) * 14} y={208 - h + k * 16} width="7" height="6" fill={k % 3 ? "#ffd23f" : "#3ddcd0"} opacity=".8" />)}
        </g>
      ))}
      <rect y="200" width="520" height="60" fill="url(#hc-mar)" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={40 + i * 90} y={212 + (i % 2) * 14} width="50" height="2" fill="#ff7a3d" opacity=".5" />)}
      <g transform="translate(110 222)"><rect x="-26" y="-9" width="52" height="16" rx="6" fill="#ff3d8b" /><rect x="-12" y="-17" width="26" height="10" rx="4" fill="#ff3d8b" /><circle cx="-15" cy="8" r="5" fill="#0d0a1a" /><circle cx="15" cy="8" r="5" fill="#0d0a1a" /></g>
    </svg>
  );
}

export function TarjetaEspecial({ juego, compacta = false }: { juego: JuegoEspecial; compacta?: boolean }) {
  return (
    <a href={juego.url} className={`group relative block overflow-hidden rounded-[24px] border border-rosa/40 shadow-2xl shadow-rosa/10 ${compacta ? "min-h-[180px]" : "min-h-[240px]"}`}>
      <ArteHeatCity />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0a1a]/95 via-[#0d0a1a]/60 to-transparent transition group-hover:from-[#0d0a1a]/90" />
      <div className="relative flex h-full max-w-xl flex-col justify-end gap-2 p-6 sm:p-8">
        <span className="w-fit rounded-full bg-ambar px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-fondo">Exclusivo · {juego.bajada}</span>
        <h2 className="text-4xl font-black leading-none tracking-tight sm:text-5xl" style={{ background: "linear-gradient(180deg,#ffd23f,#ff7a3d 50%,#ff3d8b)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{juego.nombre.toUpperCase()}</h2>
        {!compacta && <p className="text-sm text-white/80 sm:text-base">{juego.descripcion}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-extrabold text-fondo transition group-hover:scale-[1.03]"><Play className="h-4 w-4" fill="currentColor" /> Jugar</span>
          {juego.etiquetas.map((e) => <span key={e} className="rounded-full bg-black/40 px-2.5 py-1 text-xs text-white/80 backdrop-blur">{e}</span>)}
        </div>
      </div>
    </a>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Gift, Play, Trophy } from "lucide-react";
import { desafioDelDia } from "@/lib/catalogo/consultas";
import { MOTORES } from "@/lib/catalogo/motores";
import { DIFICULTADES } from "@/lib/catalogo/tipos";
import { urlPortada } from "@/lib/portadas";
import { hoyUTC, sumarDias } from "@/lib/texto";
import { CuentaRegresiva } from "@/components/CuentaRegresiva";
import { RecordPersonal } from "@/components/AccionesJuego";
import { TarjetaJuego } from "@/components/TarjetaJuego";

export const revalidate = 600;
export const metadata: Metadata = { title: "Desafío del día", description: "Un juego distinto cada día, el mismo para todos. Superá a los demás antes de que termine el día.", alternates: { canonical: "/desafio" } };

export default function Desafio() {
  const hoy = hoyUTC();
  const j = desafioDelDia(hoy);
  const motor = MOTORES.find((m) => m.id === j.motor)!;
  const anteriores = [1, 2, 3, 4, 5, 6].map((d) => desafioDelDia(sumarDias(hoy, -d)));
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-8 sm:px-6">
      <div className="relative overflow-hidden rounded-[28px] border border-ambar/30 bg-gradient-to-br from-ambar/15 via-capa-1 to-capa-1 p-6 sm:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ambar"><Trophy className="h-4 w-4" /> Desafío del día · {new Date(`${hoy}T12:00:00Z`).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{j.nombre}</h1>
            <p className="mt-3 text-tenue">{motor.modos[j.modo].descripcion} Dificultad {DIFICULTADES[j.dificultad].toLowerCase()}.</p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-borde bg-capa-2/70 px-4 py-3">
              <Clock className="h-5 w-5 text-ambar" />
              <div><p className="text-xs text-tenue">El desafío cambia en</p><CuentaRegresiva className="text-2xl font-black" /></div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/jugar/${j.id}`} className="flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-ambar to-rosa px-8 text-lg font-extrabold text-fondo shadow-xl shadow-ambar/20 transition hover:scale-[1.03]"><Play className="h-6 w-6" fill="currentColor" /> Aceptar desafío</Link>
              <Link href={`/juego/${j.id}`} className="flex h-14 items-center rounded-2xl border border-borde px-6 font-semibold hover:bg-capa-2">Ver ficha</Link>
            </div>
            <div className="mt-6 rounded-2xl border border-borde bg-capa-1/70 p-4"><RecordPersonal id={j.id} /></div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlPortada(j.id)} alt={`Portada de ${j.nombre}`} width={640} height={400} className="w-full rounded-3xl border border-white/10 shadow-2xl" />
        </div>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { t: "El mismo para todos", d: "Cada día a las 00:00 (UTC) se elige un juego nuevo del catálogo. Todos juegan exactamente el mismo." },
          { t: "Ranking de 24 horas", d: "Tu mejor puntaje del día compite contra el de los demás. Al terminar el día, el ranking se reinicia." },
          { t: "Premios", d: "Los mejores del día ganan monedas e insignias para su perfil." },
        ].map((x, i) => (
          <div key={x.t} className="rounded-2xl border border-borde bg-capa-1 p-5">
            {i === 2 ? <Gift className="h-6 w-6 text-rosa" /> : <Trophy className="h-6 w-6 text-ambar" />}
            <h2 className="mt-3 font-bold">{x.t}</h2>
            <p className="mt-1 text-sm text-tenue">{x.d}</p>
          </div>
        ))}
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-bold">Desafíos anteriores</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{anteriores.map((x) => <TarjetaJuego key={x.id} juego={x} />)}</div>
      </section>
    </div>
  );
}

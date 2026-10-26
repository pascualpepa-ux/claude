import Link from "next/link";
import { ArrowRight, CloudSun, AirplaneTilt, Bed, Receipt } from "@phosphor-icons/react/dist/ssr";
import { TarjetaDia } from "@/components/TarjetaDia";
import { EstadoDato } from "@/components/EstadoDato";
import { generarViaje, viajeDeMuestra } from "@/lib/mock";
import { calcularResumen } from "@/lib/presupuesto";
import { usd } from "@/lib/dinero";

// Las fechas de la muestra dependen del día de hoy.
export const dynamic = "force-dynamic";

const AGENTES = [
  {
    Icono: CloudSun,
    area: "Clima",
    busca: "Trae el pronóstico de cada día del viaje para cada ciudad.",
    verifica: "Lo compara con una segunda fuente y avisa si la fecha está lejos y el pronóstico es poco confiable.",
  },
  {
    Icono: AirplaneTilt,
    area: "Vuelos",
    busca: "Busca de 3 a 5 opciones según tu aerolínea, clase, fechas y equipaje.",
    verifica: "Confirma que sigan disponibles, que el precio esté al día y que horarios y escalas tengan sentido.",
  },
  {
    Icono: Bed,
    area: "Hoteles",
    busca: "Busca opciones del tipo que elegiste, en buenas zonas y dentro de tu plan.",
    verifica: "Confirma todas las noches, el precio final con impuestos y las condiciones de cancelación.",
  },
];

export default function Inicio() {
  const plan = generarViaje(viajeDeMuestra());
  const resumen = calcularResumen(plan);
  const dia = plan.dias[1];
  const actividades = plan.actividades.filter((a) => dia.actividades.includes(a.id));
  const vuelo = plan.vuelos.find((v) => v.id === plan.vueloElegido)!;

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-16 md:grid-cols-[1.05fr_1fr] md:pt-20 md:pb-24">
        <div className="aparecer">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tighter text-balance md:text-5xl lg:text-6xl">
            Tu viaje armado, con cada precio a la vista.
          </h1>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Contestá unas preguntas y Rumbo arma el itinerario con vuelos, hoteles, clima y gastos divididos entre
            todos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/planificar"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white shadow-sm shadow-teal-900/20 transition hover:bg-teal-800 active:scale-[0.98] dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
            >
              Planificar mi viaje
              <ArrowRight size={18} weight="bold" aria-hidden />
            </Link>
            <Link
              href="/viaje?ejemplo=1"
              className="inline-flex items-center rounded-xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-900 transition hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Ver un ejemplo
            </Link>
          </div>
        </div>

        <div className="aparecer relative [animation-delay:120ms]" aria-label="Vista previa de un itinerario de ejemplo">
          <TarjetaDia numero={2} dia={dia} actividades={actividades} />
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:relative md:-ml-10 md:-mt-4 md:w-72 md:shadow-lg md:shadow-zinc-300/40 md:dark:shadow-black/40">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">5 días en China, 3 viajeros</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{usd(resumen.porPersona)}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">por persona, con vuelo de {vuelo.aerolinea}</p>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white py-16 md:py-24 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="max-w-[24ch] text-3xl font-semibold tracking-tight md:text-4xl">
            Cada dato pasa por dos agentes.
          </h2>
          <p className="mt-4 max-w-[60ch] text-zinc-600 dark:text-zinc-400">
            Uno busca y otro verifica. Si algo no se puede confirmar, no lo inventamos: queda marcado.
          </p>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-[repeat(3,minmax(0,1fr))]">
            {AGENTES.map(({ Icono, area, busca, verifica }) => (
              <div key={area} className="border-t-2 border-teal-700 pt-5 dark:border-teal-500">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Icono size={22} weight="duotone" className="text-teal-700 dark:text-teal-400" aria-hidden />
                  {area}
                </h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="font-medium">Busca</dt>
                    <dd className="text-zinc-600 dark:text-zinc-400">{busca}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Verifica</dt>
                    <dd className="text-zinc-600 dark:text-zinc-400">{verifica}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Sabés de dónde sale cada precio.</h2>
          <p className="mt-4 max-w-[52ch] text-zinc-600 dark:text-zinc-400">
            Cada precio muestra su fuente, cuándo se consultó y si está confirmado. Si algo cambia, te avisamos.
          </p>
        </div>
        <ul className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <li className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Receipt size={18} className="text-zinc-500" aria-hidden />
              Vuelo con {vuelo.aerolinea}
            </span>
            <span className="text-sm tabular-nums">{usd(vuelo.precioPorPersona)}</span>
          </li>
          <li>
            <EstadoDato origen={vuelo.origen} />
          </li>
          <li className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <EstadoDato origen={{ ...vuelo.origen, estado: "estimado" }} />
          </li>
          <li>
            <EstadoDato origen={{ ...vuelo.origen, estado: "no_verificado" }} />
          </li>
        </ul>
      </section>
    </main>
  );
}

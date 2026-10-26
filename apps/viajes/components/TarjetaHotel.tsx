import { ArrowSquareOut, Coffee, CalendarX, SignIn, SignOut, MapPin } from "@phosphor-icons/react/dist/ssr";
import { usd } from "@/lib/dinero";
import type { OpcionHotel } from "@/lib/types";
import { EstadoDato } from "./EstadoDato";

const NOMBRE_TIPO = { hostel: "Hostel", "3": "3 estrellas", "4": "4 estrellas", "5": "5 estrellas", depto: "Departamento" };

export function TarjetaHotel({
  hotel,
  noches,
  total,
  elegido,
  onElegir,
}: {
  hotel: OpcionHotel;
  noches: number;
  total: number;
  elegido: boolean;
  onElegir: () => void;
}) {
  const c = hotel.condiciones;
  const unidad = hotel.tipo === "hostel" ? "cama" : hotel.tipo === "depto" ? "departamento" : "habitación";
  return (
    <article
      className={`rounded-2xl border bg-papel p-4 transition sm:p-5 dark:bg-arena-900 ${
        elegido ? "border-oliva-700 ring-1 ring-oliva-700 dark:border-oliva-300 dark:ring-oliva-300" : "border-arena-200 dark:border-arena-800"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{hotel.nombre}</h3>
          <p className="flex items-center gap-1 text-sm text-arena-600 dark:text-arena-400">
            <MapPin size={14} aria-hidden />
            {hotel.zona}, {NOMBRE_TIPO[hotel.tipo]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums">{usd(hotel.precioNoche)}</p>
          <p className="text-xs text-arena-600 dark:text-arena-400">por noche y {unidad}, sin impuestos</p>
        </div>
      </header>

      <p className="mt-3 text-sm">
        <span className="font-medium">{usd(total)}</span>{" "}
        <span className="text-arena-600 dark:text-arena-400">
          por {noches} {noches === 1 ? "noche" : "noches"}, {hotel.habitaciones}{" "}
          {hotel.habitaciones === 1 ? unidad : unidad === "habitación" ? "habitaciones" : `${unidad}s`}, con {hotel.impuestosPct}% de impuestos y tasas
        </span>
      </p>

      <ul className="mt-3 grid gap-1.5 text-sm text-arena-700 sm:grid-cols-2 dark:text-arena-300">
        <li className="flex gap-2"><Coffee size={18} className="shrink-0 text-arena-500" aria-hidden />{c.desayuno}</li>
        <li className="flex gap-2"><CalendarX size={18} className="shrink-0 text-arena-500" aria-hidden />{c.cancelacion}</li>
        <li className="flex gap-2"><SignIn size={18} className="shrink-0 text-arena-500" aria-hidden />Check-in {c.checkIn.toLowerCase()}</li>
        <li className="flex gap-2"><SignOut size={18} className="shrink-0 text-arena-500" aria-hidden />Check-out {c.checkOut.toLowerCase()}</li>
      </ul>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <EstadoDato origen={hotel.origen} />
        <div className="flex gap-2">
          <a
            href={hotel.linkReserva}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-arena-700 transition hover:bg-arena-100 dark:text-arena-300 dark:hover:bg-arena-800"
          >
            Reservar
            <ArrowSquareOut size={16} aria-hidden />
          </a>
          <button
            type="button"
            onClick={onElegir}
            aria-pressed={elegido}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[0.98] ${
              elegido
                ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950"
                : "border border-arena-300 hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800"
            }`}
          >
            {elegido ? "Elegido" : "Elegir"}
          </button>
        </div>
      </footer>
    </article>
  );
}

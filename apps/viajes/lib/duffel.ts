// Venta de vuelos dentro de la web con Duffel (agencia acreditada que emite el pasaje con la aerolínea).
// Solo servidor. La clave vive en DUFFEL_ACCESS_TOKEN (Vercel), nunca en el código.
// Con una clave de prueba (duffel_test_...) los vuelos y los pagos son de mentira.

const BASE = "https://api.duffel.com";

export const duffelConfigurado = () => !!process.env.DUFFEL_ACCESS_TOKEN;
export const modoPrueba = () => (process.env.DUFFEL_ACCESS_TOKEN ?? "").startsWith("duffel_test_");
/** Con clave real, no se vende hasta que esté conectado el cobro con tarjeta al cliente. */
export const ventaPermitida = () => duffelConfigurado() && (modoPrueba() || process.env.RESERVAS_COBRO_ACTIVO === "1");

export class ErrorDuffel extends Error {
  constructor(
    public status: number,
    public detalle: string,
  ) {
    super(`Duffel ${status}: ${detalle}`);
  }
}

async function pedir<T>(ruta: string, cuerpo?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${ruta}`, {
    method: cuerpo ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
      "Duffel-Version": "v2",
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: cuerpo ? JSON.stringify({ data: cuerpo }) : undefined,
    cache: "no-store",
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = (j as { errors?: { message?: string; title?: string }[] }).errors?.[0];
    throw new ErrorDuffel(res.status, e?.message || e?.title || "error");
  }
  return (j as { data: T }).data;
}

/** Nuestra comisión, sumada al precio de la aerolínea: un porcentaje más un fijo (configurables en Vercel). */
export function conComision(monto: number) {
  const porcentaje = Number(process.env.RESERVAS_COMISION_PORCENTAJE ?? 5);
  const fijo = Number(process.env.RESERVAS_COMISION_FIJA ?? 5);
  return Math.round((monto * (1 + porcentaje / 100) + fijo) * 100) / 100;
}

interface LugarDuffel { iata_code: string; name: string; city_name?: string | null }
interface Segmento {
  departing_at: string;
  arriving_at: string;
  duration: string | null;
  origin: LugarDuffel;
  destination: LugarDuffel;
  origin_terminal?: string | null;
  marketing_carrier: { name: string; iata_code: string };
  marketing_carrier_flight_number: string;
}
interface OfertaDuffel {
  id: string;
  total_amount: string;
  total_currency: string;
  expires_at: string;
  owner: { name: string; iata_code: string; logo_symbol_url?: string | null };
  slices: { duration: string | null; segments: Segmento[] }[];
  passengers: { id: string; type: string }[];
}

export interface Tramo {
  salida: string;
  llegada: string;
  duracion: string | null;
  escalas: number;
  segmentos: { vuelo: string; aerolinea: string; desde: string; hasta: string; salida: string; llegada: string; terminal: string | null }[];
}
export interface Oferta {
  id: string;
  aerolinea: string;
  logo: string | null;
  precio: number; // con nuestra comisión
  moneda: string;
  vence: string;
  tramos: Tramo[];
  pasajeros: string[]; // ids de pasajero de Duffel, en orden
}

function aOferta(o: OfertaDuffel): Oferta {
  return {
    id: o.id,
    aerolinea: o.owner.name,
    logo: o.owner.logo_symbol_url ?? null,
    precio: conComision(Number(o.total_amount)),
    moneda: o.total_currency,
    vence: o.expires_at,
    pasajeros: o.passengers.map((p) => p.id),
    tramos: o.slices.map((s) => ({
      salida: s.segments[0].departing_at,
      llegada: s.segments[s.segments.length - 1].arriving_at,
      duracion: s.duration,
      escalas: s.segments.length - 1,
      segmentos: s.segments.map((g) => ({
        vuelo: `${g.marketing_carrier.iata_code} ${g.marketing_carrier_flight_number}`,
        aerolinea: g.marketing_carrier.name,
        desde: g.origin.iata_code,
        hasta: g.destination.iata_code,
        salida: g.departing_at,
        llegada: g.arriving_at,
        terminal: g.origin_terminal ?? null,
      })),
    })),
  };
}

export interface Busqueda {
  origen: string;
  destino: string;
  ida: string;
  vuelta?: string;
  adultos: number;
}

export async function buscarOfertas(b: Busqueda): Promise<Oferta[]> {
  const slices = [{ origin: b.origen, destination: b.destino, departure_date: b.ida }];
  if (b.vuelta) slices.push({ origin: b.destino, destination: b.origen, departure_date: b.vuelta });
  const r = await pedir<{ offers: OfertaDuffel[] }>("/air/offer_requests?return_offers=true&supplier_timeout=20000", {
    slices,
    passengers: Array.from({ length: b.adultos }, () => ({ type: "adult" })),
    cabin_class: "economy",
  });
  // En prueba, Duffel hace fallar a propósito vuelos de otras aerolíneas; su aerolínea de prueba (Duffel Airways) siempre funciona.
  const primero = (o: OfertaDuffel) => (modoPrueba() && o.owner.iata_code === "ZZ" ? 0 : 1);
  return r.offers
    .sort((a, b) => primero(a) - primero(b) || Number(a.total_amount) - Number(b.total_amount))
    .map(aOferta)
    .slice(0, 20);
}

/** Precio actualizado justo antes de pagar (los precios de las aerolíneas cambian). */
export async function ofertaActual(id: string): Promise<{ oferta: Oferta; totalAerolinea: string }> {
  const o = await pedir<OfertaDuffel>(`/air/offers/${encodeURIComponent(id)}`);
  return { oferta: aOferta(o), totalAerolinea: o.total_amount };
}

export interface Pasajero {
  nombre: string;
  apellido: string;
  nacimiento: string; // AAAA-MM-DD
  genero: "m" | "f";
  tratamiento: "mr" | "ms" | "mrs";
  email: string;
  telefono: string; // formato internacional: +34...
}

/** Emite el pasaje. Paga Duffel con el saldo de la cuenta (en prueba, saldo de mentira). */
export async function emitir(ofertaId: string, pasajeros: Pasajero[]) {
  const { oferta, totalAerolinea } = await ofertaActual(ofertaId);
  if (pasajeros.length !== oferta.pasajeros.length) throw new ErrorDuffel(400, "pasajeros");
  const orden = await pedir<{ id: string; booking_reference: string; total_amount: string; total_currency: string }>("/air/orders", {
    type: "instant",
    selected_offers: [ofertaId],
    passengers: pasajeros.map((p, i) => ({
      id: oferta.pasajeros[i],
      given_name: p.nombre,
      family_name: p.apellido,
      born_on: p.nacimiento,
      gender: p.genero,
      title: p.tratamiento,
      email: p.email,
      phone_number: p.telefono,
    })),
    payments: [{ type: "balance", currency: oferta.moneda, amount: totalAerolinea }],
  });
  return { codigo: orden.booking_reference, orden: orden.id, oferta, costo: Number(totalAerolinea) };
}

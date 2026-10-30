// Venta de hoteles dentro de la web con LiteAPI (Nuitee). Solo servidor.
// La clave vive en LITEAPI_KEY (Vercel). Con una clave de prueba (sand_...) las reservas son de mentira.
// Nuestra comisión es el "margin" de LiteAPI: va incluida en el precio que ve el cliente y LiteAPI nos la paga.

const API = "https://api.liteapi.travel/v3.0";
const RESERVAS = "https://book.liteapi.travel/v3.0";

export const hotelesConfigurado = () => !!process.env.LITEAPI_KEY;
export const hotelesPrueba = () => (process.env.LITEAPI_KEY ?? "").startsWith("sand_");
export const hotelesPermitido = () => hotelesConfigurado() && (hotelesPrueba() || process.env.RESERVAS_COBRO_ACTIVO === "1");
const margen = () => Number(process.env.HOTELES_COMISION_PORCENTAJE ?? 10);

export class ErrorHoteles extends Error {
  constructor(
    public status: number,
    public detalle: string,
  ) {
    super(`LiteAPI ${status}: ${detalle}`);
  }
}

async function pedir<T>(url: string, cuerpo?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: cuerpo ? "POST" : "GET",
    headers: { "X-API-Key": process.env.LITEAPI_KEY ?? "", Accept: "application/json", "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    cache: "no-store",
  });
  const j = (await res.json().catch(() => ({}))) as { data?: T; error?: { message?: string; description?: string } };
  if (!res.ok || j.error) throw new ErrorHoteles(res.status >= 400 ? res.status : 400, j.error?.message || j.error?.description || "error");
  return j.data as T;
}

export interface OfertaHotel {
  ofertaId: string;
  hotelId: string;
  nombre: string;
  foto: string | null;
  estrellas: number;
  puntaje: number | null;
  direccion: string;
  habitacion: string;
  regimen: string;
  reembolsable: boolean;
  precio: number; // total de la estadía, con nuestra comisión incluida
  moneda: string;
}

export interface BusquedaHotel {
  aeropuerto: string;
  entrada: string;
  salida: string;
  adultos: number;
}

interface TarifaLite {
  name: string;
  boardName: string;
  retailRate: { total: { amount: number; currency: string }[] };
  cancellationPolicies?: { refundableTag?: string };
}
interface HotelLite {
  id: string;
  name: string;
  main_photo?: string;
  thumbnail?: string;
  stars?: number;
  rating?: number;
  address?: string;
}

/** IDs de LiteAPI para tipos de alojamiento tipo "Hostel" (no son fijos: se consultan una vez y se guardan en memoria). */
let idsHostalCache: Promise<number[]> | null = null;
function idsHostal(): Promise<number[]> {
  if (!idsHostalCache) {
    idsHostalCache = pedir<{ id: number; name: string }[]>(`${API}/data/hotelTypes`)
      .then((tipos) => tipos.filter((t) => /hostel/i.test(t.name)).map((t) => t.id))
      .catch(() => []);
  }
  return idsHostalCache;
}

async function pedirOfertas(b: BusquedaHotel, hotelTypeIds?: number[]): Promise<OfertaHotel[]> {
  const r = await fetch(`${API}/hotels/rates`, {
    method: "POST",
    headers: { "X-API-Key": process.env.LITEAPI_KEY ?? "", "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      iataCode: b.aeropuerto,
      checkin: b.entrada,
      checkout: b.salida,
      currency: "EUR",
      guestNationality: "ES",
      occupancies: [{ adults: b.adultos }],
      margin: margen(),
      limit: 30,
      timeout: 12,
      maxRatesPerHotel: 1,
      includeHotelData: true,
      ...(hotelTypeIds?.length ? { hotelTypeIds } : {}),
    }),
    cache: "no-store",
  });
  const j = (await r.json().catch(() => ({}))) as {
    data?: { hotelId: string; roomTypes: { offerId: string; rates: TarifaLite[]; offerRetailRate?: { amount: number; currency: string } }[] }[];
    hotels?: HotelLite[];
    error?: { message?: string };
  };
  if (!r.ok) throw new ErrorHoteles(r.status, j.error?.message ?? "error");
  const fichas = new Map((j.hotels ?? []).map((h) => [h.id, h]));
  const ofertas: OfertaHotel[] = [];
  for (const h of j.data ?? []) {
    const tipo = h.roomTypes[0];
    const tarifa = tipo?.rates[0];
    const ficha = fichas.get(h.hotelId);
    if (!tipo || !tarifa || !ficha) continue;
    const total = tipo.offerRetailRate ?? tarifa.retailRate.total[0];
    ofertas.push({
      ofertaId: tipo.offerId,
      hotelId: h.hotelId,
      nombre: ficha.name,
      foto: ficha.main_photo || ficha.thumbnail || null,
      estrellas: ficha.stars ?? 0,
      puntaje: ficha.rating ?? null,
      direccion: ficha.address ?? "",
      habitacion: tarifa.name,
      regimen: tarifa.boardName,
      reembolsable: tarifa.cancellationPolicies?.refundableTag === "RFN",
      precio: Math.round(total.amount * 100) / 100,
      moneda: total.currency,
    });
  }
  return ofertas;
}

/**
 * Busca hoteles reales; primero hostales (público joven, más baratos y con más onda), después el resto, siempre por precio.
 * Gente free: nada de 4-5 estrellas (0 = sin calificar, se deja pasar — típico en hostales). Premium: sin tope.
 */
export async function buscarHoteles(b: BusquedaHotel, premium = false): Promise<OfertaHotel[]> {
  const hostalIds = await idsHostal();
  const [general, hostales] = await Promise.all([
    pedirOfertas(b),
    hostalIds.length ? pedirOfertas(b, hostalIds).catch(() => []) : Promise.resolve([]),
  ]);
  const MAX_ESTRELLAS = 3;
  const entraPorEstrellas = (h: OfertaHotel) => premium || h.estrellas <= MAX_ESTRELLAS;
  const hostalesOrdenados = hostales.filter(entraPorEstrellas).sort((a, b) => a.precio - b.precio);
  const idsYaIncluidos = new Set(hostalesOrdenados.map((h) => h.hotelId));
  const restoOrdenado = general
    .filter((h) => !idsYaIncluidos.has(h.hotelId) && entraPorEstrellas(h))
    .sort((a, b) => a.precio - b.precio);
  return [...hostalesOrdenados, ...restoOrdenado].slice(0, 20);
}

/** Confirma el precio con el hotel justo antes de reservar. */
export async function prereservar(ofertaId: string) {
  const d = await pedir<{ prebookId: string; price: number; currency: string; commission?: number }>(`${RESERVAS}/rates/prebook`, {
    offerId: ofertaId,
    usePaymentSdk: false,
  });
  return { prebookId: d.prebookId, precio: d.price, moneda: d.currency, comision: d.commission ?? 0 };
}

export interface Huesped {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

/** Reserva. Paga LiteAPI con la tarjeta de la cuenta (en prueba, de mentira). */
export async function reservarHotel(prebookId: string, h: Huesped, referencia: string) {
  const d = await pedir<{ bookingId: string; status: string; hotelConfirmationCode?: string; price: number; commission?: number }>(`${RESERVAS}/rates/book`, {
    prebookId,
    clientReference: referencia,
    holder: { firstName: h.nombre, lastName: h.apellido, email: h.email, ...(h.telefono ? { phone: h.telefono } : {}) },
    guests: [{ occupancyNumber: 1, firstName: h.nombre, lastName: h.apellido, email: h.email }],
    payment: { method: "ACC_CREDIT_CARD" },
  });
  return { codigo: d.bookingId, estado: d.status, codigoHotel: d.hotelConfirmationCode ?? null, precio: d.price, comision: d.commission ?? 0 };
}

/** Busca una reserva hecha con nuestra referencia (por si se hizo y no nos enteramos). */
export async function reservaHotelDe(referencia: string) {
  const d = await pedir<{ bookingId: string; status: string; price?: number; commission?: number }[]>(
    `${RESERVAS}/bookings?clientReference=${encodeURIComponent(referencia)}`,
  ).catch(() => []);
  return d.find((b) => b.status === "CONFIRMED") ?? null;
}

/** Cancela una reserva de hotel. Solo funciona si la tarifa es reembolsable. */
export async function cancelarHotel(bookingId: string) {
  const res = await fetch(`${RESERVAS}/bookings/${encodeURIComponent(bookingId)}`, {
    method: "PUT",
    headers: { "X-API-Key": process.env.LITEAPI_KEY ?? "", Accept: "application/json" },
    cache: "no-store",
  });
  const j = (await res.json().catch(() => ({}))) as { data?: { status?: string; refund_amount?: number; refundAmount?: number; currency?: string }; error?: { message?: string } };
  if (!res.ok || j.error) throw new ErrorHoteles(res.status >= 400 ? res.status : 400, j.error?.message ?? "error");
  return { estado: j.data?.status ?? "", devolucion: j.data?.refund_amount ?? j.data?.refundAmount ?? 0, moneda: j.data?.currency ?? "" };
}

interface FichaHotelLite {
  hotelImages?: { url?: string; urlHd?: string; caption?: string; defaultImage?: boolean }[];
  rooms?: { roomName?: string; photos?: { url?: string; hd_url?: string }[] }[];
}

const palabras = (t: string) => new Set(t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 2));

/**
 * Fotos para mostrar antes de reservar: primero las de la habitación elegida (la que más se parece por nombre),
 * después fotos del hotel. Hasta 6 de cada una.
 */
export async function fotosHotel(hotelId: string, habitacion: string) {
  const d = await pedir<FichaHotelLite>(`${API}/data/hotel?hotelId=${encodeURIComponent(hotelId)}`);
  const buscadas = palabras(habitacion);
  const puntaje = (nombre: string) => [...palabras(nombre)].filter((w) => buscadas.has(w)).length;
  const salas = (d.rooms ?? []).filter((r) => r.photos?.length).sort((a, b) => puntaje(b.roomName ?? "") - puntaje(a.roomName ?? ""));
  const cuarto = (salas[0]?.photos ?? []).map((p) => p.hd_url || p.url).filter((u): u is string => !!u).slice(0, 6);
  const hotel = (d.hotelImages ?? [])
    .map((i) => i.urlHd || i.url)
    .filter((u): u is string => !!u)
    .slice(0, 6);
  return { habitacion: cuarto, nombreHabitacion: salas[0]?.roomName ?? "", hotel };
}

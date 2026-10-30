import { alertarDueno, mandarAResend } from "./correo/envio";
import { SITIO } from "./correo/redactor";
import { sql } from "./db";
import { emitir, ErrorDuffel, modoPrueba, ordenDeReserva, type Oferta, type Pasajero } from "./duffel";
import { ErrorHoteles, hotelesPrueba, prereservar, reservaHotelDe, reservarHotel, type Huesped, type OfertaHotel } from "./hoteles";

// Agentes de reservas:
// - Agente de vuelos: paga y emite el pasaje (Duffel).
// - Agente de hoteles: confirma el precio y reserva el hotel (LiteAPI).
// - Vigilante: cada compra queda anotada antes de pagar; el vigilante revisa las que quedaron a medias.
//   Si se hizo y no nos enteramos, la marca; si no, la reintenta; si no se puede, le avisa al dueño y al cliente.

const MAX_INTENTOS = 3;

type Tipo = "vuelo" | "hotel";
interface FilaReserva {
  id: string;
  tipo: Tipo;
  estado: "pendiente" | "emitida" | "fallida";
  oferta_id: string;
  pasajeros: (Pasajero | Huesped)[];
  email: string;
  ruta: string;
  intentos: number;
  precio: string;
  moneda: string;
}
const COLUMNAS = "id, tipo, estado, oferta_id, pasajeros, email, ruta, intentos, precio, moneda";

const prueba = (tipo: Tipo) => ((tipo === "vuelo" ? modoPrueba() : hotelesPrueba()) ? "[PRUEBA] " : "");
const rutaDe = (o: Oferta) =>
  o.tramos.map((t) => `${t.segmentos[0].desde}→${t.segmentos[t.segmentos.length - 1].hasta} ${t.salida.slice(0, 10)}`).join(", ");

/** Anota la compra antes de pagar: desde acá, el vigilante la sigue hasta que termine. */
async function anotar(tipo: Tipo, ofertaId: string, personas: unknown[], email: string, detalle: string, precio: number, moneda: string, esPrueba: boolean) {
  const [r] = await sql<{ id: string }>(
    `insert into reservas (tipo, estado, oferta_id, pasajeros, email, ruta, precio, costo, moneda, prueba)
     values ($1, 'pendiente', $2, $3, $4, $5, $6, 0, $7, $8) returning id`,
    [tipo, ofertaId, JSON.stringify(personas), email, detalle, precio, moneda, esPrueba],
  );
  return r.id;
}
export const registrar = (o: Oferta, pasajeros: Pasajero[]) =>
  anotar("vuelo", o.id, pasajeros, pasajeros[0].email, rutaDe(o), o.precio, o.moneda, modoPrueba());
export const registrarHotel = (o: OfertaHotel, h: Huesped, entrada: string, salida: string) =>
  anotar("hotel", o.ofertaId, [h], h.email, `${o.nombre}, ${entrada} al ${salida}`, o.precio, o.moneda, hotelesPrueba());

function correoCliente(asunto: string, texto: string) {
  return {
    idioma: "es" as const,
    asunto,
    html:
      `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:22px;color:#2b2a24;">` +
      `<img src="${SITIO()}/marca/logo-completo-oliva.png" width="110" alt="Rumbo Traveling" style="display:block;width:110px;height:auto;border:0;margin:0 0 16px;">` +
      `<div style="white-space:pre-wrap">${texto.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div></div>`,
    texto,
    esperado: { frases: [], enlaces: [] },
  };
}

async function marcarHecha(f: FilaReserva, codigo: string, orden: string, comision: number) {
  const precio = Number(f.precio);
  const costo = Math.round((precio - comision) * 100) / 100;
  await sql(`update reservas set estado = 'emitida', codigo = $2, orden = $3, costo = $4, error = null, actualizado = now() where id = $1`, [f.id, codigo, orden, costo]);
  const p = prueba(f.tipo);
  const que = f.tipo === "vuelo" ? "Pasaje vendido" : "Hotel reservado";
  await alertarDueno(
    `${p}${que}: ${f.ruta}`,
    `Código de reserva: ${codigo}\n${f.tipo === "vuelo" ? "Ruta" : "Hotel"}: ${f.ruta}\nPrecio cobrado: ${precio} ${f.moneda}\nCosto: ${costo} ${f.moneda}\nTu comisión: ${comision.toFixed(2)} ${f.moneda}\nCliente: ${f.email}`,
  ).catch(() => {});
  await mandarAResend(
    f.email,
    f.tipo === "vuelo"
      ? correoCliente(`${p}Tu vuelo está reservado: ${codigo}`, `¡Hola!\n\nTu vuelo ya está reservado.\n\nCódigo de reserva: ${codigo}\nViaje: ${f.ruta}\n\nCon este código hacés el check-in en la web de la aerolínea.\n\n¡Buen viaje!\nRumbo Traveling`)
      : correoCliente(`${p}Tu hotel está reservado: ${codigo}`, `¡Hola!\n\nTu hotel ya está reservado.\n\nCódigo de reserva: ${codigo}\nHotel: ${f.ruta}\n\nMostrá este código al llegar al hotel.\n\n¡Buen viaje!\nRumbo Traveling`),
  ).catch(() => {});
}

async function cargar(id: string) {
  const [f] = await sql<FilaReserva>(`select ${COLUMNAS} from reservas where id = $1`, [id]);
  return f;
}

async function fallo(id: string, e: unknown, definitivo: boolean) {
  const detalle = e instanceof Error ? e.message : String(e);
  await sql(`update reservas set estado = $2, error = $3, actualizado = now() where id = $1`, [id, definitivo ? "fallida" : "pendiente", detalle.slice(0, 500)]);
  return { estado: (definitivo ? "fallida" : "pendiente") as FilaReserva["estado"] };
}

/** Agente de vuelos: emite el pasaje. Devuelve "emitida", "pendiente" (lo sigue el vigilante) o "fallida". */
export async function agenteVuelos(id: string): Promise<{ estado: FilaReserva["estado"]; codigo?: string }> {
  const f = await cargar(id);
  if (!f || f.estado !== "pendiente") return { estado: f?.estado ?? "fallida" };
  await sql(`update reservas set intentos = intentos + 1, actualizado = now() where id = $1`, [id]);
  try {
    const r = await emitir(f.oferta_id, f.pasajeros as Pasajero[], { reserva: id });
    await marcarHecha(f, r.codigo, r.orden, Number(f.precio) - r.costo);
    return { estado: "emitida", codigo: r.codigo };
  } catch (e) {
    // 4xx: la oferta ya no existe o cambió de precio. No se reintenta la misma.
    return fallo(id, e, e instanceof ErrorDuffel && e.status < 500);
  }
}

/** Agente de hoteles: confirma el precio y reserva. Si el precio subió, no reserva. */
export async function agenteHoteles(id: string): Promise<{ estado: FilaReserva["estado"]; codigo?: string }> {
  const f = await cargar(id);
  if (!f || f.estado !== "pendiente") return { estado: f?.estado ?? "fallida" };
  await sql(`update reservas set intentos = intentos + 1, actualizado = now() where id = $1`, [id]);
  try {
    const pre = await prereservar(f.oferta_id);
    if (pre.precio > Number(f.precio) + 0.01) return fallo(id, new Error(`El precio subió a ${pre.precio} ${pre.moneda}`), true);
    const r = await reservarHotel(pre.prebookId, f.pasajeros[0] as Huesped, id);
    if (r.estado !== "CONFIRMED") return fallo(id, new Error(`Estado ${r.estado}`), false);
    await marcarHecha(f, r.codigo, r.codigoHotel ?? r.codigo, r.comision);
    return { estado: "emitida", codigo: r.codigo };
  } catch (e) {
    return fallo(id, e, e instanceof ErrorHoteles && e.status < 500);
  }
}

/** Vigilante: no deja ninguna compra olvidada. Lo llama la ronda de vigilancia (cada 30 minutos). */
export async function vigilante() {
  const resultado = { revisadas: 0, recuperadas: 0, reintentadas: 0, fallidas: 0 };
  const pendientes = await sql<FilaReserva>(
    `select ${COLUMNAS} from reservas where estado = 'pendiente' and actualizado < now() - interval '2 minutes' order by creado limit 20`,
  );
  for (const f of pendientes) {
    resultado.revisadas += 1;
    // ¿Se hizo y no nos enteramos (por ejemplo, se cortó la conexión)?
    if (f.tipo === "vuelo") {
      const orden = await ordenDeReserva(f.id).catch(() => null);
      if (orden) {
        await marcarHecha(f, orden.booking_reference, orden.id, Number(f.precio) - Number(orden.total_amount));
        resultado.recuperadas += 1;
        continue;
      }
    } else {
      const hecha = await reservaHotelDe(f.id);
      if (hecha) {
        await marcarHecha(f, hecha.bookingId, hecha.bookingId, hecha.commission ?? 0);
        resultado.recuperadas += 1;
        continue;
      }
    }
    if (f.intentos < MAX_INTENTOS) {
      resultado.reintentadas += 1;
      await (f.tipo === "vuelo" ? agenteVuelos(f.id) : agenteHoteles(f.id));
    } else {
      await sql(`update reservas set estado = 'fallida', actualizado = now() where id = $1`, [f.id]);
    }
  }
  // Avisos de las que no se pudieron hacer (una sola vez cada una).
  const fallidas = await sql<FilaReserva & { error: string | null }>(
    `select ${COLUMNAS}, error from reservas where estado = 'fallida' and not avisado limit 20`,
  );
  for (const f of fallidas) {
    resultado.fallidas += 1;
    const es = f.tipo === "vuelo";
    await alertarDueno(
      `${prueba(f.tipo)}No se pudo ${es ? "emitir un pasaje" : "reservar un hotel"}: ${f.ruta}`,
      `El vigilante no pudo terminar esta compra después de ${f.intentos} intentos.\n\n${es ? "Ruta" : "Hotel"}: ${f.ruta}\nCliente: ${f.email}\nPrecio: ${f.precio} ${f.moneda}\nÚltimo error: ${f.error ?? "-"}\n\nNo se le cobró nada al cliente. Escribile para ofrecerle otra opción.`,
      f.email,
    ).catch(() => {});
    await mandarAResend(
      f.email,
      correoCliente(
        es ? "No pudimos emitir tu pasaje" : "No pudimos reservar tu hotel",
        `¡Hola!\n\n${es ? "La aerolínea" : "El hotel"} no pudo confirmar ${es ? "el vuelo" : "la reserva"} que elegiste (${f.ruta}). No se te cobró nada.\n\nEntrá de nuevo a ${SITIO()}/reservar para elegir otra opción, o respondé este email y te ayudamos.\n\nRumbo Traveling`,
      ),
    ).catch(() => {});
    await sql(`update reservas set avisado = true where id = $1`, [f.id]);
  }
  return resultado;
}

import { alertarDueno, mandarAResend } from "./correo/envio";
import { SITIO } from "./correo/redactor";
import { sql } from "./db";
import { emitir, ErrorDuffel, modoPrueba, ordenDeReserva, type Oferta, type Pasajero } from "./duffel";

// Agentes de reservas:
// - Agente de vuelos: paga y emite el pasaje (con la reserva anotada antes, para no perderla nunca).
// - Vigilante: revisa las compras que quedaron a medias. Si el pasaje salió y no nos enteramos, lo marca;
//   si no salió, lo reintenta; si no se puede, le avisa al dueño y al cliente.
// - Agente de hoteles: se suma cuando esté conectado LiteAPI.

const MAX_INTENTOS = 3;

interface FilaReserva {
  id: string;
  estado: "pendiente" | "emitida" | "fallida";
  oferta_id: string;
  pasajeros: Pasajero[];
  email: string;
  ruta: string;
  intentos: number;
  precio: string;
  moneda: string;
}

const rutaDe = (o: Oferta) =>
  o.tramos.map((t) => `${t.segmentos[0].desde}→${t.segmentos[t.segmentos.length - 1].hasta} ${t.salida.slice(0, 10)}`).join(", ");

/** Anota la compra antes de pagar: desde acá, el vigilante la sigue hasta que termine. */
export async function registrar(oferta: Oferta, pasajeros: Pasajero[]): Promise<string> {
  const [r] = await sql<{ id: string }>(
    `insert into reservas (estado, oferta_id, pasajeros, email, ruta, precio, costo, moneda, prueba)
     values ('pendiente', $1, $2, $3, $4, $5, 0, $6, $7) returning id`,
    [oferta.id, JSON.stringify(pasajeros), pasajeros[0].email, rutaDe(oferta), oferta.precio, oferta.moneda, modoPrueba()],
  );
  return r.id;
}

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

async function marcarEmitida(id: string, codigo: string, orden: string, costo: number, f: Pick<FilaReserva, "email" | "ruta" | "precio" | "moneda">, pasajeros: number) {
  await sql(`update reservas set estado = 'emitida', codigo = $2, orden = $3, costo = $4, error = null, actualizado = now() where id = $1`, [id, codigo, orden, costo]);
  const precio = Number(f.precio);
  const prueba = modoPrueba() ? "[PRUEBA] " : "";
  await alertarDueno(
    `${prueba}Pasaje vendido: ${f.ruta}`,
    `Código de reserva: ${codigo}\nRuta: ${f.ruta}\nPrecio cobrado: ${precio} ${f.moneda}\nCosto (aerolínea): ${costo} ${f.moneda}\nTu comisión: ${(precio - costo).toFixed(2)} ${f.moneda}\nCliente: ${f.email}\nPasajeros: ${pasajeros}`,
  ).catch(() => {});
  await mandarAResend(
    f.email,
    correoCliente(`${prueba}Tu vuelo está reservado: ${codigo}`, `¡Hola!\n\nTu vuelo ya está reservado.\n\nCódigo de reserva: ${codigo}\nViaje: ${f.ruta}\n\nCon este código hacés el check-in en la web de la aerolínea.\n\n¡Buen viaje!\nRumbo Traveling`),
  ).catch(() => {});
}

/**
 * Agente de vuelos: emite el pasaje de una reserva anotada.
 * Devuelve "emitida", "pendiente" (falló algo que se puede reintentar: lo sigue el vigilante) o "fallida".
 */
export async function agenteVuelos(id: string): Promise<{ estado: FilaReserva["estado"]; codigo?: string }> {
  const [f] = await sql<FilaReserva>(`select id, estado, oferta_id, pasajeros, email, ruta, intentos, precio, moneda from reservas where id = $1`, [id]);
  if (!f || f.estado !== "pendiente") return { estado: f?.estado ?? "fallida" };
  await sql(`update reservas set intentos = intentos + 1, actualizado = now() where id = $1`, [id]);
  try {
    const r = await emitir(f.oferta_id, f.pasajeros, { reserva: id });
    await marcarEmitida(id, r.codigo, r.orden, r.costo, f, f.pasajeros.length);
    return { estado: "emitida", codigo: r.codigo };
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    // 4xx: la oferta ya no existe o cambió de precio. No se puede reintentar con la misma oferta.
    const definitivo = e instanceof ErrorDuffel && e.status < 500;
    await sql(`update reservas set estado = $2, error = $3, actualizado = now() where id = $1`, [id, definitivo ? "fallida" : "pendiente", detalle.slice(0, 500)]);
    return { estado: definitivo ? "fallida" : "pendiente" };
  }
}

/** Vigilante: no deja ninguna compra olvidada. Lo llama la ronda de vigilancia (cada 30 minutos). */
export async function vigilante() {
  const resultado = { revisadas: 0, recuperadas: 0, reintentadas: 0, fallidas: 0 };
  const pendientes = await sql<FilaReserva>(
    `select id, estado, oferta_id, pasajeros, email, ruta, intentos, precio, moneda from reservas
     where estado = 'pendiente' and actualizado < now() - interval '2 minutes' order by creado limit 20`,
  );
  for (const f of pendientes) {
    resultado.revisadas += 1;
    // ¿Se emitió y no nos enteramos (por ejemplo, se cortó la conexión)?
    const orden = await ordenDeReserva(f.id).catch(() => null);
    if (orden) {
      await marcarEmitida(f.id, orden.booking_reference, orden.id, Number(orden.total_amount), f, f.pasajeros.length);
      resultado.recuperadas += 1;
      continue;
    }
    if (f.intentos < MAX_INTENTOS) {
      resultado.reintentadas += 1;
      const r = await agenteVuelos(f.id);
      if (r.estado !== "fallida") continue;
    } else {
      await sql(`update reservas set estado = 'fallida', actualizado = now() where id = $1`, [f.id]);
    }
  }
  // Avisos de las que no se pudieron emitir (una sola vez cada una).
  const fallidas = await sql<FilaReserva & { error: string | null }>(
    `select id, email, ruta, precio, moneda, intentos, error from reservas where estado = 'fallida' and not avisado limit 20`,
  );
  for (const f of fallidas) {
    resultado.fallidas += 1;
    await alertarDueno(
      `${modoPrueba() ? "[PRUEBA] " : ""}No se pudo emitir un pasaje: ${f.ruta}`,
      `El vigilante no pudo emitir esta compra después de ${f.intentos} intentos.\n\nRuta: ${f.ruta}\nCliente: ${f.email}\nPrecio: ${f.precio} ${f.moneda}\nÚltimo error: ${f.error ?? "-"}\n\nNo se le cobró nada al cliente. Escribile para ofrecerle otro vuelo.`,
      f.email,
    ).catch(() => {});
    await mandarAResend(
      f.email,
      correoCliente(
        "No pudimos emitir tu pasaje",
        `¡Hola!\n\nLa aerolínea no pudo confirmar el vuelo que elegiste (${f.ruta}). No se te cobró nada.\n\nEntrá de nuevo a ${SITIO()}/reservar para elegir otro vuelo, o respondé este email y te ayudamos.\n\nRumbo Traveling`,
      ),
    ).catch(() => {});
    await sql(`update reservas set avisado = true where id = $1`, [f.id]);
  }
  return resultado;
}

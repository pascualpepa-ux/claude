import { randomBytes } from "node:crypto";
import { alertarDueno, mandarAResend } from "./correo/envio";
import { SITIO } from "./correo/redactor";
import { sql } from "./db";
import { suscribirComprador } from "./suscripciones";
import { aMinimo, cobrar, crearPago, devolver, liberar, pagosActivos, pagosPrueba, verPago } from "./pagos";
import { confirmarCancelacion, cotizarCancelacion, emitir, ErrorDuffel, modoPrueba, ordenDeReserva, type Oferta, type Pasajero } from "./duffel";
import { cancelarHotel, ErrorHoteles, hotelesPrueba, prereservar, reservaHotelDe, reservarHotel, type Huesped, type OfertaHotel } from "./hoteles";

// Agentes de reservas:
// - Agente de vuelos: paga y emite el pasaje (Duffel).
// - Agente de hoteles: confirma el precio y reserva el hotel (LiteAPI).
// - Vigilante: cada compra queda anotada antes de pagar; el vigilante revisa las que quedaron a medias.
//   Si se hizo y no nos enteramos, la marca; si no, la reintenta; si no se puede, le avisa al dueño y al cliente.

const MAX_INTENTOS = 3;

type Tipo = "vuelo" | "hotel";
/** Lo que se guarda para el email y la cancelación. */
export type DetalleReserva =
  | { tipo: "vuelo"; aerolinea: string; tramos: Oferta["tramos"]; pasajeros: string[] }
  | {
      tipo: "hotel";
      nombre: string;
      direccion: string;
      estrellas: number;
      puntaje: number | null;
      habitacion: string;
      regimen: string;
      reembolsable: boolean;
      entrada: string;
      salida: string;
      huespedes: number;
    };

interface FilaReserva {
  id: string;
  tipo: Tipo;
  detalle: DetalleReserva | null;
  token_cancelar: string | null;
  estado: "esperando_pago" | "pendiente" | "emitida" | "fallida";
  oferta_id: string;
  pasajeros: (Pasajero | Huesped)[];
  email: string;
  ruta: string;
  intentos: number;
  precio: string;
  moneda: string;
}
const COLUMNAS = "id, tipo, detalle, token_cancelar, estado, oferta_id, pasajeros, email, ruta, intentos, precio, moneda";

const prueba = (tipo: Tipo) => ((tipo === "vuelo" ? modoPrueba() : hotelesPrueba()) ? "[PRUEBA] " : "");
const rutaDe = (o: Oferta) =>
  o.tramos.map((t) => `${t.segmentos[0].desde}→${t.segmentos[t.segmentos.length - 1].hasta} ${t.salida.slice(0, 10)}`).join(", ");

/** Anota la compra antes de pagar: desde acá, el vigilante la sigue hasta que termine. */
async function anotar(ofertaId: string, personas: unknown[], email: string, resumen: string, detalle: DetalleReserva, precio: number, moneda: string, esPrueba: boolean, novedades: boolean) {
  const [r] = await sql<{ id: string }>(
    `insert into reservas (tipo, estado, oferta_id, pasajeros, email, ruta, detalle, token_cancelar, precio, costo, moneda, prueba, novedades)
     values ($1, $12, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11) returning id`,
    [detalle.tipo, ofertaId, JSON.stringify(personas), email, resumen, JSON.stringify(detalle), randomBytes(24).toString("base64url"), precio, moneda, esPrueba, novedades,
      // Con cobro con tarjeta, la compra espera a que la plata quede retenida antes de que el agente compre.
      pagosActivos() ? "esperando_pago" : "pendiente"],
  );
  return r.id;
}
export const registrar = (o: Oferta, pasajeros: Pasajero[], novedades = true) =>
  anotar(o.id, pasajeros, pasajeros[0].email, rutaDe(o), { tipo: "vuelo", aerolinea: o.aerolinea, tramos: o.tramos, pasajeros: pasajeros.map((p) => `${p.nombre} ${p.apellido}`) }, o.precio, o.moneda, modoPrueba(), novedades);
export const registrarHotel = (o: OfertaHotel, h: Huesped, entrada: string, salida: string, huespedes: number, novedades = true) =>
  anotar(
    o.ofertaId,
    [h],
    h.email,
    `${o.nombre}, ${entrada} al ${salida}`,
    { tipo: "hotel", nombre: o.nombre, direccion: o.direccion, estrellas: o.estrellas, puntaje: o.puntaje, habitacion: o.habitacion, regimen: o.regimen, reembolsable: o.reembolsable, entrada, salida, huespedes },
    o.precio,
    o.moneda,
    hotelesPrueba(),
    novedades,
  );

/** Texto del email al cliente con todo lo que compró. */
function detalleParaCliente(f: FilaReserva, codigo: string) {
  const precio = `${Number(f.precio).toFixed(2)} ${f.moneda}`;
  const cancelar = f.token_cancelar ? `\n\nSi necesitás cancelar: ${SITIO()}/reservar/cancelar?t=${f.token_cancelar}` : "";
  const d = f.detalle;
  if (d?.tipo === "vuelo") {
    const tramos = d.tramos
      .map((t, i) =>
        `${i === 0 ? "IDA" : "VUELTA"}\n` +
        t.segmentos.map((s) => `  ${s.vuelo} (${s.aerolinea}): ${s.desde} ${s.salida.slice(0, 16).replace("T", " ")} → ${s.hasta} ${s.llegada.slice(0, 16).replace("T", " ")}${s.terminal ? `, terminal ${s.terminal}` : ""}`).join("\n"),
      )
      .join("\n\n");
    return `Código de reserva: ${codigo}\nAerolínea: ${d.aerolinea}\nPasajeros: ${d.pasajeros.join(", ")}\n\n${tramos}\n\nTotal pagado: ${precio}\n\nCon el código hacés el check-in en la web de la aerolínea (suele abrir 24 a 48 horas antes).${cancelar}`;
  }
  if (d?.tipo === "hotel") {
    const noches = Math.max(1, Math.round((Date.parse(d.salida) - Date.parse(d.entrada)) / 86_400_000));
    return `Código de reserva: ${codigo}\nHotel: ${d.nombre}${d.estrellas ? ` (${"★".repeat(Math.round(d.estrellas))})` : ""}${d.puntaje ? `, puntaje ${d.puntaje}` : ""}\nDirección: ${d.direccion || "-"}\nHabitación: ${d.habitacion} · ${d.regimen}\nEntrada: ${d.entrada}\nSalida: ${d.salida} (${noches} ${noches === 1 ? "noche" : "noches"})\nHuéspedes: ${d.huespedes}\nCancelación: ${d.reembolsable ? "gratis según la política del hotel" : "no reembolsable"}\n\nTotal pagado: ${precio}\n\nMostrá este código al llegar al hotel.${cancelar}`;
  }
  return `Código de reserva: ${codigo}\n${f.ruta}\nTotal pagado: ${precio}${cancelar}`;
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

/** Cobra lo retenido cuando la compra salió. Si Stripe falla, avisa al dueño en el momento. */
async function cobrarSiHay(f: FilaReserva) {
  const [r] = await sql<{ pago_id: string | null; pago_estado: string | null }>(`select pago_id, pago_estado from reservas where id = $1`, [f.id]);
  if (!r?.pago_id || r.pago_estado !== "retenido") return;
  try {
    await cobrar(r.pago_id);
    await sql(`update reservas set pago_estado = 'cobrado' where id = $1`, [f.id]);
  } catch (e) {
    await alertarDueno(`URGENTE: no se pudo cobrar ${f.ruta}`, `La compra salió pero Stripe no cobró.\n\nPago: ${r.pago_id}\nCliente: ${f.email}\nError: ${e instanceof Error ? e.message : e}\n\nRevisalo en el panel de Stripe.`).catch(() => {});
  }
}

/** Libera lo retenido cuando la compra no se pudo hacer: al cliente no se le cobra nada. */
async function liberarSiHay(id: string) {
  const [r] = await sql<{ pago_id: string | null; pago_estado: string | null }>(`select pago_id, pago_estado from reservas where id = $1`, [id]);
  if (!r?.pago_id || r.pago_estado !== "retenido") return;
  await liberar(r.pago_id)
    .then(() => sql(`update reservas set pago_estado = 'liberado' where id = $1`, [id]))
    .catch((e) => console.error("liberar pago:", e));
}

async function marcarHecha(f: FilaReserva, codigo: string, orden: string, comision: number) {
  await cobrarSiHay(f);
  // Quien compra queda suscripto (salvo que haya marcado que no quiere novedades).
  const [n] = await sql<{ novedades: boolean }>(`select novedades from reservas where id = $1`, [f.id]);
  if (n?.novedades !== false) await suscribirComprador(f.email).catch((e) => console.error("suscribir comprador:", e));
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
    correoCliente(
      `${p}${f.tipo === "vuelo" ? "Tu vuelo está reservado" : "Tu hotel está reservado"}: ${codigo}`,
      `¡Hola!\n\n${f.tipo === "vuelo" ? "Tu vuelo ya está reservado." : "Tu hotel ya está reservado."}\n\n${detalleParaCliente(f, codigo)}\n\n¡Buen viaje!\nRumbo Traveling`,
    ),
  ).catch(() => {});
}

async function cargar(id: string) {
  const [f] = await sql<FilaReserva>(`select ${COLUMNAS} from reservas where id = $1`, [id]);
  return f;
}

async function fallo(id: string, e: unknown, definitivo: boolean) {
  const detalle = e instanceof Error ? e.message : String(e);
  if (definitivo) await liberarSiHay(id);
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
  // Pagos con la tarjeta ya aceptada pero que la página no llegó a confirmar (se cerró, se cortó internet): se siguen igual.
  const sinConfirmar = await sql<{ id: string }>(
    `select id from reservas where estado = 'esperando_pago' and pago_id is not null
     and actualizado < now() - interval '3 minutes' and creado > now() - interval '6 days' limit 20`,
  );
  for (const r of sinConfirmar) await pagoRetenido(r.id).catch((e) => console.error("vigilante pago:", e));
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
      await liberarSiHay(f.id);
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

/** Datos para la página de cancelación (con el token del email). */
export async function reservaParaCancelar(token: string) {
  const [f] = await sql<FilaReserva & { codigo: string | null; orden: string | null; cancelada: string | null }>(
    `select ${COLUMNAS}, codigo, orden, cancelada from reservas where token_cancelar = $1`,
    [token],
  );
  return f ?? null;
}

/** Cancela de verdad con la aerolínea o el hotel, y avisa al dueño y al cliente. */
export async function cancelarReserva(token: string) {
  const f = await reservaParaCancelar(token);
  if (!f || f.estado !== "emitida" || !f.orden) return { estado: "invalida" as const };
  if (f.cancelada) return { estado: "ya" as const };
  let devolucion = 0;
  let moneda = f.moneda;
  if (f.tipo === "vuelo") {
    const c = await cotizarCancelacion(f.orden);
    await confirmarCancelacion(c.id);
    devolucion = c.devolucion;
    moneda = c.moneda || moneda;
  } else {
    const c = await cancelarHotel(f.codigo ?? f.orden);
    devolucion = c.devolucion;
    moneda = c.moneda || moneda;
  }
  await sql(`update reservas set cancelada = now(), actualizado = now() where id = $1`, [f.id]);
  // Se le devuelve al cliente lo que devuelve la aerolínea o el hotel (nuestra comisión no se devuelve).
  const [pg] = await sql<{ pago_id: string | null; pago_estado: string | null }>(`select pago_id, pago_estado from reservas where id = $1`, [f.id]);
  if (pg?.pago_id && pg.pago_estado === "cobrado" && devolucion > 0 && moneda.toUpperCase() === f.moneda.toUpperCase()) {
    await devolver(pg.pago_id, Math.min(devolucion, Number(f.precio)), f.moneda)
      .then(() => sql(`update reservas set pago_estado = 'devuelto' where id = $1`, [f.id]))
      .catch((e) => alertarDueno(`URGENTE: no se pudo devolver ${f.codigo}`, `Hay que devolver ${devolucion} ${moneda} al cliente ${f.email} desde Stripe.\n\nError: ${e instanceof Error ? e.message : e}`).catch(() => {}));
  }
  const p = prueba(f.tipo);
  await alertarDueno(
    `${p}Reserva cancelada: ${f.ruta}`,
    `El cliente canceló.\n\nCódigo: ${f.codigo}\n${f.ruta}\nCliente: ${f.email}\nPagó: ${f.precio} ${f.moneda}\nDevuelve ${f.tipo === "vuelo" ? "la aerolínea" : "el hotel"}: ${devolucion} ${moneda}`,
    f.email,
  ).catch(() => {});
  await mandarAResend(
    f.email,
    correoCliente(`${p}Tu reserva está cancelada: ${f.codigo}`, `¡Hola!\n\nCancelamos tu reserva ${f.codigo} (${f.ruta}).\n\nDevolución: ${devolucion > 0 ? `${devolucion.toFixed(2)} ${moneda}` : "esta tarifa no tenía devolución"}.\n\nRumbo Traveling`),
  ).catch(() => {});
  return { estado: "ok" as const, devolucion, moneda };
}

export interface FilaAdminReserva {
  id: string;
  tipo: Tipo;
  estado: FilaReserva["estado"];
  codigo: string | null;
  ruta: string;
  email: string;
  precio: string;
  costo: string;
  moneda: string;
  prueba: boolean;
  cancelada: string | null;
  creado: string;
}

/** Para el admin: las últimas reservas, con su estado. */
export function listarReservas() {
  return sql<FilaAdminReserva>(
    `select id, tipo, estado, codigo, ruta, email, precio, costo, moneda, prueba, cancelada, creado from reservas order by creado desc limit 50`,
  );
}

/** El admin cancela una reserva (la misma cancelación que el link del email). */
export async function cancelarDesdeAdmin(id: string) {
  const [r] = await sql<{ token_cancelar: string | null }>(`select token_cancelar from reservas where id = $1`, [id]);
  if (!r?.token_cancelar) return { estado: "invalida" as const };
  return cancelarReserva(r.token_cancelar);
}

/** Paso 1 del pago: crea el pago con retención para una compra anotada. */
export async function prepararPago(id: string) {
  const f = await cargar(id);
  if (!f || f.estado !== "esperando_pago") throw new Error("reserva");
  const pago = await crearPago(id, Number(f.precio), f.moneda, f.email, `${f.tipo === "vuelo" ? "Vuelo" : "Hotel"}: ${f.ruta}`);
  await sql(`update reservas set pago_id = $2 where id = $1`, [id, pago.id]);
  return { clientSecret: pago.client_secret, prueba: pagosPrueba() };
}

/**
 * Paso 2: Stripe confirmó la tarjeta y la plata quedó retenida. Recién ahí el agente compra.
 * Se verifica con Stripe (no con lo que diga la página) que el pago sea de esta compra y por el monto justo.
 */
export async function pagoRetenido(id: string): Promise<{ estado: FilaReserva["estado"]; codigo?: string }> {
  const f = await cargar(id);
  if (!f) return { estado: "fallida" };
  if (f.estado !== "esperando_pago") return { estado: f.estado };
  const [r] = await sql<{ pago_id: string | null }>(`select pago_id from reservas where id = $1`, [id]);
  if (!r?.pago_id) return { estado: "esperando_pago" };
  const pago = await verPago(r.pago_id);
  if (pago.status !== "requires_capture" || pago.metadata.reserva !== id || pago.amount !== aMinimo(Number(f.precio), f.moneda)) {
    return { estado: "esperando_pago" };
  }
  await sql(`update reservas set estado = 'pendiente', pago_estado = 'retenido', actualizado = now() where id = $1 and estado = 'esperando_pago'`, [id]);
  return f.tipo === "vuelo" ? agenteVuelos(id) : agenteHoteles(id);
}

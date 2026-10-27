import { sql } from "../db";
import type { Idioma } from "../idioma";
import type { Correo } from "./redactor";
import { verificarCorreo } from "./verificador";

// Envío con Resend (https://resend.com/docs/api-reference/emails/send-email) y seguimiento de la entrega.
// El verificador revisa cada email antes de que salga y, después, lo que informa Resend:
// si no se entregó lo reenvía una vez; si vuelve a fallar, avisa al dueño.

const API = () => process.env.RESEND_API_URL || "https://api.resend.com";
const REMITENTE = () => process.env.CORREO_REMITENTE || "Rumbo Traveling <info@rumbotraveling.com>";
// Las respuestas van a un buzón que lee Rumbo (reply.rumbotraveling.com, en Resend): el agente contesta y te reenvía todo.
const RESPUESTAS = () => process.env.CORREO_RESPUESTAS || "Rumbo Traveling <respuestas@reply.rumbotraveling.com>";
export const DUENO = () => process.env.CORREO_ALERTAS || "pascualpepa@icloud.com";

export const correoConfigurado = () => !!process.env.RESEND_API_KEY;

interface EnvioResend {
  id?: string;
  message?: string;
}

export async function mandarAResend(
  para: string,
  correo: Correo,
  enlaceBaja?: string,
  extra: { replyTo?: string; headers?: Record<string, string> } = {},
): Promise<{ id?: string; error?: string }> {
  try {
    const res = await fetch(`${API()}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: REMITENTE(),
        to: [para],
        reply_to: extra.replyTo ?? RESPUESTAS(),
        subject: correo.asunto,
        html: correo.html,
        text: correo.texto,
        // Baja en un clic desde Gmail o Apple Mail (y mejora la entrega: menos spam).
        headers: {
          ...extra.headers,
          ...(enlaceBaja && {
            "List-Unsubscribe": `<${enlaceBaja.replace("/suscripcion/baja", "/api/suscripcion/baja")}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }),
        },
      }),
    });
    const j = (await res.json().catch(() => ({}))) as EnvioResend;
    return res.ok && j.id ? { id: j.id } : { error: `${res.status} ${j.message ?? ""}`.trim() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "sin conexión" };
  }
}

/** Aviso al dueño cuando un email no se pudo mandar (va directo, sin pasar por la tabla de envíos). */
export async function alertarDueno(asunto: string, detalle: string, responderA?: string) {
  const texto = `${detalle}\n\n--\nRumbo Traveling (aviso automático)`;
  const correo: Correo = {
    idioma: "es",
    asunto: `[Rumbo] ${asunto}`,
    html: `<pre style="font-family:monospace;white-space:pre-wrap">${texto.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`,
    texto,
    esperado: { frases: [], enlaces: [] },
  };
  // Si es una respuesta de alguien, "Responder" le contesta directo a esa persona.
  const r = await mandarAResend(DUENO(), correo, undefined, { replyTo: responderA ?? DUENO() });
  if (r.error) console.error("alerta al dueño no enviada:", r.error, asunto, detalle);
}

/**
 * Verifica y manda un email. Devuelve true si salió.
 * Si el verificador encuentra un problema, no se manda nada y se avisa al dueño.
 */
export async function enviar(opts: {
  para: string;
  suscriptorId: string | null;
  tipo: string;
  idiomaSuscriptor: Idioma;
  correo: Correo;
  enlaceBaja?: string;
}): Promise<boolean> {
  const problemas = verificarCorreo(opts.correo, opts.idiomaSuscriptor);
  if (problemas.length) {
    await alertarDueno(`Email bloqueado por el verificador (${opts.tipo})`, `Para: ${opts.para}\nProblemas:\n- ${problemas.join("\n- ")}`);
    return false;
  }
  const r = await mandarAResend(opts.para, opts.correo, opts.enlaceBaja);
  await sql(
    `insert into envios (suscriptor_id, para, tipo, idioma, asunto, html, texto, resend_id, estado, error)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [opts.suscriptorId, opts.para, opts.tipo, opts.correo.idioma, opts.correo.asunto, opts.correo.html, opts.correo.texto, r.id ?? null, r.id ? "enviado" : "fallo", r.error ?? null],
  );
  if (!r.id) await reintentarOFallar(opts.para, opts.tipo, r.error ?? "error desconocido");
  return !!r.id;
}

interface FilaEnvio {
  id: string;
  para: string;
  tipo: string;
  asunto: string;
  html: string;
  texto: string;
  idioma: Idioma;
  intentos: number;
  resend_id: string | null;
}

/** Si un envío falló: lo reenvía una vez; si ya se reenvió, lo marca como fallo final y avisa al dueño. */
async function reintentarOFallar(para: string, tipo: string, motivo: string, resendId?: string) {
  const [fila] = await sql<FilaEnvio>(
    resendId
      ? `select * from envios where resend_id = $1`
      : `select * from envios where para = $1 and tipo = $2 and estado = 'fallo' order by creado desc limit 1`,
    resendId ? [resendId] : [para, tipo],
  );
  if (!fila) return;
  if (fila.intentos >= 2) {
    await sql(`update envios set estado = 'fallo_final', error = $2, actualizado = now() where id = $1`, [fila.id, motivo]);
    await alertarDueno(
      `No se pudo entregar un email (${fila.tipo})`,
      `Para: ${fila.para}\nAsunto: ${fila.asunto}\nIdioma: ${fila.idioma}\nIntentos: ${fila.intentos}\nMotivo: ${motivo}`,
    );
    return;
  }
  const correo: Correo = { idioma: fila.idioma, asunto: fila.asunto, html: fila.html, texto: fila.texto, esperado: { frases: [], enlaces: [] } };
  const enlaceBaja = fila.html.match(/href="([^"]+\/suscripcion\/baja\?t=[^"]+)"/)?.[1];
  const r = await mandarAResend(fila.para, correo, enlaceBaja);
  await sql(
    `update envios set intentos = intentos + 1, resend_id = coalesce($2, resend_id), estado = $3, error = $4, actualizado = now() where id = $1`,
    [fila.id, r.id ?? null, r.id ? "reenviado" : "fallo", r.error ?? motivo],
  );
  if (!r.id) await reintentarOFallar(fila.para, fila.tipo, r.error ?? motivo);
}

/** Lo que informa Resend de cada email (webhook o consulta). */
export async function registrarEvento(resendId: string, evento: string, detalle = "") {
  if (evento === "email.delivered") {
    await sql(`update envios set estado = 'entregado', actualizado = now() where resend_id = $1`, [resendId]);
  } else if (evento === "email.bounced" || evento === "email.failed") {
    const [fila] = await sql<{ estado: string }>(`select estado from envios where resend_id = $1`, [resendId]);
    if (fila && fila.estado !== "entregado" && fila.estado !== "fallo_final") await reintentarOFallar("", "", `${evento} ${detalle}`.trim(), resendId);
  } else if (evento === "email.complained") {
    // Lo marcó como spam: se lo da de baja para no volver a escribirle.
    await sql(
      `update suscriptores set estado = 'baja', dado_de_baja = now() where id = (select suscriptor_id from envios where resend_id = $1)`,
      [resendId],
    );
  }
}

/** Respaldo del webhook: consulta en Resend los envíos que siguen sin confirmar después de 30 minutos. */
export async function revisarEntregasPendientes() {
  const pendientes = await sql<{ resend_id: string }>(
    `select resend_id from envios where estado in ('enviado', 'reenviado') and resend_id is not null
     and actualizado < now() - interval '30 minutes' and creado > now() - interval '3 days' limit 20`,
  );
  for (const { resend_id } of pendientes) {
    try {
      const res = await fetch(`${API()}/emails/${resend_id}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
      const j = (await res.json()) as { last_event?: string };
      if (j.last_event === "delivered") await registrarEvento(resend_id, "email.delivered");
      else if (j.last_event === "bounced" || j.last_event === "failed") await registrarEvento(resend_id, `email.${j.last_event}`);
    } catch {}
  }
}

import { sql } from "../db";
import type { Idioma } from "../idioma";
import { alertarDueno, mandarAResend } from "./envio";
import { correoRespuestaAutomatica } from "./redactor";
import { verificarCorreo } from "./verificador";

// Respuestas a los emails de Rumbo. Llegan al buzón respuestas@reply.rumbotraveling.com (Resend lo recibe y avisa por webhook).
// El agente: 1) le reenvía todo al dueño, 2) le contesta a la persona que le va a informar al jefe (una vez por día como mucho).

const API = () => process.env.RESEND_API_URL || "https://api.resend.com";

interface Recibido {
  from?: string;
  subject?: string;
  text?: string | null;
  html?: string | null;
  message_id?: string;
  headers?: Record<string, string>;
}

/** "Ana <ana@x.com>" -> "ana@x.com" */
export const direccion = (desde: string) => (desde.match(/<([^>]+)>/)?.[1] ?? desde).trim().toLowerCase();

/** No se contesta a respuestas automáticas, rebotes ni a nosotros mismos (evita idas y vueltas infinitas). */
export function esAutomatico(desde: string, headers: Record<string, string> = {}) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()]));
  return (
    /(^|[.@])rumbotraveling\.com$/.test(desde) ||
    /mailer-daemon|postmaster|no-?reply|bounce/.test(desde) ||
    (!!h["auto-submitted"] && h["auto-submitted"] !== "no") ||
    /bulk|junk|list|auto_reply/.test(h["precedence"] ?? "") ||
    "x-autoreply" in h ||
    "x-autorespond" in h
  );
}

/** Idioma del suscriptor si lo es; si no, se adivina por el texto (por defecto, español). */
export function adivinarIdioma(texto: string): Idioma {
  const t = ` ${texto.toLowerCase()} `;
  const en = (t.match(/ (the|and|you|thanks|thank|hi|hello|please|is|are|my|for) /g) ?? []).length;
  const es = (t.match(/ (el|la|que|de|gracias|hola|por|para|mi|es|y|con) /g) ?? []).length;
  return en > es ? "en" : "es";
}

function sinCitas(texto: string) {
  // Se queda con lo que escribió la persona, sin el email original citado debajo.
  const corte = texto.search(/\n(>|On .+wrote:|El .+escribió:|-{2,}\s*Original|From: )/);
  return (corte > 0 ? texto.slice(0, corte) : texto).trim().slice(0, 4000);
}

export async function procesarRespuesta(emailId: string) {
  // Cada respuesta se procesa una sola vez, aunque el webhook llegue repetido.
  await sql(`create table if not exists respuestas_recibidas (email_id text primary key, desde text, creada timestamptz not null default now())`);
  const nueva = await sql(`insert into respuestas_recibidas (email_id) values ($1) on conflict do nothing returning email_id`, [emailId]);
  if (!nueva.length) return;

  const res = await fetch(`${API()}/emails/receiving/${emailId}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
  if (!res.ok) {
    await alertarDueno("Llegó una respuesta que no pude leer", `Id del email en Resend: ${emailId}\nEstado: ${res.status}\nMirala en resend.com → Emails → Receiving.`);
    return;
  }
  const r = (await res.json()) as Recibido;
  const desde = direccion(r.from ?? "");
  await sql(`update respuestas_recibidas set desde = $2 where email_id = $1`, [emailId, desde]);
  const cuerpo = sinCitas(r.text ?? (r.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

  // 1) Al dueño, siempre: con "Responder" le contesta directo a la persona.
  await alertarDueno(`Te respondió ${desde}: ${r.subject ?? ""}`.trim(), `De: ${r.from ?? desde}\nAsunto: ${r.subject ?? ""}\n\n${cuerpo || "(sin texto)"}`, desde);

  // 2) A la persona: respuesta automática, salvo que sea otra respuesta automática o ya le contestamos hoy.
  if (!desde || esAutomatico(desde, r.headers)) return;
  const [{ n }] = await sql<{ n: number }>(
    `select count(*)::int as n from respuestas_recibidas where desde = $1 and creada > now() - interval '24 hours' and email_id <> $2`,
    [desde, emailId],
  );
  if (n > 0) return;
  const [s] = await sql<{ idioma: Idioma }>(`select idioma from suscriptores where email = $1`, [desde]);
  const idioma = s?.idioma ?? adivinarIdioma(`${r.subject ?? ""} ${cuerpo}`);
  const correo = correoRespuestaAutomatica(idioma, r.subject ?? "");
  const problemas = verificarCorreo(correo, idioma);
  if (problemas.length) {
    await alertarDueno("Respuesta automática frenada por el verificador", `Para: ${desde}\n- ${problemas.join("\n- ")}`);
    return;
  }
  const envio = await mandarAResend(desde, correo, undefined, {
    headers: { "Auto-Submitted": "auto-replied", ...(r.message_id && { "In-Reply-To": r.message_id, References: r.message_id }) },
  });
  if (envio.error) await alertarDueno("No se pudo mandar la respuesta automática", `Para: ${desde}\nMotivo: ${envio.error}`);
}

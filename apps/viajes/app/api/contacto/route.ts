import { emailBloqueado } from "@/lib/bloqueados";
import { alertarDueno, mandarAResend } from "@/lib/correo/envio";
import { correoRespuestaAutomatica } from "@/lib/correo/redactor";
import { verificarCorreo } from "@/lib/correo/verificador";
import { dbConfigurada } from "@/lib/db";
import { guardarMensaje } from "@/lib/mensajes";
import { COOKIE_PAUSA, SEGUNDOS_PAUSA, tieneGroserias } from "@/lib/groserias";
import { esIdioma } from "@/lib/idioma";

export const runtime = "nodejs";

// Como mucho 4 mensajes por hora desde la misma conexión (por instancia del servidor).
const pedidos = new Map<string, number[]>();
function permitido(ip: string) {
  const ahora = Date.now();
  const recientes = (pedidos.get(ip) ?? []).filter((t) => ahora - t < 3600_000);
  if (recientes.length >= 4) return false;
  pedidos.set(ip, [...recientes, ahora]);
  return true;
}

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

/** POST { nombre, email, mensaje, idioma, sitio }: le llega un email al dueño; "Responder" le contesta a la persona. */
export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) return Response.json({ error: "inactivo" }, { status: 503 });
  const c = await req.json().catch(() => null);
  const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const nombre = texto(c?.nombre, 80);
  const email = texto(c?.email, 200);
  const mensaje = texto(c?.mensaje, 3000);
  if (c?.sitio) return Response.json({ ok: true }); // campo trampa para robots
  if (!EMAIL.test(email)) return Response.json({ error: "email" }, { status: 400 });
  if (emailBloqueado(email)) return Response.json({ ok: true }); // bloqueado por el dueño
  if (mensaje.length < 5) return Response.json({ error: "mensaje" }, { status: 400 });
  if (tieneGroserias(`${nombre} ${mensaje}`)) {
    const hasta = Date.now() + SEGUNDOS_PAUSA * 1000;
    return Response.json(
      { error: "pausa" },
      { status: 403, headers: { "Set-Cookie": `${COOKIE_PAUSA}=${hasta}; Max-Age=${SEGUNDOS_PAUSA}; Path=/; HttpOnly; Secure; SameSite=Lax` } },
    );
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  if (!permitido(ip)) return Response.json({ error: "limite" }, { status: 429 });
  const idioma = esIdioma(c?.idioma) ? c.idioma : "es";
  try {
    const enviado = await alertarDueno(
      `📩 Mensaje de contacto${nombre ? ` de ${nombre}` : ""}`,
      `Alguien te escribió desde la página de contacto de Rumbo.\n\nNombre: ${nombre || "(no lo puso)"}\nEmail: ${email}\nIdioma: ${idioma === "es" ? "español" : "inglés"}\n\n${mensaje}\n\nPara contestarle, tocá "Responder": le llega directo a ${email}.`,
      email,
    );
    if (!enviado) return Response.json({ error: "servidor" }, { status: 502 });
    // Al cliente: confirmación automática en su idioma ("le vamos a informar a nuestro jefe, Pascual Pepa").
    // Si responde ese email, llega al buzón de respuestas y el agente de respuestas se lo reenvía al dueño.
    const confirmacion = correoRespuestaAutomatica(idioma, idioma === "es" ? "Tu mensaje a Rumbo Traveling" : "Your message to Rumbo Traveling");
    let respondido = false;
    if (!verificarCorreo(confirmacion, idioma).length) {
      const r = await mandarAResend(email, confirmacion, undefined, { headers: { "Auto-Submitted": "auto-replied" } });
      respondido = !r.error;
      if (r.error) console.error("contacto, confirmación:", r.error);
    }
    if (dbConfigurada()) {
      await guardarMensaje({ origen: "formulario", nombre, email, asunto: "", texto: mensaje, idioma, respuesta_automatica: respondido }).catch((e) =>
        console.error("contacto, guardar:", e),
      );
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("contacto:", e);
    return Response.json({ error: "servidor" }, { status: 500 });
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { BASE_AYUDA, buscarAyuda, fichaComoTexto } from "@/lib/ayuda-base";
import { LIMITES, SISTEMA, type MensajeChat } from "@/lib/ayudante";
import { COOKIE_PAUSA, SEGUNDOS_PAUSA, tieneGroserias } from "@/lib/groserias";
import { responderCuenta } from "@/lib/calculadora";
import { esIdioma, type Idioma } from "@/lib/idioma";

export const runtime = "nodejs";
export const maxDuration = 60;

// Límite simple por IP para cuidar el costo (por instancia del servidor).
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 20;
const pedidos = new Map<string, number[]>();

const AVISOS: Record<Idioma, Record<string, string>> = {
  es: {
    pausa: "Ese lenguaje no está permitido. Vas a tener que esperar un minuto.",
    sinCoincidencia: "Todavía no puedo responder preguntas de cualquier tema: por ahora te ayudo con Rumbo y con cuentas. Probá preguntarlo de otra forma o elegí uno de estos temas:",
    limite: "Hiciste muchas preguntas seguidas. Esperá unos minutos y volvé a probar.",
    invalido: "No pude leer tu mensaje. Probá escribirlo de nuevo.",
    rechazo: "Perdón, no puedo ayudar con eso. ¿Te ayudo con algo de tu viaje?",
    demanda: "El asistente está con mucha demanda. Probá de nuevo en un minuto.",
    configuracion: "El asistente no está bien configurado. Avisale al administrador.",
    error: "Hubo un problema al responder. Probá de nuevo.",
  },
  en: {
    pausa: "That language isn't allowed. You'll have to wait a minute.",
    sinCoincidencia: "I can't answer questions on any topic yet: for now I can help with Rumbo and with math. Try asking another way, or pick one of these topics:",
    limite: "You've asked a lot of questions in a row. Wait a few minutes and try again.",
    invalido: "I couldn't read your message. Try writing it again.",
    rechazo: "Sorry, I can't help with that. Can I help with something about your trip?",
    demanda: "The assistant is very busy right now. Try again in a minute.",
    configuracion: "The assistant isn't set up correctly. Please let the site admin know.",
    error: "Something went wrong while answering. Please try again.",
  },
};

function permitido(ip: string) {
  const ahora = Date.now();
  const recientes = (pedidos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAX_POR_VENTANA) return false;
  recientes.push(ahora);
  pedidos.set(ip, recientes);
  return true;
}

function validar(cuerpo: unknown): { mensajes: MensajeChat[]; contexto: string } | null {
  const c = cuerpo as { mensajes?: unknown; contexto?: unknown };
  if (!Array.isArray(c?.mensajes) || c.mensajes.length === 0 || c.mensajes.length > LIMITES.mensajes) return null;
  const mensajes: MensajeChat[] = [];
  for (const m of c.mensajes) {
    const { role, content } = (m ?? {}) as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const texto = content.trim().slice(0, LIMITES.caracteres);
    if (!texto) return null;
    mensajes.push({ role, content: texto });
  }
  if (mensajes[0].role !== "user" || mensajes.at(-1)!.role !== "user") return null;
  const contexto = typeof c.contexto === "string" ? c.contexto.slice(0, 600) : "";
  return { mensajes, contexto };
}

const texto = (t: string, status: number) =>
  new Response(t, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  const idioma: Idioma = esIdioma(cuerpo?.idioma) ? cuerpo.idioma : "es";
  const aviso = AVISOS[idioma];
  const datos = validar(cuerpo);
  if (!datos) return texto(aviso.invalido, 400);

  // Malas palabras: un minuto de pausa. La cookie la controla middleware.ts en toda la web.
  if (tieneGroserias(datos.mensajes.at(-1)!.content)) {
    const hasta = Date.now() + SEGUNDOS_PAUSA * 1000;
    return new Response(aviso.pausa, {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Rumbo-Pausa": "1",
        "Set-Cookie": `${COOKIE_PAUSA}=${hasta}; Max-Age=${SEGUNDOS_PAUSA}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  // Cuentas ("2 más 2"): las resuelve la calculadora, exacta y sin costo, con o sin IA.
  const cuenta = responderCuenta(datos.mensajes.at(-1)!.content, idioma);
  if (cuenta) return texto(cuenta, 200);

  // Sin clave de Claude, responde directo desde la ficha: siempre exacto, aunque menos flexible.
  if (!process.env.ANTHROPIC_API_KEY) {
    const entrada = buscarAyuda(datos.mensajes.at(-1)!.content, idioma);
    if (entrada) return texto(entrada.respuesta, 200);
    const temas = BASE_AYUDA[idioma].slice(0, 6).map((e) => `• ${e.pregunta}`).join("\n");
    return texto(`${aviso.sinCoincidencia}\n${temas}`, 200);
  }

  // El límite solo cuida el costo de la IA: la ficha no cuesta nada.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  if (!permitido(ip)) {
    return texto(aviso.limite, 429);
  }

  const client = new Anthropic();
  const idiomaWeb =
    idioma === "en"
      ? "La persona usa la web en inglés: respondé en inglés, salvo que escriba en otro idioma."
      : "La persona usa la web en español.";
  const sistema = `${SISTEMA}\n\nFicha de Rumbo Traveling (única fuente sobre la web):\n${fichaComoTexto(idioma)}\n\n${idiomaWeb}${datos.contexto ? `\nContexto de la persona en la web: ${datos.contexto}` : ""}`;

  const salida = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const stream = client.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 2000, // respuestas de chat cortas; tope de costo
          output_config: { effort: "medium" }, // un poco más de cuidado: la precisión importa más que la velocidad
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: sistema,
          messages: datos.mensajes,
        });
        for await (const evento of stream) {
          if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
            controller.enqueue(enc.encode(evento.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(enc.encode(aviso.rechazo));
        }
      } catch (error) {
        const mensaje =
          error instanceof Anthropic.RateLimitError
            ? aviso.demanda
            : error instanceof Anthropic.APIError && error.status === 401
              ? aviso.configuracion
              : aviso.error;
        controller.enqueue(enc.encode(`\n\n${mensaje}`));
        console.error("ayudante:", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(salida, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

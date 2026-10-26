import Anthropic from "@anthropic-ai/sdk";
import { LIMITES, SISTEMA, type MensajeChat } from "@/lib/ayudante";

export const runtime = "nodejs";
export const maxDuration = 60;

// Límite simple por IP para cuidar el costo (por instancia del servidor).
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 20;
const pedidos = new Map<string, number[]>();

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
  if (!process.env.ANTHROPIC_API_KEY) {
    return texto("El asistente todavía no está activado. Volvé a probar más tarde.", 503);
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  if (!permitido(ip)) {
    return texto("Hiciste muchas preguntas seguidas. Esperá unos minutos y volvé a probar.", 429);
  }
  const datos = validar(await req.json().catch(() => null));
  if (!datos) return texto("No pude leer tu mensaje. Probá escribirlo de nuevo.", 400);

  const client = new Anthropic();
  const sistema = datos.contexto ? `${SISTEMA}\n\nContexto de la persona en la web: ${datos.contexto}` : SISTEMA;

  const salida = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const stream = client.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 2000, // respuestas de chat cortas; tope de costo
          output_config: { effort: "low" },
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
          controller.enqueue(enc.encode("Perdón, no puedo ayudar con eso. ¿Te ayudo con algo de tu viaje?"));
        }
      } catch (error) {
        const aviso =
          error instanceof Anthropic.RateLimitError
            ? "El asistente está con mucha demanda. Probá de nuevo en un minuto."
            : error instanceof Anthropic.APIError && error.status === 401
              ? "El asistente no está bien configurado. Avisale al administrador."
              : "Hubo un problema al responder. Probá de nuevo.";
        controller.enqueue(enc.encode(`\n\n${aviso}`));
        console.error("ayudante:", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(salida, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

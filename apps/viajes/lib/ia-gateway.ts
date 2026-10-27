import { getVercelOidcToken } from "@vercel/oidc";
import type { MensajeChat } from "./ayudante";

// El guía usa modelos de IA a través del AI Gateway de Vercel (https://vercel.com/docs/ai-gateway).
// En Vercel se autentica solo con el token OIDC del proyecto: no hace falta ninguna clave.
// AYUDANTE_MODELO elige el modelo (por defecto, uno del plan gratis).

const URL_GATEWAY = "https://ai-gateway.vercel.sh/v1/chat/completions";
export const MODELO_GRATIS = "nvidia/nemotron-3.5-lightning-free";

async function credencial(): Promise<string | null> {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  try {
    return await getVercelOidcToken();
  } catch {
    return null; // fuera de Vercel y sin clave: no hay IA
  }
}

export class ErrorIA extends Error {
  constructor(
    public motivo: "sin_credencial" | "limite" | "cuenta" | "error",
    detalle = "",
  ) {
    super(`${motivo} ${detalle}`.trim());
  }
}

/**
 * Pide una respuesta en streaming y va entregando el texto a medida que llega.
 * Lanza ErrorIA si falla antes de producir texto (así quien llama puede usar otra respuesta).
 */
export async function* responderConGateway(sistema: string, mensajes: MensajeChat[], maxTokens = 2500): AsyncGenerator<string> {
  const token = await credencial();
  if (!token) throw new ErrorIA("sin_credencial");
  const res = await fetch(URL_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.AYUDANTE_MODELO || MODELO_GRATIS,
      stream: true,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: sistema }, ...mensajes],
    }),
    signal: AbortSignal.timeout(55_000),
  });
  if (!res.ok || !res.body) {
    const detalle = await res.text().catch(() => "");
    throw new ErrorIA(res.status === 429 ? "limite" : /credit card|customer_verification|insufficient|credits/i.test(detalle) ? "cuenta" : "error", `${res.status} ${detalle.slice(0, 200)}`);
  }
  // Server-Sent Events: líneas "data: {...}" con trozos de texto, y "data: [DONE]" al final.
  const lector = res.body.getReader();
  const dec = new TextDecoder();
  let resto = "";
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    resto += dec.decode(value, { stream: true });
    const lineas = resto.split("\n");
    resto = lineas.pop() ?? "";
    for (const linea of lineas) {
      const dato = linea.replace(/^data:\s*/, "").trim();
      if (!linea.startsWith("data:") || !dato || dato === "[DONE]") continue;
      try {
        const j = JSON.parse(dato) as { choices?: { delta?: { content?: string } }[] };
        const trozo = j.choices?.[0]?.delta?.content;
        if (trozo) yield trozo;
      } catch {}
    }
  }
}

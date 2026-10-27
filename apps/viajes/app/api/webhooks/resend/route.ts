import { createHmac, timingSafeEqual } from "node:crypto";
import { registrarEvento } from "@/lib/correo/envio";
import { procesarRespuesta } from "@/lib/correo/respuestas";

export const runtime = "nodejs";

/**
 * Avisos de Resend sobre cada email (entregado, rebotado, marcado como spam...).
 * Vienen firmados con Svix: se controla la firma con RESEND_WEBHOOK_SECRET antes de creerles.
 * https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
 */
function firmaValida(cuerpo: string, id: string, momento: string, firmas: string, secreto: string) {
  if (Math.abs(Date.now() / 1000 - Number(momento)) > 5 * 60) return false; // evita reenvíos viejos
  const clave = Buffer.from(secreto.replace(/^whsec_/, ""), "base64");
  const esperada = createHmac("sha256", clave).update(`${id}.${momento}.${cuerpo}`).digest();
  return firmas.split(" ").some((f) => {
    const [version, valor] = f.split(",");
    if (version !== "v1" || !valor) return false;
    const recibida = Buffer.from(valor, "base64");
    return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
  });
}

export async function POST(req: Request) {
  const secreto = process.env.RESEND_WEBHOOK_SECRET;
  if (!secreto) return new Response("sin configurar", { status: 503 });
  const cuerpo = await req.text();
  const id = req.headers.get("svix-id") ?? "";
  const momento = req.headers.get("svix-timestamp") ?? "";
  const firmas = req.headers.get("svix-signature") ?? "";
  if (!firmaValida(cuerpo, id, momento, firmas, secreto)) return new Response("firma inválida", { status: 401 });
  const evento = JSON.parse(cuerpo) as { type?: string; data?: { email_id?: string; bounce?: { message?: string } } };
  if (evento.type === "email.received" && evento.data?.email_id) {
    // Alguien respondió un email de Rumbo: el agente contesta y le reenvía todo al dueño.
    await procesarRespuesta(evento.data.email_id);
  } else if (evento.type && evento.data?.email_id) {
    await registrarEvento(evento.data.email_id, evento.type, evento.data.bounce?.message ?? "");
  }
  return new Response("ok");
}

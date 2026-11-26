import { NextResponse } from "next/server";
import { construirHtml } from "@/lib/creador/construir";
import { ErrorIA, generarConIA, iaDisponible } from "@/lib/creador/ia";
import { interpretar } from "@/lib/creador/interprete";
import type { EspecJuego } from "@/lib/creador/espec";
import { ipDe, permitir } from "@/lib/limite";
import { limpiarTexto } from "@/lib/moderacion";

export const maxDuration = 300;

interface Cuerpo {
  pedido: string;
  espec?: EspecJuego | null;
  html?: string | null;
  historial?: { rol: "usuario" | "ia"; texto: string }[];
  motor?: "auto" | "local";
}

const GENERACIONES_POR_DIA = Number(process.env.GENERACIONES_IA_POR_DIA || 25);

export async function POST(req: Request) {
  let c: Cuerpo;
  try { c = (await req.json()) as Cuerpo; } catch { return NextResponse.json({ error: "Pedido inválido" }, { status: 400 }); }
  const pedido = limpiarTexto(String(c.pedido ?? ""), 800);
  if (pedido.length < 2) return NextResponse.json({ error: "Contame qué juego querés hacer." }, { status: 400 });

  // La IA de Claude se usa si hay clave, presupuesto y cupo diario; si no, el intérprete local.
  const quiereIA = c.motor !== "local" && iaDisponible();
  if (quiereIA && permitir(`ia:${ipDe(req)}`, GENERACIONES_POR_DIA, 86_400_000)) {
    try {
      const html = c.html && c.html.length < 400_000 ? c.html : c.espec ? construirHtml(c.espec) : null;
      const r = await generarConIA(pedido, html, c.historial ?? []);
      return NextResponse.json({ motor: "ia", explicacion: r.explicacion, titulo: r.titulo, descripcion: r.descripcion, html: r.html, espec: null });
    } catch (e) {
      const motivo = e instanceof ErrorIA ? e.motivo : "api";
      console.error("[creador] IA falló, uso intérprete local:", e);
      const local = interpretar(pedido, c.espec ?? null);
      const aviso = motivo === "sin_presupuesto" ? " (La IA avanzada llegó al límite de gasto del mes: usé el generador rápido.)" : motivo === "rechazo" ? " (La IA no pudo hacer ese pedido: usé el generador rápido.)" : "";
      return NextResponse.json({ motor: "local", explicacion: local.explicacion + aviso, titulo: local.espec.titulo, descripcion: local.espec.descripcion, html: construirHtml(local.espec), espec: local.espec });
    }
  }
  if (!c.espec && c.html) {
    return NextResponse.json({ motor: "local", entendido: false, explicacion: "Este juego fue hecho con la IA avanzada, que no está disponible en este momento. Probá de nuevo en un rato o empezá uno nuevo desde una plantilla.", html: c.html, espec: null });
  }
  const local = interpretar(pedido, c.espec ?? null);
  return NextResponse.json({ motor: "local", entendido: local.entendido, explicacion: local.explicacion, titulo: local.espec.titulo, descripcion: local.espec.descripcion, html: construirHtml(local.espec), espec: local.espec });
}

export async function GET() {
  return NextResponse.json({ ia: iaDisponible() });
}

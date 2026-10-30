import { buscarHoteles, hotelesPermitido } from "@/lib/hoteles";
import { esPremium, usuarioDeSesion } from "@/lib/cuentas";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";
export const maxDuration = 30;

const IATA = /^[A-Z]{3}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** POST { aeropuerto, entrada, salida, adultos } → hoteles que se pueden reservar en la web, con nuestra comisión incluida. */
export async function POST(req: Request) {
  if (!hotelesPermitido()) return Response.json({ error: "inactivo" }, { status: 503 });
  if (!permitido(`hoteles:${ipDe(req)}`, 30, 60 * 60 * 1000)) return Response.json({ error: "limite" }, { status: 429 });
  const c = await req.json().catch(() => null);
  const adultos = Number(c?.adultos);
  const hoy = new Date().toISOString().slice(0, 10);
  if (!IATA.test(c?.aeropuerto) || !FECHA.test(c?.entrada) || !FECHA.test(c?.salida) || c.entrada < hoy || c.salida <= c.entrada || !Number.isInteger(adultos) || adultos < 1 || adultos > 4) {
    return Response.json({ error: "datos" }, { status: 400 });
  }
  try {
    const usuario = await usuarioDeSesion();
    const premium = Boolean(usuario && esPremium(usuario));
    return Response.json({ hoteles: await buscarHoteles({ aeropuerto: c.aeropuerto, entrada: c.entrada, salida: c.salida, adultos }, premium) });
  } catch (e) {
    console.error("buscar hoteles:", e);
    return Response.json({ error: "servidor" }, { status: 502 });
  }
}

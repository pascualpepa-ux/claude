import { emitir, ErrorDuffel, modoPrueba, ventaPermitida, type Pasajero } from "@/lib/duffel";
import { alertarDueno } from "@/lib/correo/envio";
import { dbConfigurada, sql } from "@/lib/db";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";
export const maxDuration = 60;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO = /^\+[1-9]\d{6,14}$/;
const NOMBRE = /^[\p{L}][\p{L} '-]{0,39}$/u;

function pasajeroValido(p: Partial<Pasajero>): p is Pasajero {
  return (
    !!p && NOMBRE.test(p.nombre ?? "") && NOMBRE.test(p.apellido ?? "") && FECHA.test(p.nacimiento ?? "") &&
    (p.genero === "m" || p.genero === "f") && ["mr", "ms", "mrs"].includes(p.tratamiento ?? "") &&
    EMAIL.test(p.email ?? "") && TELEFONO.test(p.telefono ?? "")
  );
}

/** POST { ofertaId, pasajeros } → emite el pasaje y devuelve el código de reserva de la aerolínea. */
export async function POST(req: Request) {
  if (!ventaPermitida()) return Response.json({ error: "inactivo" }, { status: 503 });
  if (!permitido(`emitir:${ipDe(req)}`, 6, 60 * 60 * 1000)) return Response.json({ error: "limite" }, { status: 429 });
  const c = await req.json().catch(() => null);
  const pasajeros = Array.isArray(c?.pasajeros) ? c.pasajeros : [];
  if (typeof c?.ofertaId !== "string" || !/^off_\w+$/.test(c.ofertaId) || !pasajeros.length || !pasajeros.every(pasajeroValido)) {
    return Response.json({ error: "datos" }, { status: 400 });
  }
  try {
    const r = await emitir(c.ofertaId, pasajeros);
    const ruta = r.oferta.tramos.map((t) => `${t.segmentos[0].desde}→${t.segmentos[t.segmentos.length - 1].hasta} ${t.salida.slice(0, 10)}`).join(", ");
    if (dbConfigurada()) {
      await sql(
        `insert into reservas (codigo, orden, email, ruta, precio, costo, moneda, prueba) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [r.codigo, r.orden, pasajeros[0].email, ruta, r.oferta.precio, r.costo, r.oferta.moneda, modoPrueba()],
      ).catch((e) => console.error("guardar reserva:", e));
    }
    await alertarDueno(
      `${modoPrueba() ? "[PRUEBA] " : ""}Pasaje vendido: ${ruta}`,
      `Código de reserva: ${r.codigo}\nRuta: ${ruta}\nAerolínea: ${r.oferta.aerolinea}\nPrecio cobrado: ${r.oferta.precio} ${r.oferta.moneda}\nCosto (aerolínea): ${r.costo} ${r.oferta.moneda}\nComisión: ${(r.oferta.precio - r.costo).toFixed(2)} ${r.oferta.moneda}\nCliente: ${pasajeros[0].email}\nPasajeros: ${pasajeros.length}`,
    ).catch(() => {});
    return Response.json({ codigo: r.codigo, oferta: r.oferta });
  } catch (e) {
    console.error("emitir pasaje:", e);
    if (e instanceof ErrorDuffel && e.status < 500) return Response.json({ error: "oferta" }, { status: 409 });
    if (e instanceof ErrorDuffel) return Response.json({ error: "aerolinea" }, { status: 502 });
    return Response.json({ error: "servidor" }, { status: 502 });
  }
}

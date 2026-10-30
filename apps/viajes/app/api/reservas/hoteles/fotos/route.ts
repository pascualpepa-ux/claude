import { fotosHotel, hotelesPermitido } from "@/lib/hoteles";

export const runtime = "nodejs";

/** GET ?hotelId=&habitacion= → fotos de la habitación y del hotel (se guardan un día en caché). */
export async function GET(req: Request) {
  if (!hotelesPermitido()) return Response.json({ error: "inactivo" }, { status: 503 });
  const q = new URL(req.url).searchParams;
  const hotelId = q.get("hotelId") ?? "";
  if (!/^[\w-]{1,40}$/.test(hotelId)) return Response.json({ error: "datos" }, { status: 400 });
  try {
    const fotos = await fotosHotel(hotelId, (q.get("habitacion") ?? "").slice(0, 120));
    return Response.json(fotos, { headers: { "Cache-Control": "public, s-maxage=86400, max-age=3600" } });
  } catch (e) {
    console.error("fotos hotel:", e);
    return Response.json({ habitacion: [], hotel: [], nombreHabitacion: "" });
  }
}

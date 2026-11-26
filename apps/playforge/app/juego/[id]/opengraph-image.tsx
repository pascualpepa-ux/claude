import { ImageResponse } from "next/og";
import { juegoPorId } from "@/lib/catalogo/generador";
import { NOMBRE_GENERO } from "@/lib/catalogo/tipos";
import { portadaSvg } from "@/lib/portadas";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Portada del juego en Playforge";

export default async function Imagen({ params }: { params: Promise<{ id: string }> }) {
  const j = juegoPorId((await params).id);
  const svg = j ? portadaSvg(j) : "";
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#07070d" }}>
        {j && <img src={src} width={1200} height={750} style={{ position: "absolute", top: -60, left: 0 }} alt="" />}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(0deg, rgba(7,7,13,.95) 0%, rgba(7,7,13,.2) 55%, rgba(7,7,13,0) 100%)" }} />
        <div style={{ position: "absolute", left: 60, bottom: 50, right: 60, display: "flex", flexDirection: "column", color: "white" }}>
          <div style={{ fontSize: 30, color: "#a78bfa", fontWeight: 700 }}>{`${j ? NOMBRE_GENERO[j.generos[0]] + " · " : ""}Jugá gratis en Playforge`}</div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, marginTop: 10 }}>{j?.nombre ?? "Playforge"}</div>
        </div>
      </div>
    ),
    size,
  );
}

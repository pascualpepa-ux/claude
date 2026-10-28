import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FUENTE } from "./marca";

/** Entrada con resorte que empieza en `desde` (frames). Devuelve 0 → 1. */
export function useEntrada(desde = 0, rigidez = 120) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - desde, fps, config: { damping: 18, stiffness: rigidez, mass: 0.9 } });
}

export const Fondo: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = C.arena50, children }) => (
  <AbsoluteFill style={{ backgroundColor: color, fontFamily: FUENTE, color: C.arena900 }}>{children}</AbsoluteFill>
);

/** Marca de agua del isotipo, como en la portada de la web. */
export const MarcaDeAgua: React.FC<{ opacidad?: number }> = ({ opacidad = 0.06 }) => {
  const frame = useCurrentFrame();
  return (
    <Img
      src={staticFile("marca/marca-oliva.png")}
      style={{ position: "absolute", right: -160, bottom: -140, height: 760, opacity: opacidad, transform: `rotate(${-4 + frame * 0.01}deg)` }}
    />
  );
};

/** Bloque de texto de cada escena: cejilla, título grande y bajada, entrando de a uno. */
export const BloqueTexto: React.FC<{ cejilla: string; titulo: string; bajada: string; ancho?: number }> = ({ cejilla, titulo, bajada, ancho = 760 }) => {
  const a = useEntrada(4);
  const b = useEntrada(10);
  const c = useEntrada(18);
  const sube = (v: number) => ({ opacity: v, transform: `translateY(${interpolate(v, [0, 1], [40, 0])}px)` });
  return (
    <div style={{ width: ancho }}>
      <div style={{ ...sube(a), display: "inline-flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.oliva600 }}>
        <span style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: C.oliva600 }} />
        {cejilla}
      </div>
      <div style={{ ...sube(b), marginTop: 22, fontSize: 92, lineHeight: 1.04, fontWeight: 700, letterSpacing: -2, color: C.oliva800, textWrap: "balance" }}>{titulo}</div>
      <div style={{ ...sube(c), marginTop: 28, fontSize: 40, lineHeight: 1.3, color: C.arena600, textWrap: "balance" }}>{bajada}</div>
    </div>
  );
};

/** Ventana de navegador con rumbotraveling.com y una captura adentro. */
export const Ventana: React.FC<{ ancho: number; alto: number; children: React.ReactNode; estilo?: React.CSSProperties }> = ({ ancho, alto, children, estilo }) => (
  <div
    style={{
      width: ancho,
      height: alto,
      borderRadius: 26,
      overflow: "hidden",
      backgroundColor: C.papel,
      border: `2px solid ${C.arena200}`,
      boxShadow: "0 40px 90px rgba(70, 74, 52, 0.22), 0 8px 24px rgba(70, 74, 52, 0.10)",
      display: "flex",
      flexDirection: "column",
      ...estilo,
    }}
  >
    <div style={{ height: 58, flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", backgroundColor: C.arena100, borderBottom: `2px solid ${C.arena200}` }}>
      {[C.arena300, C.arena300, C.arena300].map((c, i) => (
        <span key={i} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c }} />
      ))}
      <span style={{ marginLeft: 18, padding: "7px 22px", borderRadius: 20, backgroundColor: C.papel, fontSize: 22, color: C.arena600 }}>rumbotraveling.com</span>
    </div>
    <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>{children}</div>
  </div>
);

/** Captura como tarjeta flotante (las capturas están a doble resolución). */
export const Tarjeta: React.FC<{ src: string; ancho: number; estilo?: React.CSSProperties }> = ({ src, ancho, estilo }) => (
  <Img
    src={staticFile(src)}
    style={{
      width: ancho,
      borderRadius: 22,
      boxShadow: "0 30px 70px rgba(70, 74, 52, 0.20), 0 6px 18px rgba(70, 74, 52, 0.10)",
      ...estilo,
    }}
  />
);

/** Disposición de las escenas de funciones: texto a la izquierda, imagen a la derecha. */
export const Escena: React.FC<{ texto: React.ReactNode; children: React.ReactNode; fondo?: string }> = ({ texto, children, fondo }) => (
  <Fondo color={fondo}>
    <MarcaDeAgua opacidad={0.04} />
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 110px", gap: 80 }}>
      <div style={{ flexShrink: 0 }}>{texto}</div>
      <div style={{ position: "relative", flex: 1, height: "100%" }}>{children}</div>
    </AbsoluteFill>
  </Fondo>
);

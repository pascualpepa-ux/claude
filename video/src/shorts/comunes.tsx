import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fondo, MarcaDeAgua, useEntrada } from "../comunes";
import { C } from "../marca";

/** Aparece desde abajo con resorte, a partir del frame `desde`. */
export const Sube: React.FC<{ desde?: number; distancia?: number; children: React.ReactNode; estilo?: React.CSSProperties }> = ({ desde = 0, distancia = 50, children, estilo }) => {
  const v = useEntrada(desde, 130);
  return <div style={{ opacity: v, transform: `translateY(${interpolate(v, [0, 1], [distancia, 0])}px)`, ...estilo }}>{children}</div>;
};

/** Pantalla de cierre de todos los Shorts: logo, invitación y dirección. */
export const CierreShort: React.FC<{ frase: string; url: string; firma: string }> = ({ frase, url, firma }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 100 } });
  return (
    <Fondo color={C.arena100}>
      <MarcaDeAgua opacidad={0.05} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80, textAlign: "center" }}>
        <Img src={staticFile("marca/marca-oliva.png")} style={{ height: 230, opacity: logo, transform: `scale(${interpolate(logo, [0, 1], [0.85, 1])})` }} />
        <div style={{ marginTop: 10, fontSize: 64, fontWeight: 700, color: C.oliva700, opacity: logo }}>Rumbo Traveling</div>
        <Sube desde={14}>
          <div style={{ marginTop: 60, fontSize: 70, fontWeight: 700, lineHeight: 1.1, color: C.oliva800, textWrap: "balance" }}>{frase}</div>
        </Sube>
        <Sube desde={24}>
          <div style={{ marginTop: 44, padding: "24px 46px", borderRadius: 28, backgroundColor: C.oliva700, color: "#fff", fontSize: 50, fontWeight: 600 }}>{url}</div>
        </Sube>
        <Sube desde={40}>
          <div style={{ marginTop: 50, fontSize: 30, color: C.arena500 }}>{firma}</div>
        </Sube>
      </AbsoluteFill>
    </Fondo>
  );
};

/** Pantalla de gancho con fondo oliva: cejilla y título enorme. */
export const Gancho: React.FC<{ cejilla: string; titulo: string; bajada?: string }> = ({ cejilla, titulo, bajada }) => (
  <Fondo color={C.oliva800}>
    <Img src={staticFile("marca/marca-oliva.png")} style={{ position: "absolute", right: -200, bottom: 120, height: 700, opacity: 0.12, filter: "brightness(2.2)" }} />
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 80px" }}>
      <Sube desde={2}>
        <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.oliva300 }}>{cejilla}</div>
      </Sube>
      <Sube desde={8}>
        <div style={{ marginTop: 26, fontSize: 124, lineHeight: 1.02, fontWeight: 700, letterSpacing: -3, color: C.arena50, textWrap: "balance" }}>{titulo}</div>
      </Sube>
      {bajada && (
        <Sube desde={20}>
          <div style={{ marginTop: 36, fontSize: 52, lineHeight: 1.2, color: C.arena200, textWrap: "balance" }}>{bajada}</div>
        </Sube>
      )}
    </AbsoluteFill>
  </Fondo>
);

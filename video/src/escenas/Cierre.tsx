import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Fondo, MarcaDeAgua, useEntrada } from "../comunes";
import { C } from "../marca";
import type { Textos } from "../textos";

/** 4-5. Cierre: logo, dirección, invitación y, al final, la firma chiquita. */
export const Cierre: React.FC<{ t: Textos; duracion: number }> = ({ t, duracion }) => {
  const frame = useCurrentFrame();
  const logo = useEntrada(6, 90);
  const url = useEntrada(22, 110);
  const cta = useEntrada(38, 110);
  const firma = interpolate(frame, [duracion - 130, duracion - 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const brillo = interpolate((frame - 60) % 90, [0, 45, 90], [0, 1, 0]);
  return (
    <Fondo color={C.arena100}>
      <MarcaDeAgua opacidad={0.05} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Img
          src={staticFile("marca/marca-oliva.png")}
          style={{ height: 230, opacity: logo, transform: `scale(${interpolate(logo, [0, 1], [0.85, 1])})` }}
        />
        <div style={{ marginTop: 10, fontSize: 62, fontWeight: 700, letterSpacing: -1, color: C.oliva700, opacity: logo }}>Rumbo Traveling</div>
        <div
          style={{
            marginTop: 50,
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: -3,
            color: C.oliva800,
            opacity: url,
            transform: `translateY(${interpolate(url, [0, 1], [40, 0])}px)`,
          }}
        >
          rumbotraveling.com
        </div>
        <div
          style={{
            marginTop: 44,
            padding: "26px 60px",
            borderRadius: 26,
            backgroundColor: C.oliva700,
            color: "#fff",
            fontSize: 48,
            fontWeight: 600,
            opacity: cta,
            transform: `translateY(${interpolate(cta, [0, 1], [40, 0])}px) scale(${1 + brillo * 0.02})`,
            boxShadow: `0 20px 50px rgba(87, 91, 64, ${0.25 + brillo * 0.15})`,
          }}
        >
          {t.cta}
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 46, width: "100%", textAlign: "center", fontSize: 26, color: C.arena500, opacity: firma }}>{t.firma}</div>
    </Fondo>
  );
};

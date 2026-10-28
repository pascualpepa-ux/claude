import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Fondo, MarcaDeAgua } from "../comunes";
import { C } from "../marca";

/** 2. "¿Planeando un viaje?", palabra por palabra. */
export const Pregunta: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palabras = texto.split(" ");
  return (
    <Fondo color={C.papel}>
      <MarcaDeAgua opacidad={0.035} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 34, fontSize: 150, fontWeight: 700, letterSpacing: -4, color: C.oliva800 }}>
          {palabras.map((p, i) => {
            const v = spring({ frame: frame - 6 - i * 6, fps, config: { damping: 14, stiffness: 140 } });
            return (
              <span key={i} style={{ display: "inline-block", opacity: v, transform: `translateY(${interpolate(v, [0, 1], [70, 0])}px) scale(${interpolate(v, [0, 1], [0.9, 1])})` }}>
                {p}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 40,
            height: 8,
            width: interpolate(frame, [26, 60], [0, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            borderRadius: 4,
            backgroundColor: C.oliva300,
          }}
        />
      </AbsoluteFill>
    </Fondo>
  );
};

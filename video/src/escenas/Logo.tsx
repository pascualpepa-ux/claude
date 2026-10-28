import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Fondo, MarcaDeAgua, useEntrada } from "../comunes";
import { C } from "../marca";


/** 1. Logo de Rumbo con una entrada suave. */
export const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const isotipo = useEntrada(6, 90);
  const nombre = useEntrada(30, 110);
  const linea = useEntrada(44, 110);
  const respira = interpolate(frame, [0, 165], [1, 1.04]);
  return (
    <Fondo color={C.arena100}>
      <MarcaDeAgua opacidad={interpolate(frame, [0, 60], [0, 0.05], { extrapolateRight: "clamp" })} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${respira})` }}>
        <Img
          src={staticFile("marca/marca-oliva.png")}
          style={{
            height: 320,
            opacity: isotipo,
            transform: `scale(${interpolate(isotipo, [0, 1], [0.82, 1])}) translateY(${interpolate(isotipo, [0, 1], [30, 0])}px)`,
            filter: `blur(${interpolate(isotipo, [0, 1], [12, 0])}px)`,
          }}
        />
        <div
          style={{
            marginTop: 26,
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: -2,
            color: C.oliva700,
            opacity: nombre,
            transform: `translateY(${interpolate(nombre, [0, 1], [36, 0])}px)`,
          }}
        >
          Rumbo Traveling
        </div>
        <div style={{ marginTop: 18, height: 6, width: interpolate(linea, [0, 1], [0, 260]), borderRadius: 3, backgroundColor: C.oliva300 }} />
      </AbsoluteFill>
    </Fondo>
  );
};

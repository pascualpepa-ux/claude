import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BloqueTexto, Escena, Tarjeta, useEntrada, Ventana } from "../comunes";
import { C } from "../marca";
import type { Idioma, Textos } from "../textos";

const suave = Easing.bezier(0.45, 0, 0.2, 1);

/** 3a. Itinerario día por día: la web real desplazándose dentro del navegador. */
export const Itinerario: React.FC<{ t: Textos; idioma: Idioma; duracion: number }> = ({ t, idioma, duracion }) => {
  const frame = useCurrentFrame();
  const entra = useEntrada(8, 90);
  const ancho = 860;
  const desplazamiento = interpolate(frame, [40, duracion - 20], [0, -1500], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  return (
    <Escena texto={<BloqueTexto {...t.itinerario} />}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Ventana ancho={ancho} alto={800} estilo={{ opacity: entra, transform: `translateY(${interpolate(entra, [0, 1], [120, 0])}px) rotate(${interpolate(entra, [0, 1], [2, 0])}deg)` }}>
          <Img src={staticFile(`capturas/${idioma}/itinerario.png`)} style={{ width: ancho - 4, transform: `translateY(${desplazamiento}px)` }} />
        </Ventana>
      </AbsoluteFill>
    </Escena>
  );
};

/** 3b. Vuelos, hoteles y clima: tres tarjetas reales que entran una tras otra. */
export const TodoJunto: React.FC<{ t: Textos; idioma: Idioma }> = ({ t, idioma }) => {
  const frame = useCurrentFrame();
  const tarjetas = [
    { src: `capturas/${idioma}/vuelo.png`, ancho: 660, top: 70, left: 0, giro: -1.5, desde: 10 },
    { src: `capturas/${idioma}/dia.png`, ancho: 640, top: 400, left: 200, giro: 1.5, desde: 24 },
    { src: `capturas/${idioma}/hotel.png`, ancho: 640, top: 760, left: 30, giro: -1, desde: 38 },
  ];
  return (
    <Escena texto={<BloqueTexto {...t.todo} />}>
      {tarjetas.map((c, i) => (
        <TarjetaQueEntra key={i} {...c} flota={Math.sin((frame + i * 20) / 22) * 6} />
      ))}
    </Escena>
  );
};

const TarjetaQueEntra: React.FC<{ src: string; ancho: number; top: number; left: number; giro: number; desde: number; flota: number }> = ({ src, ancho, top, left, giro, desde, flota }) => {
  const v = useEntrada(desde, 100);
  return (
    <div style={{ position: "absolute", top, left, opacity: v, transform: `translateX(${interpolate(v, [0, 1], [500, 0])}px) translateY(${flota}px) rotate(${giro * v}deg)` }}>
      <Tarjeta src={src} ancho={ancho} />
    </div>
  );
};

/** 3c. Quién debe a quién: la sección real de la web con zoom a los pagos. */
export const Gastos: React.FC<{ t: Textos; idioma: Idioma; duracion: number }> = ({ t, idioma, duracion }) => {
  const frame = useCurrentFrame();
  const entra = useEntrada(8, 90);
  const zoom = interpolate(frame, [60, duracion - 30], [1, 1.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  return (
    <Escena texto={<BloqueTexto {...t.gastos} />}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Ventana ancho={860} alto={820} estilo={{ opacity: entra, transform: `translateY(${interpolate(entra, [0, 1], [120, 0])}px)` }}>
          <Img
            src={staticFile(`capturas/${idioma}/gastos.png`)}
            style={{ width: 856, transformOrigin: "99% 24%", transform: `scale(${zoom})` }}
          />
        </Ventana>
      </AbsoluteFill>
    </Escena>
  );
};

/** 3d. Avisos: una notificación y el email real de Rumbo. */
export const Alertas: React.FC<{ t: Textos; idioma: Idioma }> = ({ t, idioma }) => {
  const frame = useCurrentFrame();
  const email = useEntrada(40, 80);
  const noti = useEntrada(14, 130);
  return (
    <Escena texto={<BloqueTexto {...t.alertas} />}>
      <div style={{ position: "absolute", top: 300, left: 130, opacity: email, transform: `translateY(${interpolate(email, [0, 1], [260, 0])}px)` }}>
        <Tarjeta src={`capturas/${idioma}/email.png`} ancho={600} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 40,
          width: 780,
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "26px 30px",
          borderRadius: 30,
          backgroundColor: "rgba(255, 253, 247, 0.96)",
          border: `2px solid ${C.arena200}`,
          boxShadow: "0 30px 70px rgba(70, 74, 52, 0.22)",
          opacity: noti,
          transform: `translateY(${interpolate(noti, [0, 1], [-220, 0])}px) scale(${interpolate(noti, [0, 1], [0.95, 1])})`,
        }}
      >
        <Img src={staticFile("marca/icono-512.png")} style={{ width: 84, height: 84, borderRadius: 20 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: C.arena500 }}>
            <span style={{ fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Rumbo Traveling</span>
            <span>{t.alertas.ahora}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, color: C.arena900 }}>{t.alertas.noti}</div>
          <div style={{ marginTop: 4, fontSize: 28, color: C.arena600 }}>{t.alertas.notiDetalle}</div>
        </div>
      </div>
      {/* Pulso de la notificación */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 20,
          width: 820,
          height: 180,
          borderRadius: 40,
          border: `4px solid ${C.oliva300}`,
          opacity: interpolate(frame, [30, 60], [0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(frame, [30, 60], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
        }}
      />
    </Escena>
  );
};

/** 3e. Idiomas: la portada real en español que se transforma en la de inglés. */
export const Idiomas: React.FC<{ t: Textos; idioma: Idioma }> = ({ t, idioma }) => {
  const frame = useCurrentFrame();
  const entra = useEntrada(8, 90);
  const [primero, segundo] = idioma === "es" ? (["es", "en"] as const) : (["en", "es"] as const);
  const corte = interpolate(frame, [70, 120], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  const activo = corte > 50 ? segundo : primero;
  return (
    <Escena texto={<BloqueTexto {...t.idiomas} />}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
        <Ventana ancho={860} alto={542} estilo={{ opacity: entra, transform: `translateY(${interpolate(entra, [0, 1], [120, 0])}px)` }}>
          <Img src={staticFile(`capturas/${primero}/inicio.png`)} style={{ position: "absolute", width: 856 }} />
          <Img src={staticFile(`capturas/${segundo}/inicio.png`)} style={{ position: "absolute", width: 856, clipPath: `inset(0 ${100 - corte}% 0 0)` }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${corte}%`, width: 5, backgroundColor: C.oliva600, opacity: corte > 0 && corte < 100 ? 1 : 0 }} />
        </Ventana>
        <div style={{ display: "flex", padding: 8, gap: 8, borderRadius: 999, backgroundColor: C.papel, border: `2px solid ${C.arena200}`, opacity: entra }}>
          {(["es", "en"] as const).map((i) => (
            <span
              key={i}
              style={{
                padding: "14px 40px",
                borderRadius: 999,
                fontSize: 36,
                fontWeight: 700,
                color: activo === i ? "#fff" : C.arena600,
                backgroundColor: activo === i ? C.oliva700 : "transparent",
              }}
            >
              {i.toUpperCase()}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    </Escena>
  );
};

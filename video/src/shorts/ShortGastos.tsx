import { AbsoluteFill, Audio, interpolate, staticFile } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { Fondo, MarcaDeAgua, useEntrada } from "../comunes";
import { C } from "../marca";
import type { Idioma } from "../textos";
import { CierreShort, Gancho, Sube } from "./comunes";

// Short: cómo Rumbo calcula quién le debe a quién. Los números son los del viaje de ejemplo de la web
// (Pascual, Lucía y Martín en Pekín): mismos gastos, mismo resultado que muestra rumbotraveling.com.

const T = {
  es: {
    cejilla: "Viajes con amigos",
    titulo: "¿Quién le debe a quién?",
    bajada: "Rumbo hace las cuentas por vos",
    gastosTitulo: "Cada uno anota lo que pagó",
    gastos: [
      ["Hotel en Pekín (3 noches)", "Pagó Pascual · entre 3", 540],
      ["Cena de pato laqueado", "Pagó Lucía · entre 3", 96],
      ["Entradas a la Gran Muralla", "Pagó Martín · entre 3", 75],
      ["Taxi al aeropuerto", "Pagó Lucía · entre 2", 30],
    ] as [string, string, number][],
    saldoTitulo: "Rumbo calcula cuánto le toca a cada uno",
    puso: "Puso",
    toca: "Le toca",
    resultadoTitulo: "Y te dice cómo quedar a mano",
    pagos: "2 pagos y listo",
    cierre: "Gratis y sin registrarte en",
    firma: "Un proyecto de Pascual Pepa",
  },
  en: {
    cejilla: "Traveling with friends",
    titulo: "Who owes whom?",
    bajada: "Rumbo does the math for you",
    gastosTitulo: "Everyone logs what they paid",
    gastos: [
      ["Hotel in Beijing (3 nights)", "Paid by Pascual · split 3 ways", 540],
      ["Peking duck dinner", "Paid by Lucía · split 3 ways", 96],
      ["Great Wall tickets", "Paid by Martín · split 3 ways", 75],
      ["Taxi to the airport", "Paid by Lucía · split 2 ways", 30],
    ] as [string, string, number][],
    saldoTitulo: "Rumbo works out everyone's share",
    puso: "Paid",
    toca: "Share",
    resultadoTitulo: "And tells you how to settle up",
    pagos: "2 payments and you're done",
    cierre: "Free, no sign-up, at",
    firma: "A project by Pascual Pepa",
  },
};

// Mismo resultado que la web para estos gastos.
const SALDOS: [string, number, number][] = [
  ["Pascual", 540, 237],
  ["Lucía", 126, 252],
  ["Martín", 75, 252],
];
const PAGOS: [string, string, number][] = [
  ["Martín", "Pascual", 177],
  ["Lucía", "Pascual", 126],
];

export const DUR_GASTOS = { gancho: 105, gastos: 165, saldos: 165, resultado: 165, cierre: 140 };
const TR = 10;
export const TOTAL_GASTOS = Object.values(DUR_GASTOS).reduce((a, b) => a + b, 0) - 4 * TR;

const Titulo: React.FC<{ texto: string }> = ({ texto }) => (
  <Sube>
    <div style={{ fontSize: 88, lineHeight: 1.05, fontWeight: 700, letterSpacing: -2, color: C.oliva800, textWrap: "balance" }}>{texto}</div>
  </Sube>
);

const Gastos: React.FC<{ t: (typeof T)["es"] }> = ({ t }) => (
  <Fondo>
    <MarcaDeAgua opacidad={0.04} />
    <AbsoluteFill style={{ padding: "0 80px 120px", justifyContent: "center" }}>
      <Titulo texto={t.gastosTitulo} />
      <div style={{ marginTop: 60, display: "grid", gap: 24 }}>
        {t.gastos.map(([d, quien, monto], i) => (
          <Sube key={i} desde={12 + i * 14} distancia={80}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "32px 36px", borderRadius: 30, backgroundColor: C.papel, border: `2px solid ${C.arena200}`, boxShadow: "0 18px 40px rgba(70,74,52,0.10)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 44, fontWeight: 600, color: C.arena900 }}>{d}</div>
                <div style={{ marginTop: 6, fontSize: 32, color: C.arena600 }}>{quien}</div>
              </div>
              <div style={{ fontSize: 50, fontWeight: 700, color: C.oliva700 }}>US$ {monto}</div>
            </div>
          </Sube>
        ))}
      </div>
    </AbsoluteFill>
  </Fondo>
);

const Saldos: React.FC<{ t: (typeof T)["es"] }> = ({ t }) => (
  <Fondo color={C.papel}>
    <MarcaDeAgua opacidad={0.04} />
    <AbsoluteFill style={{ padding: "0 80px 120px", justifyContent: "center" }}>
      <Titulo texto={t.saldoTitulo} />
      <div style={{ marginTop: 60, display: "grid", gap: 26 }}>
        {SALDOS.map(([p, puso, toca], i) => {
          const saldo = puso - toca;
          return (
            <Sube key={p} desde={12 + i * 14} distancia={80}>
              <div style={{ padding: "32px 36px", borderRadius: 30, backgroundColor: C.arena50, border: `2px solid ${C.arena200}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 52, fontWeight: 700 }}>{p}</span>
                  <span style={{ fontSize: 56, fontWeight: 700, color: saldo > 0 ? C.oliva600 : "#b42318" }}>
                    {saldo > 0 ? "+" : "−"}US$ {Math.abs(saldo)}
                  </span>
                </div>
                <div style={{ marginTop: 8, fontSize: 34, color: C.arena600 }}>
                  {t.puso} US$ {puso} · {t.toca} US$ {toca}
                </div>
              </div>
            </Sube>
          );
        })}
      </div>
    </AbsoluteFill>
  </Fondo>
);

const Resultado: React.FC<{ t: (typeof T)["es"] }> = ({ t }) => {
  const sello = useEntrada(60, 140);
  return (
    <Fondo>
      <MarcaDeAgua opacidad={0.04} />
      <AbsoluteFill style={{ padding: "0 80px 120px", justifyContent: "center" }}>
        <Titulo texto={t.resultadoTitulo} />
        <div style={{ marginTop: 70, display: "grid", gap: 30 }}>
          {PAGOS.map(([de, a, monto], i) => (
            <Sube key={i} desde={14 + i * 18} distancia={90}>
              <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "40px 40px", borderRadius: 34, backgroundColor: C.oliva700, color: "#fff", boxShadow: "0 24px 50px rgba(70,74,52,0.25)" }}>
                <span style={{ fontSize: 56, fontWeight: 700 }}>{de}</span>
                <span style={{ fontSize: 56, color: C.oliva300 }}>→</span>
                <span style={{ fontSize: 56, fontWeight: 700 }}>{a}</span>
                <span style={{ marginLeft: "auto", fontSize: 60, fontWeight: 700 }}>US$ {monto}</span>
              </div>
            </Sube>
          ))}
        </div>
        <div style={{ marginTop: 70, textAlign: "center", fontSize: 64, fontWeight: 700, color: C.oliva700, opacity: sello, transform: `scale(${interpolate(sello, [0, 1], [0.7, 1])})` }}>
          ✓ {t.pagos}
        </div>
      </AbsoluteFill>
    </Fondo>
  );
};

export const ShortGastos: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const D = DUR_GASTOS;
  const tiempo = springTiming({ config: { damping: 200 }, durationInFrames: TR });
  const lado = slide({ direction: "from-right" });
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D.gancho}>
          <Gancho cejilla={t.cejilla} titulo={t.titulo} bajada={t.bajada} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.gastos}>
          <Gastos t={t} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={lado} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.saldos}>
          <Saldos t={t} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={lado} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.resultado}>
          <Resultado t={t} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.cierre}>
          <CierreShort frase={t.cierre} url="rumbotraveling.com" firma={t.firma} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        src={staticFile("musica/rumbo.wav")}
        startFrom={0}
        volume={(f) => interpolate(f, [0, 12, TOTAL_GASTOS - 45, TOTAL_GASTOS], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </>
  );
};

// Genera la voz en off de los Shorts de guías con Piper (voces libres, sin conexión):
//   español: es_AR-daniela-high (datos OpenSLR 61, CC BY-SA 4.0) · inglés: en_US-ljspeech-high (dominio público).
// Uso: npx tsx voces/narrar.ts roma-3-dias [otra-guia ...]
// Escribe public/voz/<id>/<n>.wav y la duración de cada escena en src/datos/voz.json.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type Idioma = "es" | "en";
type Texto = Record<Idioma, string>;
interface Guia {
  slug: string;
  dias: number;
  titulo: Texto;
  itinerario: { titulo: Texto; actividades: Texto[] }[];
  precios: { concepto: Texto; monto: Texto }[];
  porDia: { economico: [number, number]; equilibrado: [number, number]; premium: [number, number] };
}

const RAIZ = path.resolve(__dirname, "..");
const VOZ: Record<Idioma, string> = { es: "es_AR-daniela-high.onnx", en: "en_US-ljspeech-high.onnx" };

/** Pasa montos y símbolos a palabras para que la voz los lea bien. */
export function hablar(t: string, idioma: Idioma): string {
  const mon = idioma === "es"
    ? { "US$": "dólares", "€": "euros", "£": "libras", "¥": "yenes", "R$": "reales" }
    : { "US$": "dollars", "€": "euros", "£": "pounds", "¥": "yen", "R$": "reais" };
  let s = t.replace(/≈\s*/g, idioma === "es" ? "unos " : "about ");
  // Rango con moneda delante: "US$ 80–110" -> "de 80 a 110 dólares"
  s = s.replace(/(US\$|R\$|€|£|¥)\s?([\d.,]+)\s?[–-]\s?(?:US\$|R\$|€|£|¥)?\s?([\d.,]+)/g, (_, m, a, b) =>
    idioma === "es" ? `de ${a} a ${b} ${mon[m as keyof typeof mon]}` : `${a} to ${b} ${mon[m as keyof typeof mon]}`);
  s = s.replace(/(US\$|R\$|€|£|¥)\s?([\d.,]+)/g, (_, m, a) => `${a} ${mon[m as keyof typeof mon]}`);
  s = s.replace(/\s*\/\s*/g, idioma === "es" ? " o " : " or ").replace(/\+/g, idioma === "es" ? " más " : " plus ");
  s = s.replace(/[()]/g, ", ").replace(/→/g, idioma === "es" ? " a " : " to ").replace(/\s+,/g, ",").replace(/\s{2,}/g, " ");
  return s.trim();
}

function guion(g: Guia, idioma: Idioma): string[] {
  const es = idioma === "es";
  const textos = [
    es ? `${g.titulo.es}. Itinerario día por día, y cuánto cuesta.` : `${g.titulo.en}. A day-by-day itinerary, and what it costs.`,
    ...g.itinerario.map((d) => `${d.titulo[idioma].replace(":", ".")}. ${d.actividades.slice(0, 3).map((a) => a[idioma].replace(/\.$/, "")).join(". ")}.`),
    (es ? "Cuánto cuesta. " : "What it costs. ") + g.precios.slice(0, 3).map((p) => `${p.concepto[idioma]}: ${p.monto[idioma]}`).join(". ") + ".",
    es
      ? `Por persona y por día, sin el vuelo: económico, US$ ${g.porDia.economico[0]}–${g.porDia.economico[1]}. Equilibrado, US$ ${g.porDia.equilibrado[0]}–${g.porDia.equilibrado[1]}. Premium, US$ ${g.porDia.premium[0]}–${g.porDia.premium[1]}.`
      : `Per person per day, without flights: budget, US$ ${g.porDia.economico[0]}–${g.porDia.economico[1]}. Balanced, US$ ${g.porDia.equilibrado[0]}–${g.porDia.equilibrado[1]}. Premium, US$ ${g.porDia.premium[0]}–${g.porDia.premium[1]}.`,
    es ? "La guía completa, y tu viaje armado, gratis en rumbotraveling punto com." : "Get the full guide, and your trip planned, for free at rumbotraveling dot com.",
  ];
  return textos.map((t) => hablar(t, idioma));
}

const guias = JSON.parse(readFileSync(path.join(RAIZ, "src/datos/guias.json"), "utf8")) as Guia[];
const archivoVoz = path.join(RAIZ, "src/datos/voz.json");
const voz: Record<string, { textos: string[]; segundos: number[] }> = existsSync(archivoVoz) ? JSON.parse(readFileSync(archivoVoz, "utf8")) : {};

for (const slug of process.argv.slice(2)) {
  const g = guias.find((x) => x.slug === slug);
  if (!g) throw new Error(`No existe la guía ${slug}`);
  for (const idioma of ["es", "en"] as Idioma[]) {
    const id = `Guia-${slug}-${idioma}`;
    const dir = path.join(RAIZ, "public/voz", id);
    mkdirSync(dir, { recursive: true });
    const textos = guion(g, idioma);
    const segundos = textos.map((texto, i) => {
      const wav = path.join(dir, `${i}.wav`);
      execFileSync("python3", ["-m", "piper", "-m", path.join(RAIZ, "voces", VOZ[idioma]), "-f", wav, "--length-scale", idioma === "es" ? "0.95" : "0.92"], { input: texto });
      return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).toString().trim());
    });
    voz[id] = { textos, segundos };
    console.log(id, segundos.map((s) => s.toFixed(1)).join(" + "), "=", segundos.reduce((a, b) => a + b, 0).toFixed(1), "s");
  }
}
writeFileSync(archivoVoz, JSON.stringify(voz, null, 1));

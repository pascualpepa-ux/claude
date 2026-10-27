/**
 * Calculadora del guía: resuelve cuentas escritas con números o con palabras
 * ("2+2", "cuánto es 15 por 3", "10 dividido 4", "what is 7 times 8", "(3+2)^2", "20% de 150").
 * Es un analizador propio (nunca se ejecuta código), así que es seguro.
 */

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2") // 1.500 -> 1500 (separador de miles en español)
    .replace(/(\d),(\d)/g, "$1.$2") // 2,5 -> 2.5 (decimal en español)
    .replace(/\b(\d+(?:\.\d+)?)\s*(?:%|por ?ciento|percent)\s*(?:de|of)\s*/g, "$1/100*") // 20% de 150
    .replace(/\b(elevado a la|elevado a|a la|to the power of|to the)\b/g, "^")
    .replace(/\b(al cuadrado|squared)\b/g, "^2")
    .replace(/\b(al cubo|cubed)\b/g, "^3")
    .replace(/\b(mas|plus|y sumale|sumado a)\b/g, "+")
    .replace(/\b(menos|minus)\b/g, "-")
    .replace(/\b(multiplicado por|por|times|multiplied by)\b/g, "*")
    .replace(/\b(dividido por|dividido en|dividido|divided by|sobre|over)\b/g, "/")
    .replace(/[x×]/g, "*")
    .replace(/÷/g, "/")
    .replace(/\*\*/g, "^");
}

/** Saca la cuenta de una pregunta. Devuelve null si no hay una cuenta clara. */
export function extraerCuenta(pregunta: string): string | null {
  const t = normalizar(pregunta)
    .replace(/\b(cuanto es|cuanto da|cuanto son|calcula|calculame|resolve|resolveme|what is|what's|whats|how much is|calculate)\b/g, " ")
    .replace(/[?¿!¡=]/g, " ")
    .trim();
  // Solo números, operadores, paréntesis y espacios; con al menos un operador entre números.
  if (!/^[\d\s+\-*/^().]+$/.test(t)) return null;
  if (!/\d\s*[+\-*/^]\s*[\d(]|\)\s*[+\-*/^]/.test(t)) return null;
  return t.replace(/\s+/g, "");
}

/** Analizador recursivo: suma/resta < producto/división < potencia < signo < número o paréntesis. */
export function calcular(expresion: string): number | null {
  let i = 0;
  const s = expresion;
  const ver = () => s[i];
  function numero(): number {
    if (ver() === "(") {
      i++;
      const v = suma();
      if (ver() !== ")") throw new Error("paréntesis");
      i++;
      return v;
    }
    const m = /^\d+(?:\.\d+)?|^\.\d+/.exec(s.slice(i));
    if (!m) throw new Error("número");
    i += m[0].length;
    return Number(m[0]);
  }
  function signo(): number {
    if (ver() === "-") {
      i++;
      return -signo();
    }
    if (ver() === "+") {
      i++;
      return signo();
    }
    return numero();
  }
  function potencia(): number {
    const base = signo();
    if (ver() === "^") {
      i++;
      return base ** potencia(); // asociativa a la derecha
    }
    return base;
  }
  function producto(): number {
    let v = potencia();
    while (ver() === "*" || ver() === "/") {
      const op = s[i++];
      const d = potencia();
      if (op === "/" && d === 0) throw new Error("división por cero");
      v = op === "*" ? v * d : v / d;
    }
    return v;
  }
  function suma(): number {
    let v = producto();
    while (ver() === "+" || ver() === "-") {
      const op = s[i++];
      const d = producto();
      v = op === "+" ? v + d : v - d;
    }
    return v;
  }
  try {
    const v = suma();
    return i === s.length && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** Respuesta lista para el chat, o null si la pregunta no es una cuenta. */
export function responderCuenta(pregunta: string, idioma: "es" | "en"): string | null {
  const cuenta = extraerCuenta(pregunta);
  if (!cuenta) return null;
  const v = calcular(cuenta);
  if (v === null) return null;
  const redondo = Math.round(v * 1e10) / 1e10;
  const numero = redondo.toLocaleString(idioma === "es" ? "es-AR" : "en-US", { maximumFractionDigits: 10 });
  const mostrada = cuenta.replace(/\*/g, " × ").replace(/\//g, " ÷ ").replace(/\+/g, " + ").replace(/(?<=\d|\))-/g, " − ").replace(/\^/g, "^");
  return idioma === "es" ? `${mostrada} = ${numero}` : `${mostrada} = ${numero}`;
}

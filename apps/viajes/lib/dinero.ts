import type { Idioma } from "./idioma";

const formatos = {
  es: new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "code", maximumFractionDigits: 0 }),
};

/** Formatea montos en dólares: "US$ 1.234" en español, "US$ 1,234" en inglés. */
export function usd(monto: number, idioma: Idioma = "es"): string {
  const texto = formatos[idioma].format(Math.round(monto)).replace(/ /g, " ");
  return idioma === "en" ? texto.replace(/^USD\s?/, "US$ ") : texto;
}

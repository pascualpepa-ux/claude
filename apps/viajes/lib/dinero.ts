const fmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "symbol",
  maximumFractionDigits: 0,
});

/** Formatea montos en dólares: "US$ 1.234". */
export function usd(monto: number): string {
  return fmt.format(Math.round(monto)).replace(/ /g, " ");
}

// Gastos compartidos del viaje: cada uno anota lo que pagó y entre quiénes se divide,
// y la web calcula quién le debe a quién con la menor cantidad de transferencias posible.

export interface GastoCompartido {
  id: string;
  descripcion: string;
  monto: number; // US$
  pagadoPor: string;
  entre: string[]; // entre quiénes se divide en partes iguales
}

export interface Saldo {
  persona: string;
  pago: number; // lo que puso
  leToca: number; // su parte de los gastos
  saldo: number; // positivo: le deben; negativo: debe
}

export interface Transferencia {
  de: string;
  a: string;
  monto: number;
}

const centavos = (n: number) => Math.round(n * 100);

/**
 * Cuánto puso cada uno, cuánto le toca y su saldo. Las partes se suman exactas y se redondean una sola vez
 * al final (a centavos), repartiendo los centavos que sobran para que lo que toca sume justo lo que se pagó.
 */
export function saldos(gastos: GastoCompartido[], viajeros: string[]): Saldo[] {
  const pago = new Map(viajeros.map((v) => [v, 0]));
  const toca = new Map(viajeros.map((v) => [v, 0])); // en centavos, con decimales
  for (const g of gastos) {
    const entre = g.entre.filter((p) => toca.has(p));
    if (!entre.length || !pago.has(g.pagadoPor) || !(g.monto > 0)) continue;
    const total = centavos(g.monto);
    pago.set(g.pagadoPor, pago.get(g.pagadoPor)! + total);
    for (const p of entre) toca.set(p, toca.get(p)! + total / entre.length);
  }
  const totalPagado = [...pago.values()].reduce((a, b) => a + b, 0);
  const exactos = viajeros.map((v) => toca.get(v)!);
  const redondeados = exactos.map((x) => Math.floor(x + 1e-9));
  let sobran = totalPagado - redondeados.reduce((a, b) => a + b, 0);
  // Los centavos que sobran van a quienes perdieron más al redondear (y, a igual pérdida, a los primeros de la lista).
  const orden = exactos.map((x, i) => ({ i, resto: x - redondeados[i] })).sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (const { i } of orden) {
    if (sobran <= 0) break;
    redondeados[i]++;
    sobran--;
  }
  return viajeros.map((persona, i) => {
    const p = pago.get(persona)!;
    return { persona, pago: p / 100, leToca: redondeados[i] / 100, saldo: (p - redondeados[i]) / 100 };
  });
}

/** Quién le paga a quién: une al que más debe con al que más le deben, hasta saldar todo. */
export function quienDebeAQuien(lista: Saldo[]): Transferencia[] {
  const deudores = lista.filter((s) => s.saldo < 0).map((s) => ({ p: s.persona, c: -centavos(s.saldo) }));
  const acreedores = lista.filter((s) => s.saldo > 0).map((s) => ({ p: s.persona, c: centavos(s.saldo) }));
  const salida: Transferencia[] = [];
  while (deudores.length && acreedores.length) {
    deudores.sort((a, b) => b.c - a.c);
    acreedores.sort((a, b) => b.c - a.c);
    const d = deudores[0];
    const a = acreedores[0];
    const monto = Math.min(d.c, a.c);
    salida.push({ de: d.p, a: a.p, monto: monto / 100 });
    d.c -= monto;
    a.c -= monto;
    if (!d.c) deudores.shift();
    if (!a.c) acreedores.shift();
  }
  return salida;
}

/** Gastos de muestra para el viaje de ejemplo. */
export function gastosDeMuestra(viajeros: string[], idioma: "es" | "en"): GastoCompartido[] {
  const [a, b, c] = viajeros;
  if (!a || !b || !c) return [];
  const t =
    idioma === "es"
      ? ["Hotel en Pekín (3 noches)", "Cena de pato laqueado", "Entradas a la Gran Muralla", "Taxi al aeropuerto"]
      : ["Hotel in Beijing (3 nights)", "Peking duck dinner", "Great Wall tickets", "Taxi to the airport"];
  return [
    { id: "m1", descripcion: t[0], monto: 540, pagadoPor: a, entre: [a, b, c] },
    { id: "m2", descripcion: t[1], monto: 96, pagadoPor: b, entre: [a, b, c] },
    { id: "m3", descripcion: t[2], monto: 75, pagadoPor: c, entre: [a, b, c] },
    { id: "m4", descripcion: t[3], monto: 30, pagadoPor: b, entre: [b, c] },
  ];
}

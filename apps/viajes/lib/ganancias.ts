import { sql } from "./db";
import { sumarDias, hoy } from "./fechas";

// Ganancias para el admin: lo que nos queda (precio cobrado − costo de la aerolínea o del hotel), no lo que se cobra.
// Las reservas canceladas no cuentan. Las de prueba se muestran aparte, para no confundirlas con plata real.

export interface Ganancias {
  ventas: number;
  cobrado: number;
  ganado: number;
  moneda: string;
  porDia: { dia: string; ganado: number }[]; // últimos 30 días
  ultimas: { codigo: string; tipo: string; ruta: string; precio: number; ganado: number; creado: string }[];
}

export async function ganancias(prueba: boolean): Promise<Ganancias> {
  const desde = sumarDias(hoy(), -29);
  const [tot] = await sql<{ ventas: number; cobrado: string | null; ganado: string | null; moneda: string | null }>(
    `select count(*)::int as ventas, sum(precio) as cobrado, sum(precio - costo) as ganado, max(moneda) as moneda
     from reservas where estado = 'emitida' and cancelada is null and prueba = $1`,
    [prueba],
  );
  const dias = await sql<{ dia: string; ganado: string }>(
    `select to_char(creado at time zone 'Europe/Madrid', 'YYYY-MM-DD') as dia, sum(precio - costo) as ganado
     from reservas where estado = 'emitida' and cancelada is null and prueba = $1 and creado >= $2::date
     group by 1`,
    [prueba, desde],
  );
  const porDia = new Map(dias.map((d) => [d.dia, Number(d.ganado)]));
  const ultimas = await sql<{ codigo: string; tipo: string; ruta: string; precio: string; ganado: string; creado: string }>(
    `select codigo, tipo, ruta, precio, (precio - costo) as ganado, creado from reservas
     where estado = 'emitida' and cancelada is null and prueba = $1 order by creado desc limit 10`,
    [prueba],
  );
  return {
    ventas: tot.ventas,
    cobrado: Number(tot.cobrado ?? 0),
    ganado: Number(tot.ganado ?? 0),
    moneda: tot.moneda ?? "EUR",
    porDia: Array.from({ length: 30 }, (_, i) => {
      const dia = sumarDias(desde, i);
      return { dia, ganado: Math.round((porDia.get(dia) ?? 0) * 100) / 100 };
    }),
    ultimas: ultimas.map((u) => ({ ...u, precio: Number(u.precio), ganado: Number(u.ganado) })),
  };
}

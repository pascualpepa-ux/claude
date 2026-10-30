import { sql } from "./db";
import type { TripPlan } from "./types";

// Viajes guardados de verdad (Rumbo Premium): a diferencia de los que quedan solo en este navegador
// (ver lib/almacen.ts), estos se guardan en la base y se ven desde cualquier dispositivo.

export interface ViajeGuardadoDb {
  id: string;
  nombre: string;
  guardadoEl: string; // ISO
  plan: TripPlan;
  borrador?: unknown;
}

const MAX_POR_USUARIO = 20;

interface Fila {
  id: string;
  nombre: string;
  creado: Date;
  datos: { plan: TripPlan; borrador?: unknown };
}

const aViaje = (f: Fila): ViajeGuardadoDb => ({ id: f.id, nombre: f.nombre, guardadoEl: new Date(f.creado).toISOString(), plan: f.datos.plan, borrador: f.datos.borrador });

export async function listarViajesGuardados(usuarioId: string): Promise<ViajeGuardadoDb[]> {
  const filas = await sql<Fila>("select id, nombre, creado, datos from viajes_guardados where usuario_id = $1 order by creado desc", [usuarioId]);
  return filas.map(aViaje);
}

/** Guarda un viaje nuevo (o actualiza uno ya guardado por este usuario, si pasás `id`). */
export async function guardarViajeGuardadoDb(usuarioId: string, nombre: string, plan: TripPlan, borrador: unknown, id?: string): Promise<ViajeGuardadoDb> {
  const datos = JSON.stringify({ plan, borrador });
  if (id) {
    const [fila] = await sql<Fila>(
      "update viajes_guardados set nombre = $1, datos = $2::jsonb where id = $3 and usuario_id = $4 returning id, nombre, creado, datos",
      [nombre.slice(0, 200), datos, id, usuarioId],
    );
    if (fila) return aViaje(fila);
  }
  // Si ya tiene el máximo, se borra el más viejo antes de agregar uno nuevo.
  const total = await sql<{ n: string }>("select count(*)::text as n from viajes_guardados where usuario_id = $1", [usuarioId]);
  if (Number(total[0]?.n ?? 0) >= MAX_POR_USUARIO) {
    await sql(
      "delete from viajes_guardados where id = (select id from viajes_guardados where usuario_id = $1 order by creado asc limit 1)",
      [usuarioId],
    );
  }
  const [fila] = await sql<Fila>(
    "insert into viajes_guardados (usuario_id, nombre, datos) values ($1, $2, $3::jsonb) returning id, nombre, creado, datos",
    [usuarioId, nombre.slice(0, 200), datos],
  );
  return aViaje(fila);
}

export async function borrarViajeGuardadoDb(usuarioId: string, id: string): Promise<void> {
  await sql("delete from viajes_guardados where id = $1 and usuario_id = $2", [id, usuarioId]);
}

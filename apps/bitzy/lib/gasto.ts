import "server-only";
import { almacen } from "./almacen";

/**
 * Control del gasto mensual en la API de IA. El límite se configura con
 * LIMITE_GASTO_IA_USD (por defecto US$ 25 por mes) y se comparte entre el Creador y el juego diario.
 */
const PRECIO_ENTRADA = 4 / 1_000_000; // Claude Opus 5.5, US$ por token
const PRECIO_SALIDA = 20 / 1_000_000;

export const limiteMensual = () => Number(process.env.LIMITE_GASTO_IA_USD || 25);
const mes = () => new Date().toISOString().slice(0, 7);

interface Gasto { usd: number; llamadas: number }

export async function gastoDelMes(): Promise<Gasto> {
  const d = await almacen().obtener<Gasto>("gasto_ia", mes());
  return d?.datos ?? { usd: 0, llamadas: 0 };
}

export async function hayPresupuesto(reserva = 0.3): Promise<boolean> {
  const g = await gastoDelMes();
  return g.usd + reserva <= limiteMensual();
}

export async function registrarGasto(uso: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }) {
  const usd =
    uso.input_tokens * PRECIO_ENTRADA +
    (uso.cache_creation_input_tokens ?? 0) * PRECIO_ENTRADA * 1.25 +
    (uso.cache_read_input_tokens ?? 0) * PRECIO_ENTRADA * 0.1 +
    uso.output_tokens * PRECIO_SALIDA;
  const g = await gastoDelMes();
  await almacen().guardar("gasto_ia", mes(), { usd: Math.round((g.usd + usd) * 10000) / 10000, llamadas: g.llamadas + 1 });
  return usd;
}

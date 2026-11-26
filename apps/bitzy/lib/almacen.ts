import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Almacén de documentos. Con DATABASE_URL usa Postgres (tabla `documentos` con JSONB);
 * sin base de datos guarda en un archivo local (sirve para desarrollo y demos).
 */
export interface Documento<T> { id: string; datos: T; creado: string }

interface Backend {
  guardar<T>(col: string, id: string, datos: T): Promise<void>;
  obtener<T>(col: string, id: string): Promise<Documento<T> | null>;
  listar<T>(col: string, limite?: number): Promise<Documento<T>[]>;
  borrar(col: string, id: string): Promise<void>;
}

function backendPostgres(url: string): Backend {
  let pool: import("pg").Pool | null = null;
  let listo: Promise<void> | null = null;
  const conectar = async () => {
    if (!pool) {
      const { Pool } = await import("pg");
      pool = new Pool({ connectionString: url, max: 5, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
      listo = pool.query(`CREATE TABLE IF NOT EXISTS documentos (
        col TEXT NOT NULL, id TEXT NOT NULL, datos JSONB NOT NULL, creado TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (col, id));
        CREATE INDEX IF NOT EXISTS documentos_col_creado ON documentos (col, creado DESC);`).then(() => undefined);
    }
    await listo;
    return pool!;
  };
  return {
    async guardar(col, id, datos) {
      const p = await conectar();
      await p.query("INSERT INTO documentos (col, id, datos) VALUES ($1,$2,$3) ON CONFLICT (col, id) DO UPDATE SET datos = EXCLUDED.datos", [col, id, JSON.stringify(datos)]);
    },
    async obtener(col, id) {
      const p = await conectar();
      const r = await p.query("SELECT id, datos, creado FROM documentos WHERE col=$1 AND id=$2", [col, id]);
      return r.rows[0] ? { id: r.rows[0].id, datos: r.rows[0].datos, creado: new Date(r.rows[0].creado).toISOString() } : null;
    },
    async listar(col, limite = 100) {
      const p = await conectar();
      const r = await p.query("SELECT id, datos, creado FROM documentos WHERE col=$1 ORDER BY creado DESC LIMIT $2", [col, limite]);
      return r.rows.map((x) => ({ id: x.id, datos: x.datos, creado: new Date(x.creado).toISOString() }));
    },
    async borrar(col, id) {
      const p = await conectar();
      await p.query("DELETE FROM documentos WHERE col=$1 AND id=$2", [col, id]);
    },
  };
}

function backendArchivo(): Backend {
  const dir = process.env.VERCEL ? "/tmp/bitzy" : path.join(process.cwd(), ".data");
  const archivo = path.join(dir, "almacen.json");
  type Datos = Record<string, Record<string, { datos: unknown; creado: string }>>;
  let cache: Datos | null = null;
  let cola = Promise.resolve();
  const cargar = async (): Promise<Datos> => {
    if (cache) return cache;
    try { cache = JSON.parse(await fs.readFile(archivo, "utf8")) as Datos; } catch { cache = {}; }
    return cache;
  };
  const persistir = () => {
    cola = cola.then(async () => {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(archivo, JSON.stringify(cache));
    }).catch(() => undefined);
    return cola;
  };
  return {
    async guardar(col, id, datos) {
      const d = await cargar();
      d[col] ??= {};
      d[col][id] = { datos, creado: d[col][id]?.creado ?? new Date().toISOString() };
      await persistir();
    },
    async obtener<T>(col: string, id: string) {
      const d = await cargar();
      const x = d[col]?.[id];
      return x ? { id, datos: x.datos as T, creado: x.creado } : null;
    },
    async listar<T>(col: string, limite = 100) {
      const d = await cargar();
      return Object.entries(d[col] ?? {})
        .map(([id, x]) => ({ id, datos: x.datos as T, creado: x.creado }))
        .sort((a, b) => b.creado.localeCompare(a.creado))
        .slice(0, limite);
    },
    async borrar(col, id) {
      const d = await cargar();
      if (d[col]) delete d[col][id];
      await persistir();
    },
  };
}

let backend: Backend | null = null;
export function almacen(): Backend {
  backend ??= process.env.DATABASE_URL ? backendPostgres(process.env.DATABASE_URL) : backendArchivo();
  return backend;
}

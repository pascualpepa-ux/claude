import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Crown } from "@phosphor-icons/react/dist/ssr";
import { FormularioCuenta } from "@/components/FormularioCuenta";
import { BotonSalirCuenta } from "@/components/BotonSalirCuenta";
import { COOKIE_USUARIO, cuentasConfiguradas, esPremium, usuarioIdDeCookie, usuarioPorId } from "@/lib/cuentas";
import { dbConfigurada } from "@/lib/db";
import { textosActuales } from "@/lib/idioma-servidor";
import { metadatosPagina } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { idioma, t } = await textosActuales();
  return metadatosPagina({ ruta: "/premium", idioma, titulo: t.premium.metaTitulo, descripcion: t.premium.metaDescripcion, tituloAbsoluto: true });
}
export const dynamic = "force-dynamic";

export default async function Premium() {
  const { t } = await textosActuales();
  const P = t.premium;

  const activo = dbConfigurada() && cuentasConfiguradas();
  const usuario = activo ? await usuarioPorId(usuarioIdDeCookie((await cookies()).get(COOKIE_USUARIO)?.value) ?? "").catch(() => null) : null;

  return (
    <main className="mx-auto max-w-xl px-4 pt-10 pb-20 md:pt-16">
      <Crown size={36} weight="duotone" className="text-amber-500" aria-hidden />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{P.titulo}</h1>
      <p className="mt-3 text-arena-600 dark:text-arena-400">{P.bajada}</p>

      <div className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-50 p-6 dark:border-amber-400/30 dark:bg-amber-950/30">
        <p className="text-2xl font-bold">{P.precio}</p>
        <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">{P.precioNota}</p>
        <ul className="mt-4 grid gap-2 text-sm">
          {P.beneficios.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5 text-amber-500">
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {!activo ? (
        <p className="mt-8 text-arena-600 dark:text-arena-400">{P.errorSinConfigurar}</p>
      ) : !usuario ? (
        <FormularioCuenta />
      ) : (
        <div className="mt-8 grid gap-4">
          <p className="text-lg font-medium">{P.hola(usuario.email)}</p>
          {esPremium(usuario) ? (
            <p className="rounded-xl bg-oliva-100/60 px-4 py-3 text-oliva-800 dark:bg-oliva-900/40 dark:text-oliva-100">{P.yaEresPremium}</p>
          ) : (
            <div className="grid gap-2">
              <button
                type="button"
                disabled
                title={P.proximamente}
                className="rounded-xl bg-amber-500 px-5 py-3 font-medium text-arena-950 opacity-60"
              >
                {P.suscribirme}
              </button>
              <p className="text-sm text-arena-600 dark:text-arena-400">{P.proximamente}</p>
            </div>
          )}
          <div>
            <BotonSalirCuenta />
          </div>
        </div>
      )}
    </main>
  );
}

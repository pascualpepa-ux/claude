import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_PAUSA } from "@/lib/groserias";
import { textosActuales } from "@/lib/idioma-servidor";
import { CuentaRegresiva } from "./CuentaRegresiva";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await textosActuales();
  return { title: t.meta.pausa, robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

export default async function Pausa() {
  const hasta = Number((await cookies()).get(COOKIE_PAUSA)?.value);
  // Los segundos se calculan acá, con el reloj del servidor, para que no dependan de la hora del dispositivo.
  const segundos = Math.ceil((hasta - Date.now()) / 1000);
  if (!(segundos > 0)) redirect("/");
  return <CuentaRegresiva segundos={segundos} />;
}

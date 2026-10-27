import type { Metadata } from "next";
import { Confirmar } from "./Confirmar";

export const metadata: Metadata = { title: "Rumbo Traveling", robots: { index: false, follow: false } };

export default async function Pagina({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return <Confirmar token={t ?? ""} />;
}

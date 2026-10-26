import type { Metadata } from "next";
import { Asistente } from "./Asistente";

export const metadata: Metadata = { title: "Planificar viaje · Rumbo Traveling" };

export default function Planificar() {
  return <Asistente />;
}

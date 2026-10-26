import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaViaje } from "./VistaViaje";

export const metadata: Metadata = { title: "Tu viaje · Rumbo Traveling" };

export default function Viaje() {
  return (
    <Suspense>
      <VistaViaje />
    </Suspense>
  );
}

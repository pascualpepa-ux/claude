import { createElement as h } from "react";
import { Encabezado } from "@/components/Encabezado";
import { Pie } from "@/components/Pie";
import Inicio from "@/app/page";
import { Asistente } from "@/app/planificar/Asistente";
import { VistaViaje } from "@/app/viaje/VistaViaje";
import { useRuta } from "./shims/router";

function App() {
  const { path, query } = useRuta();
  const pagina = path === "/planificar" ? <Asistente /> : path === "/viaje" ? <VistaViaje /> : <Inicio />;
  return (
    <div className="flex min-h-[100dvh] flex-col font-sans">
      <Encabezado />
      <div className="flex-1" key={`${path}?${query}`}>
        {pagina}
      </div>
      <Pie />
    </div>
  );
}

const ReactDOM = (window as unknown as { ReactDOM: { createRoot(el: Element): { render(n: unknown): void } } }).ReactDOM;
ReactDOM.createRoot(document.getElementById("raiz")!).render(h(App));

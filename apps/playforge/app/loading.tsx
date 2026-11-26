import { LogoMarca } from "@/components/Logo";

export default function Cargando() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Cargando">
      <div className="flex flex-col items-center gap-4">
        <LogoMarca className="h-14 w-14 animate-flotar drop-shadow-[0_0_24px_rgba(124,92,255,.55)]" />
        <div className="h-1 w-40 overflow-hidden rounded-full bg-capa-3"><div className="esqueleto h-full w-full" /></div>
      </div>
    </div>
  );
}

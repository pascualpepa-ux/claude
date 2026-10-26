import Image from "next/image";
import marcaOliva from "@/public/marca/marca-oliva.png";
import marcaCrema from "@/public/marca/marca-crema.png";
import completoOliva from "@/public/marca/logo-completo-oliva.png";
import completoCrema from "@/public/marca/logo-completo-crema.png";

/** Isotipo (R con avión) en verde; en modo oscuro se usa la versión crema. */
export function Marca({ alto = 36, prioridad = false }: { alto?: number; prioridad?: boolean }) {
  const ancho = Math.round((alto * marcaOliva.width) / marcaOliva.height);
  return (
    <span className="inline-flex shrink-0" style={{ width: ancho, height: alto }}>
      <Image src={marcaOliva} alt="" width={ancho} height={alto} priority={prioridad} className="dark:hidden" />
      <Image src={marcaCrema} alt="" width={ancho} height={alto} priority={prioridad} className="hidden dark:block" />
    </span>
  );
}

/** Logo completo con el nombre, para el pie. */
export function LogoCompleto({ ancho = 140 }: { ancho?: number }) {
  const alto = Math.round((ancho * completoOliva.height) / completoOliva.width);
  return (
    <span className="inline-flex" style={{ width: ancho, height: alto }}>
      <Image src={completoOliva} alt="Rumbo Traveling" width={ancho} height={alto} className="dark:hidden" />
      <Image src={completoCrema} alt="Rumbo Traveling" width={ancho} height={alto} className="hidden dark:block" />
    </span>
  );
}

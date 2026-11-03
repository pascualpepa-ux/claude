import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

/** Marco común de las pantallas de acceso: tarjeta centrada sobre fondo suave. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-subtle">
      <div className="flex justify-end p-3">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="flex w-full max-w-[380px] flex-col gap-5">
          <div className="self-center">
            <Logo />
          </div>
          {children}
        </div>
      </main>
      <p className="pb-6 text-center text-[12px] text-fg-subtle">Un proyecto de Pascual Pepa</p>
    </div>
  );
}

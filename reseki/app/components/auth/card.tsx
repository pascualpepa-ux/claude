/** Tarjeta de los formularios de acceso. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-7 shadow-card">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13px] text-fg-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-fg-subtle before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
      {children}
    </div>
  );
}

import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "error" | "success" | "info";

const styles: Record<Tone, string> = {
  error: "border-danger/30 bg-danger-soft text-danger",
  success: "border-success/30 bg-success-soft text-success",
  info: "border-dashed border-border-strong text-fg-muted",
};
const icons = { error: AlertCircle, success: CheckCircle2, info: Info };

/** Mensaje en línea para errores, confirmaciones o avisos. */
export function Alert({ tone = "info", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  const Icon = icons[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-md border px-3.5 py-3 text-[13px] leading-snug", styles[tone], className)}>
      <Icon className="mt-px size-4 shrink-0" strokeWidth={1.75} />
      <div>{children}</div>
    </div>
  );
}

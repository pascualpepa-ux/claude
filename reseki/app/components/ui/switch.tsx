import { cn } from "@/lib/utils";

/**
 * Interruptor accesible basado en un checkbox real, así funciona dentro de formularios
 * de servidor sin JavaScript (envía "on" cuando está activado).
 */
export function Switch({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      role="switch"
      className={cn(
        "relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-border-strong transition-colors checked:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
        "after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform checked:after:translate-x-4",
        className,
      )}
      {...props}
    />
  );
}

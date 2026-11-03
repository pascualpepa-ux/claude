import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-sm border border-border bg-surface px-3 text-sm text-fg transition-[border-color,box-shadow] placeholder:text-fg-subtle focus:border-accent focus:shadow-[0_0_0_3px_var(--ring)] focus:outline-none aria-[invalid=true]:border-danger",
        className,
      )}
      {...props}
    />
  );
}

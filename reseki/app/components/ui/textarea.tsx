import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[84px] w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 text-sm leading-relaxed text-fg transition-[border-color,box-shadow] placeholder:text-fg-subtle focus:border-accent focus:shadow-[0_0_0_3px_var(--ring)] focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

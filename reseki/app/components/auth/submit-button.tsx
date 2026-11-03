"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Botón de envío que se desactiva y muestra un spinner mientras el formulario se procesa. */
export function SubmitButton({ children, pendingText, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" strokeWidth={1.75} />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

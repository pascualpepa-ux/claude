import { signInWithGoogle } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { GoogleIcon } from "@/components/google-icon";

/** Inicia el flujo OAuth de Google a través de Supabase. */
export function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next ?? ""} />
      <SubmitButton variant="secondary" className="w-full" pendingText="Abriendo Google…">
        <GoogleIcon />
        Continuar con Google
      </SubmitButton>
    </form>
  );
}

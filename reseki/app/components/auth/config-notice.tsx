import { Alert } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/env";

/** Aviso visible solo mientras faltan las claves de Supabase (útil al probar el despliegue). */
export function ConfigNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <Alert tone="info">
      Falta conectar la base de datos (Supabase). Las pantallas se ven, pero todavía no se puede crear una cuenta.
    </Alert>
  );
}

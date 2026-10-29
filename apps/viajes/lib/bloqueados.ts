// Emails bloqueados por el dueño (variable de entorno EMAILS_BLOQUEADOS, separados por comas).
// No pueden suscribirse, participar del concurso ni escribir por el formulario de contacto.

export const emailsBloqueados = () =>
  (process.env.EMAILS_BLOQUEADOS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const emailBloqueado = (email: string) => emailsBloqueados().includes(email.trim().toLowerCase());

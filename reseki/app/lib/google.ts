import "server-only";
import { isDemoMode } from "@/lib/env";
import type { Restaurant } from "@/lib/types";

/**
 * Publicación de respuestas en Google Business Profile.
 * En modo demo no se publica nada (solo se marca como publicada en Reseki).
 * La conexión real (OAuth + API de Google) se implementa en la fase 8.
 */
export async function publishReplyToGoogle(
  restaurant: Pick<Restaurant, "google_location_name">,
  googleReviewId: string,
  text: string,
): Promise<void> {
  if (isDemoMode || googleReviewId.startsWith("demo-")) return;
  void restaurant;
  void text;
  throw new Error("La publicación real en Google llega en la fase 8.");
}

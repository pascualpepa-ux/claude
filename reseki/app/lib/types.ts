/** Tipos de la base de datos (reflejan supabase/migrations/0001_init.sql). */

export type ReplyTone = "cercano" | "formal" | "divertido";
export type ReplyStatus = "pendiente" | "publicada" | "rechazada" | "error";

export interface Restaurant {
  id: string;
  owner_id: string;
  owner_name: string;
  name: string;
  business_type: string;
  tone: ReplyTone;
  use_tu: boolean;
  signature: string;
  extra_instructions: string;
  auto_publish_positive: boolean;
  weekly_summary_email: boolean;
  negative_alert_email: boolean;
  google_location_name: string | null;
  google_location_title: string | null;
  google_location_address: string | null;
  google_connected_at: string | null;
  last_synced_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

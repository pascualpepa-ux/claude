import { Inbox, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoPublishToggle, AutoRefresh, SyncButton } from "@/components/panel/controls";
import { ReviewCard, type ReviewItem } from "@/components/panel/review-card";
import { decimal, hoursLabel, timeAgo } from "@/lib/format";
import { languageName } from "@/lib/languages";
import { requireRestaurant } from "@/lib/session";
import type { ReplyStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reseñas" };

type Search = { vista?: string; estrellas?: string; periodo?: string };

interface Row {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  language: string | null;
  reviewed_at: string;
  replies: {
    id: string; status: ReplyStatus; suggested_text: string; final_text: string | null;
    published_automatically: boolean; edited_by_owner: boolean; published_at: string | null; error_message: string | null;
  } | null;
}

const DAY = 24 * 3600e3;

/** Panel de reseñas: resumen, respuesta automática, filtros y lista. */
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { supabase, restaurant } = await requireRestaurant();

  // RLS: solo devuelve las reseñas de este restaurante.
  const { data, error } = await supabase
    .from("reviews")
    .select("id, author_name, rating, comment, language, reviewed_at, replies(id, status, suggested_text, final_text, published_automatically, edited_by_owner, published_at, error_message)")
    .order("reviewed_at", { ascending: false })
    .limit(500)
    .returns<Row[]>();
  if (error) throw new Error("No hemos podido cargar las reseñas.");

  const rows = data ?? [];
  const now = Date.now();
  const isPublished = (r: Row) => r.replies?.status === "publicada";

  /* ── Resumen ── */
  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
  const pendingCount = rows.filter((r) => !isPublished(r)).length;
  const published30 = rows.filter((r) => r.replies?.published_at && now - Date.parse(r.replies.published_at) <= 30 * DAY);
  const avgResponseH = published30.length
    ? published30.reduce((s, r) => s + Math.max(0, Date.parse(r.replies!.published_at!) - Date.parse(r.reviewed_at)), 0) / published30.length / 3600e3
    : null;

  /* ── Filtros ── */
  const view = params.vista === "respondidas" ? "respondidas" : "pendientes";
  const stars = Number(params.estrellas) || 0;
  const period = params.periodo === "7" || params.periodo === "30" ? Number(params.periodo) : 0;

  const filtered = rows
    .filter((r) => (view === "respondidas" ? isPublished(r) : !isPublished(r)))
    .filter((r) => !stars || r.rating === stars)
    .filter((r) => !period || now - Date.parse(r.reviewed_at) <= period * DAY);

  const generating = rows.some((r) => !r.replies);
  const href = (patch: Partial<Search>) => {
    const q = new URLSearchParams();
    const merged = { vista: params.vista, estrellas: params.estrellas, periodo: params.periodo, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return s ? `/panel?${s}` : "/panel";
  };

  const items: ReviewItem[] = filtered.map((r) => ({
    id: r.id,
    author: r.author_name,
    rating: r.rating,
    comment: r.comment,
    language: languageName(r.language),
    ago: timeAgo(r.reviewed_at, now),
    reply: r.replies && {
      id: r.replies.id,
      status: r.replies.status,
      suggested: r.replies.suggested_text,
      final: r.replies.final_text,
      automatic: r.replies.published_automatically,
      edited: r.replies.edited_by_owner,
      publishedAgo: r.replies.published_at ? timeAgo(r.replies.published_at, now) : null,
      error: r.replies.error_message,
    },
  }));

  const filtersActive = Boolean(stars || period);

  return (
    <>
      <AutoRefresh active={generating} />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6 pt-8">
        <div>
          <h1 className="text-[22px] font-semibold">Reseñas</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-fg-muted">
            <span className="size-1.5 rounded-full bg-success" />
            {restaurant.last_synced_at ? `Sincronizado ${timeAgo(restaurant.last_synced_at, now)}` : "Sincronizando…"}
          </p>
        </div>
        <SyncButton />
      </div>

      {/* Resumen */}
      <dl className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface sm:grid-cols-4">
        {[
          { k: "Puntuación media", v: rows.length ? decimal(avg) : "—" },
          { k: "Pendientes", v: String(pendingCount) },
          { k: "Respondidas · 30 días", v: String(published30.length) },
          { k: "Tiempo de respuesta", v: avgResponseH === null ? "—" : hoursLabel(avgResponseH) },
        ].map((s, i) => (
          <div key={s.k} className={cn("flex min-w-0 flex-col gap-1.5 px-4.5 py-4", i % 2 === 1 && "border-l border-border", i >= 2 && "border-t border-border sm:border-t-0", i === 2 && "sm:border-l")}>
            <dt className="text-[12.5px] text-fg-muted">{s.k}</dt>
            <dd className="text-[22px] font-semibold tabular-nums tracking-tight">{s.v}</dd>
          </div>
        ))}
      </dl>

      {/* Respuesta automática */}
      <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4.5 py-3.5">
        <div>
          <p className="text-sm font-medium">Publicar automáticamente 4 y 5 estrellas</p>
          <p className="mt-0.5 text-[13px] text-fg-muted">Las reseñas de 1 a 3 estrellas siempre esperan tu aprobación.</p>
        </div>
        <AutoPublishToggle initial={restaurant.auto_publish_positive} />
      </div>

      {/* Pestañas y filtros */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex gap-5" role="tablist">
          {[
            { v: "pendientes", l: "Pendientes", n: pendingCount },
            { v: "respondidas", l: "Respondidas", n: rows.length - pendingCount },
          ].map((t) => (
            <Link key={t.v} role="tab" aria-selected={view === t.v} href={href({ vista: t.v === "pendientes" ? undefined : t.v })}
              className={cn("relative inline-flex items-center gap-1.5 py-1.5 text-sm font-medium text-fg-muted", view === t.v && "text-fg after:absolute after:inset-x-0 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-fg")}>
              {t.l} <span className="font-mono text-[12px] text-fg-subtle">{t.n}</span>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {[0, 5, 4, 3, 2, 1].map((n) => (
            <Link key={n} href={href({ estrellas: n ? String(n) : undefined })} aria-pressed={stars === n}
              className={cn("inline-flex h-7 items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-[12.5px] tabular-nums text-fg-muted hover:border-border-strong hover:text-fg",
                stars === n && "border-fg bg-fg text-bg hover:text-bg")}>
              {n ? `${n} ★` : "Todas"}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          {[
            { v: undefined, l: "Siempre" },
            { v: "30", l: "30 días" },
            { v: "7", l: "7 días" },
          ].map((p) => (
            <Link key={p.l} href={href({ periodo: p.v })} aria-pressed={String(period || "") === (p.v ?? "")}
              className={cn("inline-flex h-7 items-center rounded-full border border-border bg-surface px-2.5 text-[12.5px] text-fg-muted hover:border-border-strong hover:text-fg",
                String(period || "") === (p.v ?? "") && "border-fg bg-fg text-bg hover:text-bg")}>
              {p.l}
            </Link>
          ))}
        </div>
      </div>

      {/* Lista */}
      {items.length ? (
        <div className="mt-5 flex flex-col gap-3">
          {items.map((it) => <ReviewCard key={`${it.id}-${it.reply?.status}-${it.reply?.suggested.length}`} item={it} />)}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-2.5 rounded-lg border border-dashed border-border-strong px-4 py-14 text-center text-sm text-fg-muted">
          <span className="grid size-10 place-items-center rounded-md border border-border bg-surface">
            {filtersActive ? <Search className="size-4" /> : <Inbox className="size-4" />}
          </span>
          <b className="font-medium text-fg">
            {filtersActive ? "Ninguna reseña con estos filtros" : view === "pendientes" ? "Todo respondido" : "Todavía no hay respuestas publicadas"}
          </b>
          <span>{filtersActive ? "Prueba con otras estrellas u otro periodo." : view === "pendientes" ? "Te avisaremos cuando llegue una reseña nueva." : "Aparecerán aquí cuando apruebes la primera."}</span>
        </div>
      )}
    </>
  );
}

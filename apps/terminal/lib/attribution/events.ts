import "server-only"

import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

export type AttributionEventType =
  | "widget_view"
  | "widget_click"
  | "widget_signup"
  | "widget_upgrade"

export type AttributionEvent = {
  event_type: AttributionEventType
  widget_id: string
  embed_type?: string
  source_domain?: string
  source_page_url?: string
  project_id?: string
  area?: string
  referrer_user_id?: string
  new_user_id?: string
  session_id?: string
  from_tier?: string
  to_tier?: string
  days_to_convert?: number
  mrr_delta?: number
  metadata?: Record<string, unknown>
}

export async function trackAttributionEvent(event: AttributionEvent): Promise<void> {
  logger.info("[Attribution] event received", {
    event_type: event.event_type,
    widget_id: event.widget_id,
    embed_type: event.embed_type ?? null,
  })

  try {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO attribution_events (
          event_type,
          widget_id,
          embed_type,
          source_domain,
          source_page_url,
          project_id,
          area,
          referrer_user_id,
          new_user_id,
          session_id,
          from_tier,
          to_tier,
          days_to_convert,
          mrr_delta,
          metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb
        )
      `,
      event.event_type,
      event.widget_id,
      event.embed_type ?? null,
      event.source_domain ?? null,
      event.source_page_url ?? null,
      event.project_id ?? null,
      event.area ?? null,
      event.referrer_user_id ?? null,
      event.new_user_id ?? null,
      event.session_id ?? null,
      event.from_tier ?? null,
      event.to_tier ?? null,
      typeof event.days_to_convert === "number" ? event.days_to_convert : null,
      typeof event.mrr_delta === "number" ? event.mrr_delta : null,
      JSON.stringify(event.metadata ?? {}),
    )
  } catch (error) {
    logger.warn("[Attribution] event skipped", {
      event_type: event.event_type,
      widget_id: event.widget_id,
      error: error instanceof Error ? error.message : "Unknown attribution error",
    })
  }
}

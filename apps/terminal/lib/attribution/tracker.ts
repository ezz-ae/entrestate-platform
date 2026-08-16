import { logger } from "@/lib/logger"

/**
 * Entrestate Attribution Tracker v1.0
 * 
 * Client-side utility (or server-side) to track "Institutional Funnel" events:
 * - Widget Views
 * - Dashboard Entry
 * - API Key Generation
 * - Outbound Clicks
 * - Storyboard Exports
 */

export type TrackingEvent = {
  event: "WIDGET_VIEW" | "DASHBOARD_ENTRY" | "API_KEY_GEN" | "OFF_PLAN_CLICK" | "STORYBOARD_EXPORT" | "ONBOARDING_COMPLETE" | "REPORT_EXPORT"
  userId?: string
  tier?: string
  metadata?: Record<string, any>
}

export function trackInstitutionalEvent(data: TrackingEvent) {
  const payload = {
    ...data,
    timestamp: new Date().toISOString(),
  }

  // Log to Enterprise Logger
  logger.info(`[Attribution] ${data.event}`, payload)

  try {
    // In a real production environment, this would fire to a tracking endpoint
    // e.g., navigator.sendBeacon("/api/track", JSON.stringify(payload))
  } catch (error) {
    console.error("[Attribution] Failed to track event:", error)
  }
}

/**
 * Hook-ready wrapper for common funnel transitions
 */
export const Attribution = {
  logOnboardingComplete: (objective?: string) => 
    trackInstitutionalEvent({ event: "ONBOARDING_COMPLETE", metadata: { objective } }),
  
  logDashboardEntry: (tier: string) => 
    trackInstitutionalEvent({ event: "DASHBOARD_ENTRY", tier }),

  logReportExport: (format: "pdf" | "json") => 
    trackInstitutionalEvent({ event: "REPORT_EXPORT", metadata: { format } }),
}

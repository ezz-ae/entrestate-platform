import "server-only"

import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

type MetricsRow = {
  widgets_deployed: bigint | number | null
  total_views: bigint | number | null
  total_clicks: bigint | number | null
  total_signups: bigint | number | null
  total_upgrades: bigint | number | null
}

function toCount(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  if (typeof value === "number" && Number.isFinite(value)) return value
  return 0
}

export async function getViralMetrics(referrerUserId: string): Promise<{
  widgets_deployed: number
  total_views: number
  total_clicks: number
  total_signups: number
  total_upgrades: number
  ctr: number
  signup_cvr: number
  upgrade_cvr: number
  k_coefficient: number
}> {
  try {
    const rows = await prisma.$queryRawUnsafe<MetricsRow[]>(
      `
        SELECT
          COALESCE((SELECT COUNT(*) FROM widgets WHERE user_id = $1), 0) AS widgets_deployed,
          COALESCE(SUM(CASE WHEN event_type = 'widget_view' THEN 1 ELSE 0 END), 0) AS total_views,
          COALESCE(SUM(CASE WHEN event_type = 'widget_click' THEN 1 ELSE 0 END), 0) AS total_clicks,
          COALESCE(SUM(CASE WHEN event_type = 'widget_signup' THEN 1 ELSE 0 END), 0) AS total_signups,
          COALESCE(SUM(CASE WHEN event_type = 'widget_upgrade' THEN 1 ELSE 0 END), 0) AS total_upgrades
        FROM attribution_events
        WHERE referrer_user_id = $1
      `,
      referrerUserId,
    )

    const row = rows[0]
    const widgetsDeployed = toCount(row?.widgets_deployed)
    const totalViews = toCount(row?.total_views)
    const totalClicks = toCount(row?.total_clicks)
    const totalSignups = toCount(row?.total_signups)
    const totalUpgrades = toCount(row?.total_upgrades)

    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0
    const signupCvr = totalClicks > 0 ? (totalSignups / totalClicks) * 100 : 0
    const upgradeCvr = totalSignups > 0 ? (totalUpgrades / totalSignups) * 100 : 0
    const avgMonthlyViews = widgetsDeployed > 0 ? totalViews / widgetsDeployed : 0
    const kCoefficient = widgetsDeployed > 0 ? (widgetsDeployed * avgMonthlyViews * ctr * signupCvr) / 100 : 0

    return {
      widgets_deployed: widgetsDeployed,
      total_views: totalViews,
      total_clicks: totalClicks,
      total_signups: totalSignups,
      total_upgrades: totalUpgrades,
      ctr,
      signup_cvr: signupCvr,
      upgrade_cvr: upgradeCvr,
      k_coefficient: kCoefficient,
    }
  } catch (error) {
    logger.warn("[Attribution] viral metrics unavailable", {
      referrerUserId,
      error: error instanceof Error ? error.message : "Unknown attribution metrics error",
    })
    return {
      widgets_deployed: 0,
      total_views: 0,
      total_clicks: 0,
      total_signups: 0,
      total_upgrades: 0,
      ctr: 0,
      signup_cvr: 0,
      upgrade_cvr: 0,
      k_coefficient: 0,
    }
  }
}

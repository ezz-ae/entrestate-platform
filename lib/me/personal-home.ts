import "server-only"
import { getSyncedUser } from "@/lib/auth/sync"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { listUserListings } from "@/lib/listings/server"
import { getMarketPulse, listAreas } from "@/lib/decision-infrastructure"
import { prisma } from "@/lib/prisma"

/**
 * Aggregator for /me — the personal home.
 * Pulls the user's saved areas, recent verdicts, listings (paid), recent alerts
 * and a personalised market pulse, in one call.
 *
 * Designed so /me/page.tsx is a thin layout that just renders these slices.
 */

export interface PersonalHomeBundle {
  user: {
    id: string
    email: string | null
    name: string | null
    initials: string
  }
  tier: "free" | "pro" | "team" | "institutional"
  greeting: string
  marketPulse: Awaited<ReturnType<typeof getMarketPulse>>
  savedAreas: { name: string; slug: string; pulse: { avg_yield: number | null; avg_price: number | null; verdict?: string } }[]
  watchedProjects: { slug: string; name: string; verdict: string | null; updatedAt: string | null }[]
  listings: { id: string; name: string; verdict: string | null; confidence: number | null; updatedAt: string }[]
  listingsCount: number
  alerts: { id: string; title: string; body: string; createdAt: string; read: boolean }[]
  upgradeNudge: { headline: string; body: string; cta: { label: string; href: string } } | null
}

export async function getPersonalHomeBundle(): Promise<PersonalHomeBundle | null> {
  const user = await getSyncedUser()
  if (!user) return null

  const [entitlement, marketPulse, allAreas, savedAreaRows, watchedProjectRows, alertRows] = await Promise.all([
    getCurrentEntitlement(),
    getMarketPulse(),
    listAreas(),
    prisma.userSavedArea.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }).catch(() => []),
    prisma.userWatchedProject.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }).catch(() => []),
    prisma.marketAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }).catch(() => []),
  ])

  const initials = (user.name?.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("") || user.email?.[0] || "U").toUpperCase()

  const areaMap = new Map(
    allAreas.areas.map((area) => [
      String((area as any).slug ?? ""),
      {
        name: String((area as any).area ?? ""),
        slug: String((area as any).slug ?? ""),
        pulse: {
          avg_yield: typeof (area as any).avg_yield === "number" ? (area as any).avg_yield : null,
          avg_price: typeof (area as any).avg_price === "number" ? (area as any).avg_price : null,
        },
      },
    ]),
  )

  const savedAreas = savedAreaRows
    .map((row) => areaMap.get(row.areaSlug))
    .filter((area): area is NonNullable<typeof area> => Boolean(area))

  // Listings — only relevant to paid tiers, but show empty + upgrade nudge for free.
  let listings: PersonalHomeBundle["listings"] = []
  let listingsCount = 0
  if (entitlement.tier !== "free") {
    try {
      const rows = await listUserListings()
      listingsCount = rows.length
      listings = rows.slice(0, 6).map((r) => ({
        id: r.id,
        name: r.name,
        verdict: (r as any).verdict ?? null,
        confidence: (r as any).confidencePct ?? null,
        updatedAt: r.updatedAt,
      }))
    } catch {
      listings = []
    }
  }

  const watchedProjects: PersonalHomeBundle["watchedProjects"] = watchedProjectRows.map((row) => ({
    slug: row.projectSlug,
    name: row.projectSlug
      .split("-")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" "),
    verdict: null,
    updatedAt: null,
  }))

  const alerts: PersonalHomeBundle["alerts"] = alertRows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    read: row.read,
  }))

  const greeting = buildGreeting(user.name ?? user.email ?? "there")
  const upgradeNudge = entitlement.tier === "free"
    ? {
        headline: "Connect your inventory",
        body: "Free gives you the full read surface. Upgrade to push your own listings, sync portals & CRMs, and run the same evidence-graded scoring on your own deals.",
        cta: { label: "View plans", href: "/pricing" },
      }
    : null

  return {
    user: { id: user.id, email: user.email ?? null, name: user.name ?? null, initials },
    tier: entitlement.tier,
    greeting,
    marketPulse,
    savedAreas,
    watchedProjects,
    listings,
    listingsCount,
    alerts,
    upgradeNudge,
  }
}

function buildGreeting(displayName: string): string {
  const hour = new Date().getUTCHours() + 4 // GST
  const period = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const first = displayName.split(/\s+/)[0]
  return `${period}, ${first}`
}

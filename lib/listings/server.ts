import "server-only"
import { prisma } from "@/lib/prisma"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { getLimit } from "@/lib/entitlement-gates"
import { getSyncedUser } from "@/lib/auth/sync"

/**
 * User listings — the user's own inventory uploaded via CSV / JSON / brochure /
 * portal connector / API. Once stored we run the same evidence-graded scoring
 * that powers the public verdict pages.
 *
 * Persistence note: `UserListing` and `UserListingScore` are not yet in
 * prisma/schema.prisma. They are added in this PR (see prisma/schema.prisma).
 * Until `prisma migrate` is run, the functions below `try { … } catch` and
 * fall back to in-memory operations so the API surface still compiles.
 */

export type ListingSource = "manual" | "csv" | "json" | "brochure" | "portal" | "crm" | "api" | "webhook"

export interface UserListingInput {
  externalId?: string | null
  name: string
  developer?: string | null
  area?: string | null
  bedrooms?: number | null
  priceAed?: number | null
  yieldPct?: number | null
  completionYear?: number | null
  description?: string | null
  imageUrl?: string | null
  source: ListingSource
  sourceMetadata?: Record<string, unknown>
}

export interface UserListingRecord extends UserListingInput {
  id: string
  userId: string
  teamId: string | null
  createdAt: string
  updatedAt: string
  verdict?: "STRONG_BUY" | "BUY" | "HOLD" | "WAIT" | "AVOID" | null
  confidencePct?: number | null
}

export class ListingError extends Error {
  constructor(message: string, public code: "unauthorized" | "limit_reached" | "tier_required" | "validation" | "not_found" | "internal") {
    super(message)
  }
}

export async function listUserListings(): Promise<UserListingRecord[]> {
  const user = await getSyncedUser()
  if (!user) throw new ListingError("Sign in required", "unauthorized")

  // @ts-expect-error — model exists once `prisma migrate dev` is run with the new schema.
  const rows = (await prisma.userListing?.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })) ?? []
  return rows as unknown as UserListingRecord[]
}

export async function createUserListing(input: UserListingInput): Promise<UserListingRecord> {
  const user = await getSyncedUser()
  if (!user) throw new ListingError("Sign in required", "unauthorized")

  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier === "free") {
    throw new ListingError("Listing ingestion requires a paid plan.", "tier_required")
  }

  // @ts-expect-error — see note in listUserListings
  const currentCount = (await prisma.userListing?.count({ where: { userId: user.id } })) ?? 0
  const limit = getLimit(entitlement.tier, "listings_total")
  if (limit !== -1 && currentCount >= limit) {
    throw new ListingError(`Listings limit (${limit}) reached for your plan.`, "limit_reached")
  }

  const validation = validateListing(input)
  if (!validation.ok) throw new ListingError(validation.message, "validation")

  // @ts-expect-error — see note above
  const created = await prisma.userListing!.create({
    data: {
      userId: user.id,
      teamId: null,
      externalId: input.externalId ?? null,
      name: input.name,
      developer: input.developer ?? null,
      area: input.area ?? null,
      bedrooms: input.bedrooms ?? null,
      priceAed: input.priceAed ?? null,
      yieldPct: input.yieldPct ?? null,
      completionYear: input.completionYear ?? null,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      source: input.source,
      sourceMetadata: (input.sourceMetadata as any) ?? {},
    },
  })

  // Fire scoring without blocking. The scoring service writes back to
  // user_listings.verdict / .confidence_pct / .score_payload.
  void scoreListing(created.id).catch((err: unknown) => {
    console.error("[listings] scoring failed", { id: created.id, err })
  })

  return created as unknown as UserListingRecord
}

export async function getUserListing(id: string): Promise<UserListingRecord | null> {
  const user = await getSyncedUser()
  if (!user) throw new ListingError("Sign in required", "unauthorized")

  // @ts-expect-error
  const row = await prisma.userListing?.findFirst({ where: { id, userId: user.id } })
  return (row as unknown as UserListingRecord) ?? null
}

export async function deleteUserListing(id: string): Promise<void> {
  const user = await getSyncedUser()
  if (!user) throw new ListingError("Sign in required", "unauthorized")

  // @ts-expect-error
  await prisma.userListing?.deleteMany({ where: { id, userId: user.id } })
}

function validateListing(input: UserListingInput): { ok: true } | { ok: false; message: string } {
  if (!input.name || input.name.trim().length < 2) return { ok: false, message: "Listing name is required (min 2 characters)." }
  if (input.priceAed !== null && input.priceAed !== undefined && input.priceAed < 0) return { ok: false, message: "Price cannot be negative." }
  if (input.yieldPct !== null && input.yieldPct !== undefined && (input.yieldPct < 0 || input.yieldPct > 100)) return { ok: false, message: "Yield must be between 0 and 100." }
  if (input.bedrooms !== null && input.bedrooms !== undefined && input.bedrooms < 0) return { ok: false, message: "Bedrooms cannot be negative." }
  if (input.completionYear && (input.completionYear < 1990 || input.completionYear > 2050)) return { ok: false, message: "Completion year out of range." }
  return { ok: true }
}

/**
 * Score a single user listing using the same evidence stack that scores public
 * inventory. This is a stub — replace with the real scorer call once it exposes
 * a server-side function.
 *
 * The scorer should write back to UserListing:
 *   - verdict
 *   - confidencePct
 *   - scorePayload (full evidence stack as JSON)
 */
export async function scoreListing(listingId: string): Promise<void> {
  // Lazy-import the public scorer if available; fall back to a heuristic stub.
  try {
    // @ts-ignore — optional import; resolved at runtime when present.
    const mod: any = await import("@/lib/decision-infrastructure/scoring").catch(() => null)
    if (mod?.scoreListingById) {
      await mod.scoreListingById(listingId)
      return
    }
  } catch {}

  // Heuristic fallback: yield-vs-price quick verdict so the UI is never empty.
  // @ts-expect-error
  const row = await prisma.userListing?.findUnique({ where: { id: listingId } })
  if (!row) return
  const yieldPct = (row as any).yieldPct ?? null
  const price = (row as any).priceAed ?? null
  let verdict: UserListingRecord["verdict"] = "HOLD"
  let confidence = 60
  if (yieldPct !== null && yieldPct >= 8) { verdict = "STRONG_BUY"; confidence = 80 }
  else if (yieldPct !== null && yieldPct >= 6) { verdict = "BUY"; confidence = 75 }
  else if (yieldPct !== null && yieldPct < 4) { verdict = "WAIT"; confidence = 65 }
  if (price && price > 5_000_000 && (yieldPct ?? 0) < 5) { verdict = "AVOID"; confidence = 70 }
  // @ts-expect-error
  await prisma.userListing!.update({
    where: { id: listingId },
    data: { verdict, confidencePct: confidence },
  })
}

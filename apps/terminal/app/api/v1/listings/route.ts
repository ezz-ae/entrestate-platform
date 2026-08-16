import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { prisma } from "@/lib/prisma"
import { hashApiKey } from "@/lib/api-keys"
import { listUserListings, createUserListing, ListingError, type UserListingInput } from "@/lib/listings/server"
import { hasCapability } from "@/lib/entitlement-gates"
import { coerceEntitlementTier, getEntitlementByAccountKey } from "@/lib/billing-entitlements"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Two-mode auth:
 *   - Cookie session    → uses getCurrentEntitlement / getSyncedUser via lib/listings.
 *   - x-api-key header  → resolves the key to its owner, then enforces capability.
 */

async function resolveApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey) return null
  const hashed = hashApiKey(apiKey)
  const keyRecord = await prisma.apiKey.findFirst({
    where: { OR: [{ key: hashed }, { key: apiKey }] },
    include: { user: true },
  })
  if (!keyRecord) return "invalid" as const
  await prisma.apiKey.update({ where: { id: keyRecord.id }, data: { lastUsedAt: new Date() } })
  const ent = await getEntitlementByAccountKey(keyRecord.userId)
  return {
    userId: keyRecord.userId,
    scopes: keyRecord.scopes,
    tier: coerceEntitlementTier(ent?.tier ?? "free"),
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const apiAuth = await resolveApiKey(request)
    if (apiAuth === "invalid") return NextResponse.json({ error: "Invalid API key", requestId }, { status: 403 })

    if (apiAuth) {
      if (!apiAuth.scopes.includes("read:listings")) return NextResponse.json({ error: "Scope read:listings required", requestId }, { status: 403 })
      if (!hasCapability(apiAuth.tier, "api_read_listings")) return NextResponse.json({ error: "Tier not allowed", requestId }, { status: 402 })
      // @ts-expect-error — model added in this PR
      const rows = (await prisma.userListing?.findMany({ where: { userId: apiAuth.userId }, orderBy: { createdAt: "desc" } })) ?? []
      return NextResponse.json({ listings: rows, requestId })
    }

    // Cookie-session path
    const listings = await listUserListings()
    return NextResponse.json({ listings, requestId })
  } catch (err) {
    if (err instanceof ListingError) {
      const status = err.code === "unauthorized" ? 401 : err.code === "tier_required" ? 402 : 500
      return NextResponse.json({ error: err.message, requestId }, { status })
    }
    console.error("[/api/v1/listings GET] failed", err)
    return NextResponse.json({ error: "Internal error", requestId }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const apiAuth = await resolveApiKey(request)
    if (apiAuth === "invalid") return NextResponse.json({ error: "Invalid API key", requestId }, { status: 403 })

    const body = (await request.json().catch(() => null)) as Partial<UserListingInput> | null
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Body required", requestId }, { status: 400 })

    const input: UserListingInput = {
      externalId: body.externalId ?? null,
      name: String(body.name ?? "").trim(),
      developer: body.developer ?? null,
      area: body.area ?? null,
      bedrooms: body.bedrooms ?? null,
      priceAed: body.priceAed ?? null,
      yieldPct: body.yieldPct ?? null,
      completionYear: body.completionYear ?? null,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      source: body.source ?? "api",
      sourceMetadata: body.sourceMetadata ?? {},
    }

    if (apiAuth) {
      if (!apiAuth.scopes.includes("write:listings")) return NextResponse.json({ error: "Scope write:listings required", requestId }, { status: 403 })
      if (!hasCapability(apiAuth.tier, "api_write_listings")) return NextResponse.json({ error: "Tier not allowed", requestId }, { status: 402 })
      // Direct write bypassing cookie session — the lib helper requires a cookie user, so emulate.
      // Use prisma directly to avoid a re-auth round-trip for API-key calls.
      // @ts-expect-error — model added in this PR
      const listing = await prisma.userListing!.create({
        data: {
          userId: apiAuth.userId,
          teamId: null,
          externalId: input.externalId,
          name: input.name,
          developer: input.developer,
          area: input.area,
          bedrooms: input.bedrooms,
          priceAed: input.priceAed,
          yieldPct: input.yieldPct,
          completionYear: input.completionYear,
          description: input.description,
          imageUrl: input.imageUrl,
          source: input.source,
          sourceMetadata: (input.sourceMetadata as any) ?? {},
        },
      })
      return NextResponse.json({ listing, requestId }, { status: 201 })
    }

    // Cookie-session path — capability check inside createUserListing.
    const listing = await createUserListing(input)
    return NextResponse.json({ listing, requestId }, { status: 201 })
  } catch (err) {
    if (err instanceof ListingError) {
      const status = err.code === "unauthorized" ? 401 : err.code === "tier_required" ? 402 : err.code === "limit_reached" ? 429 : err.code === "validation" ? 400 : 500
      return NextResponse.json({ error: err.message, code: err.code, requestId }, { status })
    }
    console.error("[/api/v1/listings POST] failed", err)
    return NextResponse.json({ error: "Internal error", requestId }, { status: 500 })
  }
}

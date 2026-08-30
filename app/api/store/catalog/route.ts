import { NextResponse } from "next/server"
import { STORE } from "@/lib/freehold/app-store"

/**
 * THE ONE CATALOG, READABLE FROM THE TERMINAL.
 *
 * The owner's account model: the Terminal account is THE account — search and
 * data stay free there — and selling happens through THIS business's App
 * Store. "مش ده حساب وده حساب": the person who signs up on
 * terminal.entrestate.com must SEE what the business sells, inside their own
 * account area, without the catalog being copied there.
 *
 * This codebase already paid for a copy once: a vendored Terminal absorbed
 * the price guard meant for the real one, and a wrong price shipped. So the
 * catalog is SERVED, never duplicated — lib/freehold/app-store.ts stays the
 * single spelling, and the Terminal renders whatever this returns.
 *
 * What crosses the wire is the SALES read only. `engine` — which internal
 * modules power a product — never leaves this repository: the sites stopped
 * printing their own plumbing this week, and an API that leaks it would be
 * the same disease with a different door.
 */

const ALLOWED_ORIGINS = new Set([
  "https://terminal.entrestate.com",
  "https://m.entrestate.com",
  "http://localhost:3000",
  "http://localhost:3111",
])

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
    vary: "origin",
  }
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin
    headers["access-control-allow-methods"] = "GET, OPTIONS"
  }
  return headers
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) })
}

export async function GET(request: Request) {
  const products = STORE.map((product) => ({
    id: product.id,
    name: product.name,
    tagline: product.tagline,
    tier: product.tier,
    status: product.status,
    plans: product.plans,
    ...(product.liteOf ? { liteOf: product.liteOf } : {}),
  }))

  return NextResponse.json(
    {
      store_url: "/freehold-intelligence/store",
      products,
    },
    { headers: corsHeaders(request.headers.get("origin")) },
  )
}

import { NextResponse } from "next/server"
import { BRAND } from "@/lib/freehold/brand"
import type { NextRequest } from "next/server"
import { verifySession, SESSION_COOKIE } from '@/lib/freehold/auth-edge'
import { MANAGEMENT_ROLES, LEADERSHIP_ROLES } from '@/lib/freehold/session-types'
import { WHITE_LABEL } from '@/lib/whitelabel/config'
import { tenantSubdomainFromHost } from '@/lib/tenancy/config'
import { vendorHostAction } from '@/lib/tenancy/vendor-host'

// Internal command surfaces — pages that must never render for anonymous visitors.
const internalPagePrefixes = [
  "/freehold-intelligence",
  "/ads-studio",
  "/notebook",
  "/cloud",
  "/agent-network",
  "/reports",
  "/settings",
]

// FAIL-CLOSED API auth. Every /api/* route requires a valid Freehold session
// EXCEPT the explicit public allowlist below — new routes are private by
// default, the only safe direction for a system that will soon hold real ad
// budgets and lead PII. Secret/signature-gated machine endpoints (cron,
// bootstrap, webhook) are allowlisted here and verify their own secret in-handler.
const PUBLIC_API_EXACT = new Set([
  "/api/health",
  "/api/markets",
  "/api/intelligence-block",
  "/api/embed",
  "/api/lp-analytics",          // anonymous landing-page analytics ingestion
  "/api/lp-telemetry",          // Engine 04 active/idle telemetry — session-keyed, clamped, budgeted in handler
  "/api/leads",                 // public landing-page lead capture (POST)
  "/api/auth/roster",           // login-screen profile picker (names/roles only)
  // Answers "who is this?" from the PLATFORM session and returns a name and an
  // email, or null. Public because it authenticates itself and because the wall
  // below reads the WORKSPACE cookie — which a caller on a vendor host
  // correctly does not carry, so gating it here made it answer "Authentication
  // required" to precisely the signed-in customer it exists to recognise.
  "/api/auth/whoami",
  "/api/auth/login",
  "/api/auth/request-reset",
  "/api/auth/reset",
  "/api/auth/bootstrap-admin",  // setup-key-gated in handler
  "/api/server/login",
  "/api/server/logout",
  "/api/whatsapp/webhook",      // Meta HMAC-signature-gated in handler
  "/api/meta/webhook",          // Meta leadgen push — HMAC-signature-gated in handler
  "/api/mcp",                   // remote MCP server — Bearer-token-gated in handler
  // Public buyer chatbot on the marketing site (/chat). The handler is
  // anonymous-by-design (scripted fallback + lead capture, no privileged
  // data) and sits behind the LLM cost-guard rate limit above. Without this
  // entry the fail-closed API wall 401s every logged-out visitor — the
  // "AI site can't help" complaint: only signed-in staff could ever reach it.
  "/api/ai/chat",
  // The App Store catalog, read by the Terminal's account area. Names,
  // taglines, tiers and plan gates only — no engine internals, no PII, no
  // session. The single source of truth stays lib/freehold/app-store.ts;
  // serving it is how the Terminal shows the store without copying it.
  "/api/store/catalog",
  // The account's own summary for its Terminal surfaces (phase 5). Public on
  // the wall for the same reason as /api/auth/whoami: it authenticates itself
  // (the shared Neon session via getTerminalUser) and fails closed with 401 —
  // the wall's WORKSPACE cookie is one a Terminal caller correctly lacks.
  "/api/account/summary",
  // "Open my workspace" — reads the shared Neon session, proves ownership
  // against saas_tenants.owner_email, and redirects to the tenant host's
  // claim endpoint. Public here for the same reason as the line above: the
  // caller is a Terminal identity, which correctly has no workspace cookie,
  // and the handler authenticates itself and fails closed to /business/account.
  "/api/account/workspace/enter",
])
const PUBLIC_API_PREFIXES = [
  "/api/freehold/public/",      // public catalogue (projects, areas, developers, search)
  "/api/market-score/",         // public market pulse
  "/api/pdf/",                  // public brochure download + lead capture
  "/api/cron/",                 // CRON_SECRET-gated in handler
  "/api/wl/",                   // white-label: activate (public), keys (secret-gated), logo (cookie)
]

// Roles allowed to spend ad budget / read lead-form PII (marketing +
// management + team leaders). A team leader "can see all the campaigns and
// work with them on it but doesnt own camapigns": that means pausing, editing,
// re-targeting and reading the leads a campaign produced. It does NOT mean
// deletion — /api/meta/campaigns/[id] refuses that in-handler for everyone but
// the owner, and this wall is not the place that decision belongs.
const ADS_ROLES = new Set<string>([...LEADERSHIP_ROLES, "marketing"])

// ── Apex short landing slugs (fhp.ae/velencia → /lp/velencia) ─────────────────
// On the public short domain, a bare single-segment path is served as the real
// landing page, so ads and QR codes can use the shortest possible URL. Known
// app routes and files are never touched.
const RESERVED_SLUGS = new Set([
  "a", "about", "areas", "blog", "chat", "contact", "developers",
  "freehold-intelligence", "lp", "map", "privacy", "projects", "properties",
  "search", "server", "services", "share", "site", "terms", "tools", "l",
  "api", "crm", "market", "login", "sign-in", "ads-studio", "notebook",
  "cloud", "agent-network", "reports", "settings",
])

function shortHosts(): string[] {
  const hosts = new Set<string>()
  const add = (raw?: string) => {
    const v = (raw || "").trim()
    if (!v) return
    try {
      const h = new URL(v.includes("://") ? v : `https://${v}`).host.toLowerCase()
      hosts.add(h)
      hosts.add(h.startsWith("www.") ? h.slice(4) : `www.${h}`)
    } catch { /* ignore malformed host */ }
  }
  ;(process.env.NEXT_PUBLIC_SHORT_DOMAIN || "").split(",").forEach(add)
  add(process.env.NEXT_PUBLIC_SITE_URL)
  return [...hosts]
}
const SHORT_HOSTS = shortHosts()

// ── LLM cost guard ────────────────────────────────────────────────────────────
// Best-effort sliding-window rate limit for AI-backed endpoints (each request
// costs real Gemini/Vertex money). Per-instance in-memory — serverless
// instances each keep their own window, so this is a cost/abuse damper, not a
// hard quota; a shared store (e.g. Upstash) can replace it later.
const AI_PREFIXES = [
  "/api/ai/",
  "/api/chat",
  "/api/freehold/ai/",
  "/api/freehold/chat",
  "/api/freehold/expert/",
  "/api/freehold/server-ai/",
  "/api/freehold/notebook/chat",
  "/api/freehold/lead-machine/ai",
]
const AI_LIMIT = 30 // requests per window per caller
const AI_WINDOW_MS = 60_000
const aiHits = new Map<string, number[]>()

function aiRateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (aiHits.get(key) ?? []).filter((t) => now - t < AI_WINDOW_MS)
  if (hits.length >= AI_LIMIT) { aiHits.set(key, hits); return true }
  hits.push(now)
  aiHits.set(key, hits)
  // Opportunistic prune so the map can't grow unbounded.
  if (aiHits.size > 5000) {
    for (const [k, v] of aiHits) if (v.every((t) => now - t >= AI_WINDOW_MS)) aiHits.delete(k)
  }
  return false
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""
  const { pathname } = url

  // ── Fail-closed session auth for every /api route (public allowlist only) ──
  // MUST run before any host-based short-circuit below (e.g. the crm. subdomain
  // branch) so no Host header can skip the check. New routes are private by
  // default; secret/signature-gated machine endpoints verify their own secret.
  if (pathname.startsWith("/api/")) {
    const isPublic =
      PUBLIC_API_EXACT.has(pathname) ||
      PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    if (!isPublic) {
      const token = request.cookies.get(SESSION_COOKIE)?.value
      const user = await verifySession(token)
      if (!user) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 })
      }
      // Tenant fencing (SaaS): a session is only valid on the host it was
      // minted for — tenant sessions on their own subdomain, non-tenant
      // sessions on non-tenant hosts. Pure string compare, no DB at the edge.
      // Dormant when TENANT_BASE_DOMAIN is unset (parser always returns null).
      if ((user.tenant ?? null) !== tenantSubdomainFromHost(hostname)) {
        return NextResponse.json({ error: "Session does not belong to this workspace." }, { status: 401 })
      }
      // Ad spend + lead PII: launching/editing campaigns (any write to
      // /api/meta|google/*) and reading Meta lead-form data must be gated to
      // marketing + management. Brokers keep GET access (view their campaigns).
      const adsScope = pathname.startsWith("/api/meta/") || pathname.startsWith("/api/google/")
      const isWrite = !["GET", "HEAD", "OPTIONS"].includes(request.method)
      const isLeadPII = pathname.startsWith("/api/meta/forms/")
      if (adsScope && (isWrite || isLeadPII) && !ADS_ROLES.has(user.role)) {
        return NextResponse.json({ error: "Insufficient role for ad operations." }, { status: 403 })
      }

      // LLM-backed endpoints: throttle per caller (session token, else IP).
      const isAi = AI_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))
      if (isAi) {
        const caller = token ?? request.headers.get("x-forwarded-for") ?? "anon"
        if (aiRateLimited(caller)) {
          return NextResponse.json(
            { error: "Too many AI requests — try again in a minute." },
            { status: 429, headers: { "Retry-After": "60" } },
          )
        }
      }
    }
  }

  // ── The vendor's own hosts ────────────────────────────────────────────────
  // entrestate.com and its product doors (machine., meta., listing.) are not
  // brokerages, so they must not answer with the property-marketing site that
  // ships in this codebase. See lib/tenancy/vendor-host.ts for the rule; it
  // returns "pass" for every host when tenancy is switched off, which is every
  // request on the Freehold deployment.
  //
  // Runs after the API wall above so authentication is never skipped, and
  // before the routes below so a vendor host cannot fall into them.
  const vendor = vendorHostAction(hostname, pathname)
  if (vendor.kind === 'redirect') {
    url.pathname = vendor.to
    url.search = ''
    return NextResponse.redirect(url, { status: 307 })
  }
  if (vendor.kind === 'rewrite') {
    url.pathname = vendor.to
    return NextResponse.rewrite(url)
  }

  // ── Market routing ────────────────────────────────────────────────────────
  // The legacy /market dashboard was removed. Redirect any old /market* link to
  // the public projects catalogue so inbound bookmarks land on live content
  // instead of a 404.
  if (pathname === "/market" || pathname.startsWith("/market/")) {
    url.pathname = "/projects"
    url.search = ""
    return NextResponse.redirect(url, { status: 308 })
  }

  // ── CRM subdomain redirect ─────────────────────────────────────────────────
  if (hostname.startsWith("crm.")) {
    if (pathname.startsWith("/api")) {
      const res = NextResponse.next()
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
      return res
    }
    url.hostname = BRAND.domain
    url.protocol = "https:"
    if (!pathname.startsWith("/crm")) {
      url.pathname = `/crm${pathname}`
    }
    return NextResponse.redirect(url, { status: 308 })
  }

  // ── Session auth for internal pages ────────────────────────────────────────
  const isInternalPage = internalPagePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (isInternalPage) {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const user = await verifySession(token)
    const hostTenant = tenantSubdomainFromHost(hostname)

    // WHERE A PERSON WITHOUT A WORKSPACE SESSION IS SENT.
    //
    // On a tenant host (SaaS), NOT to the sign-in screen: to the recognise
    // door, /api/wl/recognise, which reads the Entrestate account (the Neon
    // cookie on .entrestate.com, readable here) and mints the workspace
    // session on the spot when this workspace lists that person. The owner
    // and every team member who is signed in to Entrestate therefore never
    // see a sign-in screen on their own workspace — one account, one door.
    // Only a real stranger (no Neon session, or one this workspace does not
    // list) ends up on /server, and the door says which.
    //
    // No cookie check at the edge on purpose: the Neon cookie's name is the
    // auth library's business, and this middleware cannot verify it anyway.
    // The door is one cheap redirect and it decides with the real session.
    // Loop-safe: /server is not an internal page, so a refusal ends here.
    //
    // Elsewhere — the vendor's own hosts, a deployment without tenancy, the
    // white-label demo — the previous rule stands.
    const withoutSession = (): NextResponse => {
      const url = request.nextUrl.clone()
      if (hostTenant && !WHITE_LABEL) {
        url.pathname = '/api/wl/recognise'
        url.search = ''
        url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
        return NextResponse.redirect(url)
      }
      // White-label demo: unauthenticated visitors go to the activation gate,
      // not the Freehold team sign-in.
      url.pathname = WHITE_LABEL ? '/activate' : '/server'
      url.search = ''
      return NextResponse.redirect(url)
    }

    if (!user) return withoutSession()

    // Tenant fencing for pages (SaaS): a session minted on another host must
    // re-authenticate here — same rule as the API wall above.
    if ((user.tenant ?? null) !== hostTenant) return withoutSession()

    // Management-only: company-wide reporting, money, ROI, system events.
    if (pathname.startsWith('/freehold-intelligence/management') && !MANAGEMENT_ROLES.includes(user.role)) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = user.home
      homeUrl.search = ''
      return NextResponse.redirect(homeUrl)
    }

    // Team: management PLUS team leaders. A leader has to be able to see the
    // people they lead, so this gate is wider than Management by exactly one
    // role — and the page scopes the roster to their team, which is where the
    // real limit lives. Matches TEAM_APP_ROLES in lib/freehold/apps.ts.
    if (pathname.startsWith('/freehold-intelligence/team') && !LEADERSHIP_ROLES.includes(user.role)) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = user.home
      homeUrl.search = ''
      return NextResponse.redirect(homeUrl)
    }
  }

  // ── Apex short landing slugs on the short domain ───────────────────────────
  // fhp.ae/velencia → the real landing page at /lp/velencia (URL stays short).
  if (SHORT_HOSTS.length > 0) {
    const host = hostname.toLowerCase().split(":")[0]
    if (SHORT_HOSTS.includes(host)) {
      const m = pathname.match(/^\/([^/]+)\/?$/)
      if (m && !m[1].includes(".") && !RESERVED_SLUGS.has(m[1].toLowerCase())) {
        url.pathname = `/lp/${m[1]}`
        url.search = request.nextUrl.search
        return NextResponse.rewrite(url)
      }
    }
  }

  const res = NextResponse.next()

  // ── Cache control ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/crm") || pathname.startsWith("/api")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  }

  return res
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json).*)",
  ],
}

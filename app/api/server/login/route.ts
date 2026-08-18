/**
 * Sign in.
 *
 * ON A TENANT HOST this is unchanged: authenticateFromDB reads that tenant's
 * own users table (schema-per-tenant), and the session is fenced to it.
 *
 * ON THE VENDOR HOST it now does a second thing, because the first thing could
 * not work. entrestate.com's header links here (components/business/shell.tsx),
 * and a customer arriving with correct credentials was told "Incorrect email
 * or password": their password lives in their TENANT schema
 * (lib/tenancy/onboard.ts), while the identity app/api/wl/claim/route.ts
 * creates in the shared schema deliberately carries no password_hash, and
 * verifyPassword returns false on a null hash (lib/freehold/auth-db.ts:20-21).
 * Correct credentials, correct product, flat refusal — and nothing on the page
 * able to say which host to try, because until now no table recorded who owned
 * a workspace.
 *
 * So: shared-schema auth first (vendor staff), then the workspaces this email
 * owns, verifying the password INSIDE each tenant's schema. On success it does
 * NOT mint a session here — a session minted on the apex is not the host-only,
 * tenant-fenced cookie the workspace needs. It signs the same short-lived
 * handoff token signup already uses and sends them to their own host's claim
 * route, which mints both cookies exactly as it does for a new customer.
 *
 * WHAT AN ATTACKER LEARNS: nothing. Every failure returns the same sentence
 * and the same 401. A workspace is named only in the redirect that follows a
 * password that verified against that workspace.
 */
import { NextResponse } from 'next/server'
import { authenticateFromDB } from '@/lib/freehold/auth-db'
import { signSession, SESSION_COOKIE } from '@/lib/freehold/auth-edge'
import { tenantSubdomainFromHost, SAAS_TENANCY, TENANT_BASE_DOMAIN } from '@/lib/tenancy/config'
import { tenantsOwnedByEmail } from '@/lib/tenancy/store'
import { runWithSchema } from '@/lib/db'

export const runtime = 'nodejs'

const DAY = 60 * 60 * 24

/** Matches the claim route's replay window. Long enough for one redirect. */
const HANDOFF_TTL_MS = 2 * 60 * 1000

export async function POST(req: Request) {
  let body: { email?: string; password?: string; remember?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const email = body.email ?? ''
  const password = body.password ?? ''

  // DB-only authentication — real accounts with hashed passwords. The old
  // hardcoded-credential fallback and demo-team seeding are gone: they shipped
  // plaintext passwords and resurrected deleted accounts on every login.
  const user = await authenticateFromDB(email, password)

  // On a tenant host, authenticateFromDB already read the right table and
  // there is nowhere else to look. The cross-tenant search below must NEVER
  // run here: it would let a request arriving at tenant A's host authenticate
  // against tenant B's schema, which is precisely the boundary proxy.ts:150
  // and :241 exist to hold.
  const hostTenant = tenantSubdomainFromHost(req.headers.get('host'))

  if (!user) {
    if (!hostTenant && SAAS_TENANCY) {
      const handoff = await findWorkspaceSignIn(email, password, req)
      if (handoff) return NextResponse.json({ redirect: handoff })
    }
    // One sentence for every failure — no password, wrong password, no such
    // person, no such workspace, control plane unreadable. Any variation here
    // turns this endpoint into a way to ask whether somebody is a customer.
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
  }

  const remember = !!body.remember
  const ttlMs = (remember ? 30 * DAY : 12 * 60 * 60) * 1000
  // On a tenant host the session is fenced to that tenant: authenticateFromDB
  // already read the tenant's own users table (schema-per-tenant), and the
  // claim below lets the proxy reject this cookie on any other host.
  const token = await signSession(hostTenant ? { ...user, tenant: hostTenant } : user, ttlMs)

  const res = NextResponse.json({ user })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(remember ? { maxAge: 30 * DAY } : {}),
  })
  return res
}

/**
 * The workspace this email and password actually open, as a URL to send them
 * to — or null, which the caller renders as the ordinary refusal.
 *
 * Checked one workspace at a time INSIDE that workspace's schema, because that
 * is the only place the password exists. The first that verifies wins; owning
 * two workspaces with the same password lands on the older one, which is the
 * one `ORDER BY created_at ASC` names and the one they have had longer.
 *
 * A per-tenant failure is swallowed and the loop continues: one unreachable
 * schema must not deny sign-in to a workspace that is fine.
 */
async function findWorkspaceSignIn(email: string, password: string, req: Request): Promise<string | null> {
  const owned = await tenantsOwnedByEmail(email)
  if (owned.length === 0) return null

  for (const tenant of owned) {
    const inside = await runWithSchema(tenant.schemaName, () => authenticateFromDB(email, password))
      .catch(() => null)
    if (!inside) continue

    // NOT a session cookie. A cookie set on this response belongs to the
    // vendor host; the workspace needs a host-only cookie on THEIR host. The
    // claim route already mints exactly that, and only for the tenant named in
    // the token, so the handoff carries no authority anywhere else.
    const token = await signSession({ ...inside, tenant: tenant.subdomain }, HANDOFF_TTL_MS)
    // Built the same way app/api/wl/signup/route.ts:88-94 builds it, for the
    // same reason: preserve the request's port so {sub}.localhost:3000 works
    // in local dev. TENANT_BASE_DOMAIN itself never carries one.
    const reqHost = req.headers.get('host') || ''
    const port = reqHost.includes(':') ? `:${reqHost.split(':')[1]}` : ''
    const proto = new URL(req.url).protocol
    return `${proto}//${tenant.subdomain}.${TENANT_BASE_DOMAIN}${port}/api/wl/claim?token=${encodeURIComponent(token)}`
  }
  return null
}

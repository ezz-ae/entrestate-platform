/**
 * WHAT THE VENDOR'S OWN HOSTS ARE ALLOWED TO SERVE.
 *
 * One deployment serves three different kinds of host:
 *
 *   {broker}.entrestate.com   a tenant's instance — the product, their brand
 *   entrestate.com            the vendor's own front door
 *   machine.entrestate.com    a product door, reserved and never a tenant
 *
 * Only the first was ever thought about. The other two fell through to the
 * property-marketing site that ships in this codebase, so entrestate.com and
 * machine.entrestate.com both answered with a Dubai property portal —
 * "Golden Visa", "off-plan", featured listings. The front door of the company
 * was advertising apartments.
 *
 * This module is the rule for those hosts, kept pure so it can be tested
 * without a server (see scripts/vendor-host-test.ts) and so the proxy stays
 * readable. It does nothing at all unless tenancy is enabled, so the Freehold
 * deployment is untouched.
 */

import { SAAS_TENANCY, tenantSubdomainFromHost, TENANT_BASE_DOMAIN } from './config'

export type VendorAction =
  | { kind: 'pass' }
  /** Change the address bar — used where one canonical URL should win. */
  | { kind: 'redirect'; to: string }
  /** Keep the short address, serve another page — used for product doors. */
  | { kind: 'rewrite'; to: string }

/**
 * A reserved subdomain that is a product's own entrance. Landing on
 * machine.entrestate.com should show the Lead Machine page while keeping the
 * short address, so the URL stays memorable on a business card. Each target
 * page already declares its canonical /business/... path, so serving it from
 * two hostnames cannot split it in search.
 */
export const PRODUCT_DOORS: Readonly<Record<string, string>> = {
  machine: '/business/lead-machine',
  leadmachine: '/business/lead-machine',
  'lead-machine': '/business/lead-machine',
  meta: '/business/meta-for-realtors',
  ads: '/business/meta-for-realtors',
  listing: '/business/listing-to-landing',
  listings: '/business/listing-to-landing',
  landing: '/business/listing-to-landing',
  landings: '/business/listing-to-landing',
  // Leadformer lives inside Entrestate rather than on its own domain: it is
  // real-estate-only for now, and a door costs nothing while a separate
  // deployment would cost the reuse of this engine (the Visual Sales Team, the
  // grounding, the pool). If it outgrows the vertical it moves out — the name
  // is reserved in reserved.ts so that move stays available.
  leadformer: '/business/leadformer',
  leadform: '/business/leadformer',
}

/**
 * Surfaces that make sense on a vendor host, and the ones that do not.
 *
 * Two lists, not one, and both exported: `scripts/vendor-host-test.ts` proves
 * they account for EVERY top-level route in app/, so a route added later is
 * classified deliberately instead of inheriting a default.
 *
 * That guard exists because the default already bit. The list below started as
 * a handful of paths and then the application grew past it: /ctrl arrived in
 * da5a20e ("the partner plane becomes entrestate.com/ctrl") without being added
 * here, so the address in its own commit message answered with a redirect to
 * /business. The control plane, the white-label console and the activation gate
 * were all unreachable on the domain they were built for, and the only surface
 * anybody could still open was /server. An allowlist that nobody is forced to
 * update is a list that silently deletes routes.
 */
export const VENDOR_PREFIXES = [
  // The vendor's own marketing site, and the way in to buying it.
  '/business',
  '/signup',
  // Sign-in. Every session-gated page redirects to /server (proxy.ts), and
  // /login is the address people actually type — app/login/page.tsx redirects
  // there rather than a second sign-in screen existing to drift out of sync.
  '/server',
  '/login',
  // The product. An operator has to be able to run the platform from the
  // vendor's own domain; these are session-gated above this rule in the proxy.
  '/freehold-intelligence',
  '/crm',
  // The control plane and its storefront. /ctrl is staff-gated server-side
  // (app/ctrl/layout.tsx bounces anyone who is not management to /server) and
  // /portal/[slug] is a deliberate capability URL with no login, so admitting
  // them here grants nothing that was not already decided in those files.
  '/ctrl',
  '/portal',
  // White-label: the prospect's activation gate and the vendor's key console.
  // Both self-gate on a secret. /activate is also where the proxy sends
  // unauthenticated visitors when WHITE_LABEL is on, so redirecting it away
  // would leave that deployment with no door at all.
  '/activate',
  '/wl-admin',
  '/privacy',
  '/terms',
  '/api',
]

/**
 * The brokerage-facing property site that ships in this codebase. It belongs to
 * a licensed brokerage — its own listings, its own RERA number, its own Golden
 * Visa page — and none of it belongs on the vendor's front door, which is the
 * whole reason this module exists.
 *
 * Named rather than inferred, so the guard can tell "a route we decided is the
 * property site" apart from "a route nobody has thought about yet".
 */
export const PROPERTY_SITE_PREFIXES = [
  '/projects',
  '/properties',
  '/areas',
  '/developers',
  '/blog',
  '/tools',
  '/chat',
  '/lp',
  '/search',
  '/map',
  '/site',
  '/share',
  // Brokerage identity pages: "Dubai real estate advisory", the Business Bay
  // office, the brokerage's services. Vendor visitors want /business.
  '/about',
  '/services',
  '/contact',
  '/a', // agent handles
  '/l', // short links
  '/market', // retired dashboard; the proxy sends it to /projects
]

/** Files (og-image.png, robots.txt, sitemap.xml…) are never page routes. */
const isFile = (pathname: string): boolean => {
  const last = pathname.split('/').pop() ?? ''
  return last.includes('.')
}

/** The subdomain of a vendor host, or '' for the apex. Null when not ours. */
function vendorSubdomain(rawHost: string): string | null {
  const host = rawHost.trim().toLowerCase().split(':')[0]
  if (!host) return null
  if (host === TENANT_BASE_DOMAIN) return ''
  if (host === `www.${TENANT_BASE_DOMAIN}`) return ''
  if (!host.endsWith(`.${TENANT_BASE_DOMAIN}`)) return null
  const label = host.slice(0, -(TENANT_BASE_DOMAIN.length + 1))
  return label.includes('.') ? null : label
}

/**
 * What to do with a request, given the host it arrived on.
 *
 * Returns `pass` for every request the vendor rules have no opinion about —
 * tenancy switched off, a tenant's own instance, an unrelated domain, or a
 * path that already belongs to the vendor surface.
 */
export function vendorHostAction(rawHost: string | null | undefined, pathname: string): VendorAction {
  if (!SAAS_TENANCY || !rawHost) return { kind: 'pass' }
  // A tenant's instance is governed by the tenancy rules, not these.
  if (tenantSubdomainFromHost(rawHost)) return { kind: 'pass' }

  const sub = vendorSubdomain(rawHost)
  if (sub === null) return { kind: 'pass' } // not one of ours (preview URL, custom domain)

  const door = sub ? PRODUCT_DOORS[sub] : undefined

  // The root of a product door serves that product, keeping the short address.
  if (door && (pathname === '/' || pathname === '')) return { kind: 'rewrite', to: door }

  // The apex root is the platform site. One canonical address for it.
  if (!door && (pathname === '/' || pathname === '')) return { kind: 'redirect', to: '/business' }

  if (isFile(pathname)) return { kind: 'pass' }
  if (VENDOR_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return { kind: 'pass' }

  // Anything else is the brokerage-facing property site. It does not belong on
  // the vendor's domain, so send the reader to the thing they were looking for
  // rather than showing them somebody else's apartments.
  return { kind: 'redirect', to: '/business' }
}

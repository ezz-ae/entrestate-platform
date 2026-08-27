/**
 * White-label brand configuration — the SINGLE source of truth for branding.
 *
 * Set NEXT_PUBLIC_BRAND_* in the deployment environment to re-brand the
 * entire product. No code edits are needed per company: every user-visible
 * brand surface (naming, accent colour, contact details, emails, AI prompts,
 * public URLs) reads from this module. See DEPLOYMENT.md for the full
 * per-company checklist.
 *
 *   NEXT_PUBLIC_BRAND_COMPANY        → all visible naming (nav, sign-in, titles)
 *   NEXT_PUBLIC_BRAND_PRODUCT        → product word after the company name
 *   NEXT_PUBLIC_BRAND_ACCENT         → drives the --color-gold token, re-skinning
 *                                      every button, active state and highlight
 *   NEXT_PUBLIC_BRAND_DOMAIN         → public links, footer, derived URLs/emails
 *   NEXT_PUBLIC_BRAND_LEGAL_NAME     → legal entity name (footer / legal pages)
 *   NEXT_PUBLIC_BRAND_TAGLINE        → sign-in screen sub-text
 *   NEXT_PUBLIC_BRAND_PHONE          → public display phone
 *   NEXT_PUBLIC_BRAND_PHONE_E164     → E.164 phone (tel: links, WhatsApp)
 *   NEXT_PUBLIC_BRAND_EMAIL          → public contact email
 *   NEXT_PUBLIC_BRAND_EMAIL_FROM     → display name on transactional email From
 *   NEXT_PUBLIC_BRAND_SUPPORT_EMAIL  → support contact
 *   NEXT_PUBLIC_BRAND_LEGAL_EMAIL    → legal contact
 *   NEXT_PUBLIC_BRAND_ADDRESS        → office address (footer, JSON-LD)
 *   NEXT_PUBLIC_BRAND_LEAD_PREFIX    → lead serial prefix (fresh databases only)
 *   NEXT_PUBLIC_BRAND_TIMEZONE       → IANA timezone of the operation
 *
 * All variables are NEXT_PUBLIC_* and are inlined at build time, so this
 * module is safe to import from both server and client components.
 *
 * Defaults below are the VENDOR (Entrestate) values — the platform's own
 * identity. This repo was forked from a client (Freehold), and for a while its
 * defaults were that client's, so any deployment that never set the env wore
 * the wrong company. The defaults now name the platform; a white-label client
 * sets NEXT_PUBLIC_BRAND_* to their own, and the Freehold client runs its own
 * deployment (ezz-ae/ORE) entirely. Claims that belong to a specific brokerage
 * (years in market, projects, clients, RERA licence) default to EMPTY and are
 * withheld unless a deployment sets them — the platform never ships another
 * company's unverifiable numbers.
 */

const env = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

export interface BrandConfig {
  /** Customer / brokerage display name, e.g. "Freehold". */
  company: string
  /** Product word that follows the company name, e.g. "Intelligence". */
  product: string
  /** Brand accent as a hex colour. Drives --color-gold across the product. */
  accent: string
  /** Public marketing domain (no protocol), e.g. "freeholdproperty.ae". */
  domain: string
  /** Legal entity name (footer / legal pages). */
  legalName: string
  /** Sign-in screen sub-text. */
  tagline: string
  /** Public display phone, e.g. "+971 50 417 3622". */
  phone: string
  /** E.164 phone for tel: links, e.g. "+971504173622". */
  phoneE164: string
  /** Digits-only phone for wa.me links (derived from phoneE164). */
  whatsappNumber: string
  /** Public contact email, e.g. "info@freeholdproperty.ae". */
  email: string
  /** Display name used on transactional email From headers. */
  emailFrom: string
  /** Support contact email. */
  supportEmail: string
  /** Legal contact email. */
  legalEmail: string
  /** Office address shown on public pages and structured data. */
  address: string
  /** Lead serial prefix, e.g. "FH" → FH-000123. Applies to fresh databases. */
  leadPrefix: string
  /** Public privacy-policy URL (derived from domain by default). */
  privacyUrl: string
  /** IANA timezone the operation runs in. */
  timezone: string
  /** Years in market, e.g. "19". A brokerage claim — empty ⇒ withheld. */
  yearsExperience: string
  /** Projects mapped, e.g. "3,500+". Prefer live data; empty ⇒ withheld. */
  projectsMapped: string
  /** Clients / investors served, e.g. "2,400+". Empty ⇒ withheld. */
  clientsServed: string
  /** RERA broker registration (ORN). The vendor platform is not a licensed
   *  brokerage, so this is empty ⇒ the "RERA licensed" claim is withheld. */
  reraOrn: string
}

const domain = env(process.env.NEXT_PUBLIC_BRAND_DOMAIN, 'entrestate.com')
const phoneE164 = env(process.env.NEXT_PUBLIC_BRAND_PHONE_E164, '+971504173622')

export const BRAND: BrandConfig = {
  company: env(process.env.NEXT_PUBLIC_BRAND_COMPANY, 'Entrestate'),
  product: env(process.env.NEXT_PUBLIC_BRAND_PRODUCT, 'Intelligence'),
  /* Entrestate's own accent — the blue of the third square in the tri-dot
   * wordmark. The previous default was #D4AF37, the FREEHOLD brand this repo
   * was forked from: a client's colour standing in as the platform's, so any
   * instance that never set the env wore the wrong company. Freehold's own
   * deployment sets NEXT_PUBLIC_BRAND_ACCENT and is unaffected. */
  accent: env(process.env.NEXT_PUBLIC_BRAND_ACCENT, '#3B82F6'),
  domain,
  legalName: env(process.env.NEXT_PUBLIC_BRAND_LEGAL_NAME, 'Entrestate'),
  tagline: env(process.env.NEXT_PUBLIC_BRAND_TAGLINE, 'Authorized Personnel Only'),
  phone: env(process.env.NEXT_PUBLIC_BRAND_PHONE, '+971 50 417 3622'),
  phoneE164,
  whatsappNumber: phoneE164.replace(/\D/g, ''),
  email: env(process.env.NEXT_PUBLIC_BRAND_EMAIL, `info@${domain}`),
  emailFrom: env(process.env.NEXT_PUBLIC_BRAND_EMAIL_FROM, 'Entrestate'),
  supportEmail: env(process.env.NEXT_PUBLIC_BRAND_SUPPORT_EMAIL, `support@${domain}`),
  legalEmail: env(process.env.NEXT_PUBLIC_BRAND_LEGAL_EMAIL, `legal@${domain}`),
  address: env(process.env.NEXT_PUBLIC_BRAND_ADDRESS, 'Business Bay, Dubai, UAE'),
  leadPrefix: env(process.env.NEXT_PUBLIC_BRAND_LEAD_PREFIX, 'FH'),
  privacyUrl: `https://${domain}/privacy`,
  timezone: env(process.env.NEXT_PUBLIC_BRAND_TIMEZONE, 'Asia/Dubai'),
  // Brokerage claims — empty by default so the platform never ships another
  // company's unverifiable numbers. A licensed-brokerage deployment sets them.
  yearsExperience: env(process.env.NEXT_PUBLIC_BRAND_YEARS, ''),
  projectsMapped: env(process.env.NEXT_PUBLIC_BRAND_PROJECTS, ''),
  clientsServed: env(process.env.NEXT_PUBLIC_BRAND_CLIENTS, ''),
  reraOrn: env(process.env.NEXT_PUBLIC_BRAND_RERA_ORN, ''),
}

/** Full product name, e.g. "Freehold Intelligence". */
export const brandName = `${BRAND.company} ${BRAND.product}`

/**
 * Client-safe public site URL: NEXT_PUBLIC_SITE_URL when set, otherwise
 * derived from the brand domain. Both are build-time inlined, so this works
 * identically in 'use client' components and on the server. (Server code that
 * must also honour deployment URLs like VERCEL_URL should prefer
 * getSiteUrl() from lib/site.ts.)
 */
export const getBrandSiteUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || `https://www.${BRAND.domain}`
  const withProtocol =
    raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`
  return withProtocol.replace(/\/$/, '')
}

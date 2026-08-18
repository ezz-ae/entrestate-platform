/**
 * The business site's map — one source of truth for the header, the footer,
 * the in-page "next" links and the sitemap. A page that exists but appears in
 * no nav is a page nobody reads, so every route lives here or not at all.
 */

export interface NavItem {
  href: string
  label: string
  /** One line, plain, shown in the mega-menu under the label. */
  blurb: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const PRODUCTS: NavItem[] = [
  {
    href: '/business/lead-machine',
    label: 'Lead Machine',
    blurb: 'Makes leads from your listings, then works them to the deal — the whole system, your brand.',
  },
  {
    // Renamed from Listing-to-Landing. The old path still resolves — a
    // permanent redirect in next.config.mjs, and the product door at
    // listing.entrestate.com (PRODUCT_DOORS in lib/tenancy/vendor-host.ts).
    href: '/business/mega-brokerage',
    label: 'Mega Brokerage Platform',
    blurb: 'Your public site and the desk behind it — one catalogue, a page per project, ads and CRM.',
  },
  {
    href: '/business/landing-pages',
    label: 'Landing Pages',
    blurb: 'A page per project, built from your own stock, with the form wired into the CRM.',
  },
  {
    href: '/business/meta-for-realtors',
    label: 'Meta for Realtors',
    blurb: 'A full system for professional Meta lead ads — our off-plan inventory, your budget, a few clicks.',
  },
]

export const PLATFORM: NavItem[] = [
  {
    href: '/business/platform/inventory',
    label: 'Inventory',
    blurb: 'Every project and unit, scored for whether it is fit to advertise.',
  },
  {
    href: '/business/platform/advertising',
    label: 'Advertising',
    blurb: 'Meta and Google campaigns, with hard limits on what can spend money.',
  },
  {
    href: '/business/platform/landing-pages',
    label: 'Landing pages',
    blurb: 'A page per property, and a gate that blocks weak ones from going live.',
  },
  {
    href: '/business/platform/creative',
    label: 'Creative',
    blurb: 'Ad sets, video and brochures produced from the listing you already have.',
  },
  {
    href: '/business/platform/crm',
    label: 'CRM',
    blurb: 'Where the lead lands, who owns it, and what happens in the first hour.',
  },
  {
    href: '/business/platform/intelligence',
    label: 'Intelligence',
    blurb: 'What the assistant reads, what it may act on, and what it is refused.',
  },
  {
    href: '/business/platform/analytics',
    label: 'Analytics & finance',
    blurb: 'Spend, pipeline, commission and the report you send upstairs.',
  },
]

export const COMPANY: NavItem[] = [
  {
    href: '/business/how-it-works',
    label: 'How it works',
    blurb: 'The full path from a listing to a closed deal, in order.',
  },
  {
    href: '/business/security',
    label: 'Security & control',
    blurb: 'Roles, tenant isolation, and the checks that run before any release.',
  },
  {
    href: '/business/pricing',
    label: 'Plans',
    blurb: 'What each product costs to run and what is included.',
  },
  {
    href: '/business/getting-started',
    label: 'Getting started',
    blurb: 'What the first thirty days look like, week by week.',
  },
  {
    href: '/business/contact',
    label: 'Talk to us',
    blurb: 'Ask about your own company, or a dedicated deployment.',
  },
  {
    href: '/business/docs',
    label: 'Learn',
    blurb: 'Short guides to how each part behaves, in plain broker language.',
  },
  {
    // The Decision Terminal is the family's data product — same repo now,
    // its own deployment. Absolute URL until terminal.entrestate.com resolves.
    href: 'https://m.entrestate.com',
    label: 'Decision Terminal',
    blurb: 'Dubai market intelligence on DLD data — scored projects, live signals.',
  },
]

/* ── Docs (the Learn layer) ─────────────────────────────────────────────── */

export const DOCS_HOME = '/business/docs'

/**
 * The five product branches plus setup. This taxonomy is product law — it
 * matches the onboarding, so a guide can never sit in a category the app
 * itself does not have.
 */
export const DOCS_CATEGORIES = [
  'CRM & brokers',
  'Inventory & pages',
  'Lead machine',
  'Creative studio',
  'Finance',
  'Getting set up',
] as const

export type DocsCategory = (typeof DOCS_CATEGORIES)[number]

export interface GuideItem extends NavItem {
  category: DocsCategory
}

export const GUIDES: GuideItem[] = [
  {
    href: '/business/docs/lead-flow',
    label: 'How leads flow',
    blurb: 'Four sources, one inbox, one duplicate check, and an owner for every lead.',
    category: 'CRM & brokers',
  },
  {
    href: '/business/docs/crm-day',
    label: 'Working the day',
    blurb: 'Stages, follow-ups, ranking by value, and finding a lead from a phone number.',
    category: 'CRM & brokers',
  },
  {
    href: '/business/docs/team-roles',
    label: 'Team and roles',
    blurb: 'Seven roles, who sees what, and manual versus automatic lead distribution.',
    category: 'CRM & brokers',
  },
  {
    href: '/business/docs/inventory',
    label: 'Stock and scores',
    blurb: 'The catalogue, the fit-to-advertise check, and what blocks a listing.',
    category: 'Inventory & pages',
  },
  {
    href: '/business/docs/landing-pages',
    label: 'Pages and the launch gate',
    blurb: 'A page per listing, what the gate checks, and why drafts stay invisible.',
    category: 'Inventory & pages',
  },
  {
    href: '/business/docs/launch-a-campaign',
    label: 'Launch a campaign',
    blurb: 'Four steps from choosing a listing to approving the plan. It starts paused.',
    category: 'Lead machine',
  },
  {
    href: '/business/docs/audiences',
    label: 'Audiences',
    blurb: 'Named audiences, lookalikes built from rated leads, and what never leaves your system.',
    category: 'Lead machine',
  },
  {
    href: '/business/docs/spend-rules',
    label: 'Budgets and spend rules',
    blurb: 'Templates, daily ceilings, only-if gates — with no rule, it spends nothing on its own.',
    category: 'Lead machine',
  },
  {
    href: '/business/docs/creative-studio',
    label: 'The studio',
    blurb: 'Every tool in one line each, from the Ad Designer to the library.',
    category: 'Creative studio',
  },
  {
    href: '/business/docs/reports',
    label: 'Reading the money',
    blurb: 'Commission against expenses, cost per lead and per deal, and agent cash.',
    category: 'Finance',
  },
  {
    href: '/business/docs/get-set-up',
    label: 'From signup to first lead',
    blurb: 'The first thirty days, week by week, as you would actually run them.',
    category: 'Getting set up',
  },
]

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Products', items: PRODUCTS },
  { label: 'Platform', items: PLATFORM },
  { label: 'Company', items: COMPANY },
]

/** Every business route, for the sitemap and for link checking. */
const internal = (i: NavItem) => i.href.startsWith('/')

export const ALL_BUSINESS_ROUTES: string[] = [
  '/business',
  ...PRODUCTS.map((i) => i.href),
  ...PLATFORM.map((i) => i.href),
  // The Terminal entry is an absolute URL to its own deployment — a nav door,
  // not a route of this app, so the sitemap and link checks must not see it.
  ...COMPANY.filter(internal).map((i) => i.href), // includes the docs hub via the Learn item
  ...GUIDES.map((i) => i.href),
]

/**
 * The guided reading path: home → products → how-it-works → the seven
 * platform chapters → security → pricing → getting-started → contact.
 * Derived from the arrays above so a renamed route cannot fall out of sync.
 */
export const TOUR: string[] = [
  '/business',
  ...PRODUCTS.map((i) => i.href),
  COMPANY[0].href, // how-it-works
  ...PLATFORM.map((i) => i.href),
  // security → pricing → getting-started → contact; docs are reference, not
  // tour stops, and the Terminal's external door never enters the tour.
  ...COMPANY.slice(1)
    .filter(internal)
    .map((i) => i.href)
    .filter((h) => h !== DOCS_HOME),
]

/**
 * The NavItem a page's NextStep card should point at. The last stop (contact)
 * loops out of the tour into the trial, so the path never dead-ends.
 */
export function nextInTour(href: string): NavItem | null {
  const at = TOUR.indexOf(href)
  if (at === -1) return null
  const next = TOUR[at + 1]
  if (!next) return { href: '/signup', label: 'Start a trial', blurb: '14 days. No card.' }
  const all = [...PRODUCTS, ...PLATFORM, ...COMPANY]
  return all.find((i) => i.href === next) ?? null
}

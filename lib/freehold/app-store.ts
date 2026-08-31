/**
 * THE ENTRESTATE APP STORE — what a company can BUY, laid over what exists.
 *
 * apps.ts answers "what workspaces exist and who may open them". That is a
 * navigation question. This file answers a different one: "what products do we
 * sell, and what does each one actually turn on?" Keeping them apart is the
 * whole design, for a reason this codebase has scars from:
 *
 *   A product is NOT an app. "Meta Ads Lite" and "Meta for Realtors" are two
 *   things to buy and ONE workspace to build. Modelling them as two AppDefs
 *   would mean two nav tabs, two route trees and two dashboards drifting apart
 *   the week after they ship — the built-twice pattern the app registry header
 *   already warns about. So a product names the app it unlocks and the
 *   CAPABILITIES it grants inside it; the surface reads the capabilities.
 *
 * Three rules the guard suite enforces, because each is a place this would rot:
 *
 *   1. LITE IS A SUBSET, NEVER A SECOND BUILD. A lite product's capabilities
 *      must be a strict subset of its full sibling's. The moment lite can do
 *      something full cannot, they are two products with two codebases and the
 *      cheaper one is quietly the better one.
 *   2. A LIVE PRODUCT POINTS AT A REAL APP. Selling a door that does not open
 *      is the worst failure a store can have, so `live` requires an appId that
 *      exists in APPS. A product whose workspace is not built yet is `planned`
 *      and says so — honestly, in the catalogue.
 *   3. EVERY CAPABILITY IS DECLARED. Capabilities are a closed union, not free
 *      strings, so a surface can never gate on a capability nothing grants.
 *
 * Pure data + pure helpers. No DB, no network. Billing, entitlement records and
 * the store UI all layer on top of this.
 */

import { APPS, type TenantPlan } from './apps'

/**
 * What a product can DO once bought. A closed union so a gate can never be
 * written against a capability no product grants (and so the guard can prove
 * lite ⊂ full).
 */
export type CapabilityId =
  // ── Meta ──
  | 'meta-campaigns'        // build, launch and manage Meta campaigns
  | 'meta-forms'            // Meta's own instant forms (NOT Leadformer — see below)
  | 'meta-audiences'        // saved/custom audience building
  | 'meta-lookalike'        // lookalike expansion from a list
  | 'meta-deep-analysis'    // placement/creative/audience analysis beyond the basics
  // ── Google ──
  | 'google-campaigns'      // search/display campaign management
  | 'google-automation'     // the self-running loop: keywords, bids, pausing
  // ── Landing pages ──
  | 'landing-generate'      // generate a page for a project
  | 'landing-edit'          // edit a generated or existing page
  | 'landing-own'           // the account OWNS what it generates — exportable, theirs
  // ── Assets ──
  | 'assets-store'          // the one store every upload lands in
  | 'assets-images'         // image library and organisation
  | 'assets-video'          // video library
  | 'assets-deploy'         // web deployments view
  // ── Calling ──
  | 'calling-templates'     // the seven call intents
  | 'calling-voice'         // a hired member places the call itself
  // ── Inventory ──
  | 'inventory-scored'      // the scored project/property book — quality-checked stock
  // ── Leadformer ──
  | 'leadform-conversational' // the form that talks back
  | 'leadform-team'           // the Visual Sales Team answers inside it

export type ProductTier = 'full' | 'lite'

/**
 * PHASE 4 OF THE ACCOUNT FOUNDATION — every app has its own economics. The
 * owner's ruling, in his words: "كل ابلكيشن له دنيته" — some ride on the
 * account, some burn coin, some subscribe. The mode is a catalog FACT the
 * store renders; the amounts stay where money already lives (the wallet, the
 * plans page) — a mode is not a price.
 *
 *   included      comes with the account — named for what it is, NEVER the
 *                 banned word (see BILLING_LABELS).
 *   tokens        runs on Ads Coin — the wallet is the meter, pay for what
 *                 works.
 *   subscription  a workspace product on a recurring plan.
 */
export type BillingMode = 'included' | 'tokens' | 'subscription'

/**
 * `live` — the workspace exists and the product can be sold today.
 * `planned` — the engine may exist, the workspace does not. Said plainly rather
 * than shipped as a nav tab that 404s.
 */
export type ProductStatus = 'live' | 'planned'

export interface StoreProduct {
  id: string
  name: string
  /** One line, the way it reads on the store card. */
  tagline: string
  /** The app workspace this unlocks. Required when live (rule 2). */
  appId: string | null
  tier: ProductTier
  status: ProductStatus
  capabilities: CapabilityId[]
  /** Which workspace plans may buy it. */
  plans: TenantPlan[]
  /** How this app charges — see BillingMode above. */
  billing: BillingMode
  /** Product ids that ship INSIDE this one ("الويب ديزاينر بينزل جواه الانفنتوري"). */
  includes?: string[]
  /** Product ids this one installs ONTO ("الانفنتوري بتنزل على جوجل ليد ماشين"). */
  installsOn?: string[]
  /** For a lite product: the full product it is a subset of (rule 1). */
  liteOf?: string
  /** Where the capability already lives in code, when it does — so nobody
   *  rebuilds an engine that is already written. */
  engine?: string
}

export const STORE: StoreProduct[] = [
  // ── Meta ─────────────────────────────────────────────────────────────────
  {
    id: 'meta-for-realtors',
    name: 'Meta for Realtors',
    tagline: 'Every Meta surface, organised — the whole set, in an order a person can follow.',
    appId: 'ads',
    billing: 'subscription',
    tier: 'full',
    status: 'live',
    capabilities: ['meta-campaigns', 'meta-forms', 'meta-audiences', 'meta-lookalike', 'meta-deep-analysis'],
    plans: ['company', 'realtor'],
    engine: 'lib/meta/* · lib/freehold/audience-pattern.ts · persona-audience.ts',
  },
  {
    id: 'meta-ads-lite',
    billing: 'subscription',
    name: 'Meta Ads Lite',
    tagline: 'One dashboard and quick widgets. Forms included — the deep audience work is not.',
    appId: 'ads',
    tier: 'lite',
    status: 'live',
    // Lite still has FORMS — "lite" means fewer levers, never a crippled core.
    // What it drops is the expansion and analysis work that needs the full desk.
    capabilities: ['meta-campaigns', 'meta-forms'],
    plans: ['company', 'realtor'],
    liteOf: 'meta-for-realtors',
    engine: 'lib/meta/*',
  },

  // ── Google ───────────────────────────────────────────────────────────────
  {
    id: 'google-ads',
    billing: 'subscription',
    name: 'Google Ads',
    tagline: 'Search and display, run properly — keywords, budgets and the competition view.',
    appId: 'ads',
    tier: 'full',
    status: 'live',
    capabilities: ['google-campaigns'],
    plans: ['company'],
    engine: 'lib/freehold/keyword-plan.ts · google-competition · search-harvest',
  },
  {
    id: 'google-lead-machine',
    // The self-running machine spends real money — the wallet is its meter.
    // It cannot run without a page per project, so Web Designer ships inside
    // it (the same reason it grants the landing capabilities below).
    billing: 'tokens',
    includes: ['web-designer'],
    name: 'Google Lead Machine',
    tagline: 'Self-running Google ads. Pick the projects; it needs a page for each, then it runs.',
    appId: 'ads',
    tier: 'full',
    status: 'live',
    // The landing capabilities are here on purpose: this product CANNOT run
    // without a page per project, so it grants the ability to make them rather
    // than failing at launch on a dependency the buyer never saw coming.
    capabilities: ['google-campaigns', 'google-automation', 'landing-generate', 'landing-edit', 'landing-own'],
    plans: ['company'],
    engine: 'lib/freehold/launch-readiness.ts · landing-preflight.ts · campaign-destination.ts',
  },

  // ── Making things ────────────────────────────────────────────────────────
  {
    id: 'web-designer',
    // The owner's example, verbatim: "الويب ديزاينر بينزل جواه الانفنتوري" —
    // a page needs stock to sell, so the scored book rides inside.
    billing: 'subscription',
    includes: ['inventory'],
    name: 'Web Designer',
    tagline: 'A page per project, generated and edited here — and the account owns what it makes.',
    appId: 'ai-manager',
    tier: 'full',
    status: 'live',
    capabilities: ['landing-generate', 'landing-edit', 'landing-own'],
    plans: ['company'],
    engine: 'lib/landing-pages.ts · landing-blocks.ts · front-layout.ts',
  },
  {
    id: 'creative-hub',
    billing: 'subscription',
    name: 'Creative Hub',
    tagline: 'Where the making tools live — video, ads and pages, in one workflow.',
    appId: 'creative-studio',
    tier: 'full',
    status: 'live',
    capabilities: ['assets-images', 'assets-video'],
    plans: ['company'],
    engine: 'app/freehold-intelligence/creative-studio · lib/freehold/creative-*.ts',
  },
  {
    id: 'assets',
    // The store of record comes with the account: an upload that costs extra
    // is an upload that lands somewhere else, and then there are two.
    billing: 'included',
    name: 'Assets',
    tagline: 'One home for everything uploaded anywhere — images, video, and what is deployed.',
    appId: 'drive',
    tier: 'full',
    status: 'live',
    // assets-store is the invariant, not a feature: EVERY upload surface writes
    // here. An upload that lands anywhere else is how a company ends up with
    // four half-libraries and no idea which image is live.
    capabilities: ['assets-store', 'assets-images', 'assets-video', 'assets-deploy'],
    plans: ['company', 'realtor'],
    engine: 'app/freehold-intelligence/drive · lib/freehold/blob-upload',
  },

  {
    id: 'inventory',
    name: 'Inventory',
    tagline: 'The scored property book — quality-checked stock, ready to sell from.',
    appId: 'inventory',
    tier: 'full',
    status: 'live',
    // The owner's example, verbatim: "الانفنتوري بتنزل على جوجل ليد ماشين" —
    // it installs ONTO the machine (stock feeds campaigns) and rides INSIDE
    // Web Designer (a page needs stock). Comes with the account: charging for
    // the book would tax every app that reads it.
    billing: 'included',
    installsOn: ['google-lead-machine'],
    capabilities: ['inventory-scored'],
    plans: ['company', 'realtor'],
    engine: 'lib/inventory-data.ts · lib/freehold/inventory-quality.ts · app/freehold-intelligence/inventory',
  },

  // ── Talking to leads ─────────────────────────────────────────────────────
  {
    id: 'lead-caller',
    // Calls are per-event work — coin is the honest meter.
    billing: 'tokens',
    name: 'Lead Caller',
    tagline: 'Seven reasons to call, and someone on the team who makes the call.',
    appId: null,
    tier: 'full',
    // The ENGINE exists — the seven intents and the voice personas are already
    // written — but there is no workspace yet. Said plainly rather than sold.
    status: 'planned',
    capabilities: ['calling-templates', 'calling-voice'],
    plans: ['company'],
    engine: 'lib/freehold/call-templates.ts (7 intents) · calling-rails.ts · visual-sales-team.ts',
  },
  {
    id: 'leadformer',
    billing: 'subscription',
    name: 'Leadformer',
    tagline: 'A form that talks back. Not a Meta form — your own, with your team inside it.',
    appId: null,
    tier: 'full',
    status: 'planned',
    // Deliberately does NOT grant meta-forms: Leadformer is the EXTERNAL form,
    // ours end to end. Meta's instant form is a different thing that happens to
    // share a word, and conflating them is how a buyer ends up thinking they
    // bought one when they bought the other.
    capabilities: ['leadform-conversational', 'leadform-team'],
    plans: ['company', 'realtor'],
    engine: 'lib/freehold/visual-sales-team.ts · visual-sales-routing.ts',
  },
]

/**
 * What each capability means, in the words a buyer would use.
 *
 * The union is the contract between products and surfaces; this is the same
 * union said out loud, because a storefront that lists "meta-lookalike" is
 * asking a broker to read a variable name. Kept beside the union rather than in
 * the page so a capability added later cannot ship without one — the guard
 * suite fails on a missing label.
 *
 * These are what the product DOES, never what it achieves: no figures, no
 * outcomes. Everything numeric this platform shows is evidence-gated
 * (lib/freehold/min-evidence.ts) and a catalogue is the last place to break that.
 */
/**
 * The billing mode in a buyer's words. 'included' is NAMED for what it is —
 * the owner's word ban holds here hardest of all: the store never says the
 * cheap word about the layer that comes with the account.
 */
export const BILLING_LABELS: Record<BillingMode, string> = {
  included: 'Comes with the account',
  tokens: 'Runs on coin — pay for what works',
  subscription: 'Subscription',
}

export const CAPABILITY_LABELS: Record<CapabilityId, string> = {
  'meta-campaigns': 'Build and run Meta campaigns',
  'meta-forms': "Meta's own instant forms",
  'meta-audiences': 'Saved and custom audiences',
  'meta-lookalike': 'Lookalike expansion from a list',
  'meta-deep-analysis': 'Placement, creative and audience analysis',
  'google-campaigns': 'Search and display campaigns',
  'inventory-scored': 'The scored property book — quality-checked stock to sell from',
  'google-automation': 'The self-running loop: keywords, bids, pausing',
  'landing-generate': 'Generate a page for a project',
  'landing-edit': 'Edit any page it generates',
  'landing-own': 'You own what it makes — exportable, yours',
  'assets-store': 'One store every upload lands in',
  'assets-images': 'Image library',
  'assets-video': 'Video library',
  'assets-deploy': 'What is deployed, and where',
  'calling-templates': 'The seven reasons to call',
  'calling-voice': 'A hired member places the call',
  'leadform-conversational': 'A form that talks back',
  'leadform-team': 'Your Visual Sales Team answers inside it',
}

export const capabilityLabel = (c: CapabilityId): string => CAPABILITY_LABELS[c] ?? c

export const productIds = (): string[] => STORE.map((p) => p.id)
export const getProduct = (id: string): StoreProduct | undefined => STORE.find((p) => p.id === id)
export const liveProducts = (): StoreProduct[] => STORE.filter((p) => p.status === 'live')
export const plannedProducts = (): StoreProduct[] => STORE.filter((p) => p.status === 'planned')

/** Products a given workspace plan may buy. */
export function productsForPlan(plan: TenantPlan): StoreProduct[] {
  return STORE.filter((p) => p.plans.includes(plan))
}

/** Products that unlock a given app workspace. */
export function productsForApp(appId: string): StoreProduct[] {
  return STORE.filter((p) => p.appId === appId)
}

/**
 * Everything an account can do, given the products it owns. The union across
 * products — buying lite AND full is simply the full set, never a conflict.
 */
export function grantedCapabilities(ownedProductIds: string[]): Set<CapabilityId> {
  const out = new Set<CapabilityId>()
  for (const id of ownedProductIds) {
    const p = getProduct(id)
    if (!p) continue
    for (const c of p.capabilities) out.add(c)
  }
  return out
}

/** Whether the owned products grant this capability — the one gate a surface
 *  should ask. Surfaces gate on CAPABILITIES, never on product ids, so adding a
 *  bundle later cannot require touching every screen. */
export function can(ownedProductIds: string[], capability: CapabilityId): boolean {
  return grantedCapabilities(ownedProductIds).has(capability)
}

export interface StoreProblem {
  productId: string
  problem: string
}

/**
 * Validate the catalogue against the three rules. Run by the guard suite so a
 * badly-shaped product fails in CI rather than in a customer's store page.
 */
export function validateStore(products: StoreProduct[] = STORE): StoreProblem[] {
  const problems: StoreProblem[] = []
  const appIds = new Set(APPS.map((a) => a.id))
  const seen = new Set<string>()

  for (const p of products) {
    if (seen.has(p.id)) problems.push({ productId: p.id, problem: 'duplicate product id' })
    seen.add(p.id)

    // Rule 2 — a live product opens a real door.
    if (p.status === 'live') {
      if (!p.appId) problems.push({ productId: p.id, problem: 'live product has no appId' })
      else if (!appIds.has(p.appId)) problems.push({ productId: p.id, problem: `appId "${p.appId}" is not in APPS` })
    }
    if (p.capabilities.length === 0) problems.push({ productId: p.id, problem: 'grants no capabilities' })
    if (p.plans.length === 0) problems.push({ productId: p.id, problem: 'no plan can buy it' })

    // Phase 4 — the economics fields point at real products, never at air.
    for (const ref of p.includes ?? []) {
      if (ref === p.id) problems.push({ productId: p.id, problem: 'includes itself' })
      else if (!products.some((x) => x.id === ref)) problems.push({ productId: p.id, problem: `includes "${ref}" which does not exist` })
    }
    for (const ref of p.installsOn ?? []) {
      if (ref === p.id) problems.push({ productId: p.id, problem: 'installs onto itself' })
      else if (!products.some((x) => x.id === ref)) problems.push({ productId: p.id, problem: `installsOn "${ref}" which does not exist` })
    }

    // Rule 1 — lite is a strict subset of its full sibling.
    if (p.tier === 'lite') {
      if (!p.liteOf) { problems.push({ productId: p.id, problem: 'lite product does not name its full sibling' }); continue }
      const full = products.find((x) => x.id === p.liteOf)
      if (!full) { problems.push({ productId: p.id, problem: `liteOf "${p.liteOf}" does not exist` }); continue }
      const fullCaps = new Set(full.capabilities)
      const extra = p.capabilities.filter((c) => !fullCaps.has(c))
      if (extra.length > 0) {
        problems.push({ productId: p.id, problem: `lite grants what full does not: ${extra.join(', ')}` })
      }
      if (p.capabilities.length >= full.capabilities.length) {
        problems.push({ productId: p.id, problem: 'lite is not smaller than full' })
      }
    } else if (p.liteOf) {
      problems.push({ productId: p.id, problem: 'a full product must not name a liteOf' })
    }
  }
  return problems
}

/**
 * THE FRONT PAGES, FINALLY ARRANGEABLE.
 *
 * /lp/[slug] has had reorderable blocks, a canvas editor and a publish
 * workflow for a long time; the site's own front pages — home, about,
 * services, contact — stayed hardcoded JSX where only registered TEXT fields
 * (lib/freehold/site-content.ts) could change. Rearranging the homepage, or
 * recoloring it for a white-label tenant, meant a deploy.
 *
 * This module gives each front page a LAYOUT: the page's real sections as
 * named, reorderable, hideable items, plus generic content blocks (heading,
 * text, stats, CTA, FAQ) that can be inserted between them, plus one palette
 * choice for the branded surfaces. Web Studio → Page Builder edits a DRAFT;
 * publishing copies it live; unpublishing returns the page to the code.
 *
 * THE FALLBACK IS THE CODE — same law as site-content.ts. No row, no DB,
 * a broken row, an empty items list: the page renders exactly as built, in
 * the order the JSX defines, in the colors it shipped with. The public site
 * must never white-screen because a layout row is bad, so the published
 * reader swallows everything and returns null.
 *
 * THE REGISTRIES ARE THE CONTRACT. A section key not in FRONT_SECTIONS does
 * not exist; a block type not in FRONT_BLOCKS does not exist; a data key not
 * in the block's field list does not exist. And sections the layout does not
 * mention are APPENDED VISIBLE — when the code grows a new section, every
 * published layout shows it rather than silently amputating it.
 *
 * Labels here are plain English on purpose — the same deliberate choice
 * ContentField.label documents: this is the name of an English section on an
 * English page, content-editing chrome, not app chrome.
 */
import { query, ensureOnce as dbEnsureOnce } from '@/lib/db'

export type FrontPage = 'home' | 'about' | 'services' | 'contact'

export interface FrontSectionDef {
  key: string
  label: string
  hint: string
}

/** Every real section of every front page, in its built-in order. The guard
 *  suite asserts each key actually renders in the page's sections map, so a
 *  registered-but-unrendered key cannot silently drop a section. */
export const FRONT_SECTIONS: Record<FrontPage, FrontSectionDef[]> = {
  home: [
    { key: 'mobileEntry',  label: 'Mobile welcome',        hint: 'Phone-only hero with AI prompt shortcuts' },
    { key: 'mobileLinks',  label: 'Mobile quick links',    hint: 'Phone-only browse chips (areas, projects)' },
    { key: 'hero',         label: 'Hero',                  hint: 'Desktop hero with motion + AI search' },
    { key: 'developers',   label: 'Developer strip',       hint: '"Authorized dealer for" marquee' },
    { key: 'intelligence', label: 'Market intelligence',   hint: 'Live data intelligence block' },
    { key: 'featured',     label: 'Featured properties',   hint: 'Curated property cards' },
    { key: 'market',       label: 'Market snapshot',       hint: 'Yields, volumes and price trends' },
    { key: 'advantage',    label: 'Advantage grid',        hint: 'AI advisory / confidence / RERA bento' },
    { key: 'trust',        label: 'Trust band',            hint: 'Cream band: expertise, execution' },
    { key: 'advisory',     label: 'Advisory + callback',   hint: 'Three steps and the callback form' },
    { key: 'blog',         label: 'Insights',              hint: 'Latest blog posts' },
    { key: 'cta',          label: 'Final CTA',             hint: 'Closing call to action' },
  ],
  about: [
    { key: 'hero',       label: 'Hero',              hint: 'Title, intro, headline stats, quote card' },
    { key: 'mission',    label: 'Mission & vision',  hint: 'Two editorial chapter cards' },
    { key: 'principles', label: 'Principles',        hint: 'Three numbered principles on cream' },
    { key: 'stats',      label: 'Stats showcase',    hint: 'Dark numeric track record' },
    { key: 'cta',        label: 'Final CTA',         hint: 'Talk to the conviction desk' },
  ],
  services: [
    { key: 'hero',     label: 'Hero',          hint: 'Title and subtitle' },
    { key: 'services', label: 'Service grid',  hint: 'Eight service cards with features' },
    { key: 'why',      label: 'Why us',        hint: 'Three numbered reasons, dark' },
    { key: 'cta',      label: 'Final CTA',     hint: 'Book a consultation' },
  ],
  contact: [
    { key: 'hero',     label: 'Hero',            hint: 'Title and subtitle' },
    { key: 'channels', label: 'Contact channels', hint: 'WhatsApp / call / email / Instagram cards' },
    { key: 'form',     label: 'Office + form',    hint: 'Address, hours, and the enquiry form' },
    { key: 'cta',      label: 'Explore strip',    hint: 'Chat / projects / areas buttons' },
  ],
}

export const FRONT_PAGES = Object.keys(FRONT_SECTIONS) as FrontPage[]

export interface BlockField {
  key: string
  label: string
  kind: 'text' | 'textarea' | 'select'
  options?: string[]
  placeholder?: string
}

export interface FrontBlockDef {
  label: string
  hint: string
  fields: BlockField[]
}

/** Tone every generic block understands: which of the page's two surfaces it
 *  sits on. 'dark' = the branded dark surface, 'light' = the cream one. */
const TONE_FIELD: BlockField = { key: 'tone', label: 'Surface', kind: 'select', options: ['dark', 'light'] }

export const FRONT_BLOCKS: Record<string, FrontBlockDef> = {
  heading: {
    label: 'Heading',
    hint: 'Eyebrow + big title + optional subtitle',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text', placeholder: 'Small uppercase line' },
      { key: 'title', label: 'Title', kind: 'text', placeholder: 'The big line' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea', placeholder: 'One supporting sentence' },
      TONE_FIELD,
    ],
  },
  text: {
    label: 'Text',
    hint: 'A titled paragraph',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'body', label: 'Body', kind: 'textarea' },
      TONE_FIELD,
    ],
  },
  stats: {
    label: 'Stats row',
    hint: 'Up to four number + label pairs',
    fields: [
      { key: 's1v', label: 'Stat 1 — value', kind: 'text', placeholder: '19 yrs' },
      { key: 's1l', label: 'Stat 1 — label', kind: 'text', placeholder: 'in the Dubai market' },
      { key: 's2v', label: 'Stat 2 — value', kind: 'text' },
      { key: 's2l', label: 'Stat 2 — label', kind: 'text' },
      { key: 's3v', label: 'Stat 3 — value', kind: 'text' },
      { key: 's3l', label: 'Stat 3 — label', kind: 'text' },
      { key: 's4v', label: 'Stat 4 — value', kind: 'text' },
      { key: 's4l', label: 'Stat 4 — label', kind: 'text' },
      TONE_FIELD,
    ],
  },
  cta: {
    label: 'Call to action',
    hint: 'Title, sentence, one or two buttons',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'body', label: 'Body', kind: 'textarea' },
      { key: 'buttonLabel', label: 'Button label', kind: 'text', placeholder: 'Schedule Consultation' },
      { key: 'buttonHref', label: 'Button link', kind: 'text', placeholder: '/contact' },
      { key: 'secondaryLabel', label: 'Second button label', kind: 'text' },
      { key: 'secondaryHref', label: 'Second button link', kind: 'text' },
      TONE_FIELD,
    ],
  },
  faq: {
    label: 'FAQ',
    hint: 'Up to four question + answer pairs',
    fields: [
      { key: 'q1', label: 'Question 1', kind: 'text' },
      { key: 'a1', label: 'Answer 1', kind: 'textarea' },
      { key: 'q2', label: 'Question 2', kind: 'text' },
      { key: 'a2', label: 'Answer 2', kind: 'textarea' },
      { key: 'q3', label: 'Question 3', kind: 'text' },
      { key: 'a3', label: 'Answer 3', kind: 'textarea' },
      { key: 'q4', label: 'Question 4', kind: 'text' },
      { key: 'a4', label: 'Answer 4', kind: 'textarea' },
      TONE_FIELD,
    ],
  },
}

export interface FrontItem {
  id: string
  kind: 'section' | 'block'
  type: string
  hidden?: boolean
  data?: Record<string, string>
}

export interface FrontLayout {
  items: FrontItem[]
  palette: string
}

export interface FrontPalette {
  key: string
  label: string
  /** The branded dark surface (deep green today). */
  dark: string
  /** The warm light band (cream today). */
  cream: string
  /** The accent (gold today) and its soft variant. */
  accent: string
  accentSoft: string
}

/**
 * The first palette IS the shipped design — its hexes are the exact values
 * the pages hardcoded before the builder existed, so "no palette chosen"
 * and "emerald" render byte-identically. The guard asserts those hexes.
 * Theme-token surfaces (bg-background / bg-foreground / text-primary) keep
 * following the tenant theme; the palette recolors the branded surfaces.
 */
export const FRONT_PALETTES: FrontPalette[] = [
  { key: 'emerald',  label: 'Emerald & Gold',    dark: '#0A1F17', cream: '#F2EFE8', accent: '#D4AC50', accentSoft: '#F0D792' },
  { key: 'midnight', label: 'Midnight & Ice',    dark: '#0A1626', cream: '#EDF0F5', accent: '#6E9BD1', accentSoft: '#A9C6E8' },
  { key: 'onyx',     label: 'Onyx & Silver',     dark: '#111113', cream: '#F1EFEA', accent: '#B9BDC7', accentSoft: '#D9DCE2' },
  { key: 'burgundy', label: 'Burgundy & Copper', dark: '#26090D', cream: '#F5EFE8', accent: '#C98A4B', accentSoft: '#E3B98A' },
  { key: 'royal',    label: 'Royal & Orchid',    dark: '#170F2E', cream: '#F2EFF7', accent: '#B79BE0', accentSoft: '#D6C6EF' },
]

export const DEFAULT_PALETTE = FRONT_PALETTES[0].key

export function paletteByKey(key: string): FrontPalette {
  return FRONT_PALETTES.find((p) => p.key === key) ?? FRONT_PALETTES[0]
}

/** CSS custom properties the fp-* utilities in globals.css consume. */
export function paletteVars(key: string): Record<string, string> {
  const p = paletteByKey(key)
  return {
    '--fp-dark': p.dark,
    '--fp-cream': p.cream,
    '--fp-accent': p.accent,
    '--fp-accent-soft': p.accentSoft,
  }
}

export function defaultFrontLayout(page: FrontPage): FrontLayout {
  return {
    items: FRONT_SECTIONS[page].map((s) => ({ id: `s_${s.key}`, kind: 'section', type: s.key })),
    palette: DEFAULT_PALETTE,
  }
}

// Long enough for a paragraph, short enough that a hostile save cannot park
// megabytes in a jsonb column the public page parses on every request.
const MAX_VALUE = 2000
const MAX_ITEMS = 60

/**
 * The purifier every read and write goes through. Pure — the guard suite
 * feeds it hostile shapes. Rules, each load-bearing:
 *   - unknown section keys and block types are DROPPED (the registry is the
 *     contract);
 *   - duplicate sections keep their first appearance only (a section is a
 *     singleton — two heros is a corrupted row, not a feature);
 *   - sections the layout does not mention are APPENDED VISIBLE (new code
 *     must show up, not vanish under an old layout);
 *   - block data is projected onto the block's registered fields, trimmed
 *     and length-capped;
 *   - an unknown palette falls back to the shipped one.
 */
export function sanitizeFrontLayout(page: FrontPage, raw: unknown): FrontLayout {
  const sectionKeys = new Set(FRONT_SECTIONS[page].map((s) => s.key))
  const seenSections = new Set<string>()
  const items: FrontItem[] = []

  const rawItems = raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)
    ? ((raw as { items: unknown[] }).items)
    : []

  for (const entry of rawItems.slice(0, MAX_ITEMS)) {
    if (!entry || typeof entry !== 'object') continue
    const it = entry as Record<string, unknown>
    const kind = it.kind === 'section' ? 'section' : it.kind === 'block' ? 'block' : null
    const type = typeof it.type === 'string' ? it.type : ''
    if (!kind || !type) continue

    if (kind === 'section') {
      if (!sectionKeys.has(type) || seenSections.has(type)) continue
      seenSections.add(type)
      items.push({ id: `s_${type}`, kind, type, hidden: it.hidden === true })
      continue
    }

    const def = FRONT_BLOCKS[type]
    if (!def) continue
    const rawData = it.data && typeof it.data === 'object' ? (it.data as Record<string, unknown>) : {}
    const data: Record<string, string> = {}
    for (const f of def.fields) {
      const v = rawData[f.key]
      if (typeof v !== 'string' || !v.trim()) continue
      const trimmed = v.trim().slice(0, MAX_VALUE)
      if (f.kind === 'select' && f.options && !f.options.includes(trimmed)) continue
      data[f.key] = trimmed
    }
    const id = typeof it.id === 'string' && /^[\w-]{1,40}$/.test(it.id) ? it.id : `b_${items.length}`
    items.push({ id, kind, type, hidden: it.hidden === true, data })
  }

  for (const s of FRONT_SECTIONS[page]) {
    if (!seenSections.has(s.key)) items.push({ id: `s_${s.key}`, kind: 'section', type: s.key })
  }

  const rawPalette = raw && typeof raw === 'object' ? (raw as { palette?: unknown }).palette : undefined
  const palette = typeof rawPalette === 'string' && FRONT_PALETTES.some((p) => p.key === rawPalette)
    ? rawPalette
    : DEFAULT_PALETTE

  return { items, palette }
}

// ── Store ───────────────────────────────────────────────────────────────────

async function ensure() {
  await query(`
    CREATE TABLE IF NOT EXISTS freehold_front_layouts (
      page       text PRIMARY KEY,
      draft      jsonb,
      published  jsonb,
      updated_by text,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
}
const ensureOnce = () => dbEnsureOnce('freehold_front_layouts', ensure)

/**
 * What the PUBLIC page renders. Null on any failure or absence — and null
 * means "the code's own order and colors", never an error page. This is the
 * public-page-resilience rule enforced at the reader, where it belongs.
 */
export async function getPublishedFrontLayout(page: FrontPage): Promise<FrontLayout | null> {
  try {
    await ensureOnce()
    const rows = await query<{ published: unknown }>(
      `SELECT published FROM freehold_front_layouts WHERE page = $1`,
      [page],
    )
    const raw = rows[0]?.published
    if (!raw || typeof raw !== 'object') return null
    return sanitizeFrontLayout(page, raw)
  } catch {
    return null
  }
}

export interface FrontEditorState {
  page: FrontPage
  draft: FrontLayout
  /** Whether a published layout exists (null published = the coded page). */
  live: boolean
}

/** The editor's view: the working draft (falling back to what is live, then
 *  to the built-in order) and whether anything is published at all. */
export async function getFrontEditorState(page: FrontPage): Promise<FrontEditorState> {
  await ensureOnce()
  const rows = await query<{ draft: unknown; published: unknown }>(
    `SELECT draft, published FROM freehold_front_layouts WHERE page = $1`,
    [page],
  )
  const row = rows[0]
  const source = row?.draft ?? row?.published
  return {
    page,
    draft: source ? sanitizeFrontLayout(page, source) : defaultFrontLayout(page),
    live: Boolean(row?.published),
  }
}

export async function saveFrontDraft(page: FrontPage, raw: unknown, by: string): Promise<FrontLayout> {
  if (!FRONT_SECTIONS[page]) throw new Error(`Unknown page: ${page}`)
  await ensureOnce()
  const clean = sanitizeFrontLayout(page, raw)
  await query(
    `INSERT INTO freehold_front_layouts (page, draft, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, now())
     ON CONFLICT (page) DO UPDATE SET draft = $2::jsonb, updated_by = $3, updated_at = now()`,
    [page, JSON.stringify(clean), by],
  )
  return clean
}

/** Publish = the draft becomes the live layout. No draft saved yet → the
 *  built-in order is published (a valid, explicit choice). */
export async function publishFront(page: FrontPage, by: string): Promise<void> {
  await ensureOnce()
  const state = await getFrontEditorState(page)
  await query(
    `INSERT INTO freehold_front_layouts (page, draft, published, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $2::jsonb, $3, now())
     ON CONFLICT (page) DO UPDATE SET draft = $2::jsonb, published = $2::jsonb, updated_by = $3, updated_at = now()`,
    [page, JSON.stringify(state.draft), by],
  )
}

/** Back to the code: the page renders exactly as built. The draft survives,
 *  so unpublish is reversible by publishing again. */
export async function unpublishFront(page: FrontPage, by: string): Promise<void> {
  await ensureOnce()
  await query(
    `UPDATE freehold_front_layouts SET published = NULL, updated_by = $2, updated_at = now() WHERE page = $1`,
    [page, by],
  )
}

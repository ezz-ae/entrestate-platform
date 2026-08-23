// Day / night theming + accent palettes for the public landing page at
// app/lp/[slug]/page.tsx.
//
// The palette is threaded through the (server-rendered) page the same way the
// trilingual `L` dict and `dir` are. Structural colors (page/section
// backgrounds, card surfaces, borders, and the primary/muted/faint text ramp)
// are driven from `lpPalette(theme)` via inline styles. Semantic colors
// (WhatsApp green, amber draft banner) are identical in both themes.
//
// ACCENTS (the builder's "بالتة ألوان") and TYPEFACES (the "finish"): each
// landing page may pick one accent palette from LP_ACCENTS and one heading
// typeface from LP_TYPEFACES; both picks are stored on the page row and applied
// as CSS custom properties on the page root (lpAccentVars / lpTypefaceVars), so
// every gold-derived shade retints and every heading reflows in one place.
// Three rules, same spirit as the front-page builder
// (lib/freehold/front-layout.ts):
//   1. THE REGISTRY IS THE CONTRACT — an unknown / empty key resolves to null
//      and null means "no override": the page renders exactly as before the
//      picker existed (--color-gold = BRAND.accent, every shade var absent so
//      the shipped hex fallbacks apply).
//   2. NO PICK RENDERS TODAY'S PAGE — the `gold` entry's shades ARE the hexes
//      the page hardcoded before accents existed; the guard
//      (scripts/lp-accent-test.ts) pins them against the page source.
//   3. THE DEFAULT WASH IS THE SHIPPED STRING — a chosen accent only swaps the
//      212,175,55 gold wash inside the shipped gradient strings; with no
//      accent the strings are returned untouched, byte-identical.

import { BRAND } from "@/lib/freehold/brand"

export type LpTheme = "day" | "night"

/** One pickable accent palette: the accent plus the exact derived shades the
    page's section components use (CTA hover, payment-stage ramp, units bands,
    day-mode readable text). The `gold` entry restates the pre-accent hexes. */
export interface LpAccent {
  key: string
  /** Swatch color shown in the editor picker (same as accent). */
  accent: string
  /** Hover state of accent-filled CTAs (was #E8C547). */
  bright: string
  /** Units-band third color (was #C9A227). */
  mid: string
  /** Payment stage 2 / units band 1 (was #9B8020). */
  deep: string
  /** Payment stage 3 (was #6B5A15). */
  dark: string
  /** Payment stage 4 (was #3D330B). */
  darkest: string
  /** Day-theme readable accent for text (was #8E6D1A). */
  dayText: string
}

// Every entry hand-tuned as a five-step ramp of its accent, matching the
// relative lightness of the shipped gold ramp — never generated at runtime,
// so a palette is a design decision, not a formula.
export const LP_ACCENTS: readonly LpAccent[] = [
  { key: "gold",     accent: "#D4AF37", bright: "#E8C547", mid: "#C9A227", deep: "#9B8020", dark: "#6B5A15", darkest: "#3D330B", dayText: "#8E6D1A" },
  { key: "emerald",  accent: "#2FA36B", bright: "#45C285", mid: "#2B9663", deep: "#1F7A4D", dark: "#14573A", darkest: "#0B3524", dayText: "#176A43" },
  { key: "lagoon",   accent: "#2DB4BE", bright: "#4CD3DC", mid: "#29A5AE", deep: "#1F858D", dark: "#145C62", darkest: "#0A3538", dayText: "#14707A" },
  { key: "sapphire", accent: "#3B82F6", bright: "#60A5FA", mid: "#3573DB", deep: "#2456C4", dark: "#1A3E8C", darkest: "#0F2452", dayText: "#1D4FB8" },
  { key: "burgundy", accent: "#A63A50", bright: "#C25A70", mid: "#98354A", deep: "#7C2A3C", dark: "#571E2B", darkest: "#33121A", dayText: "#8C2F41" },
]

/** Walkable key list — enumerated in scripts/dynamic-keys-test.ts for the
    editor's computed `lpe.palette.${key}` labels. */
export const LP_ACCENT_KEYS = LP_ACCENTS.map((a) => a.key)

/** Unknown, empty or junk → null, and null means "brand default, no override". */
export function resolveLpAccent(key: unknown): LpAccent | null {
  const raw = Array.isArray(key) ? key[0] : key
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : ""
  return LP_ACCENTS.find((a) => a.key === s) ?? null
}

/** One pickable heading typeface — the other half of the "finish". The stack
    references next/font CSS variables (the real hashed families next/font sets
    on <body>), always ending with the Arabic face + a generic, so an Arabic
    heading in a Latin display font falls per-glyph to Cairo rather than the OS. */
export interface LpTypeface {
  key: string
  /** CSS font-family value for the page's h1/h2/h3. */
  stack: string
}

// The DEFAULT is no pick → headings keep --font-sans (Inter), exactly the page
// before the picker existed. Each entry here is an explicit departure from that.
export const LP_TYPEFACES: readonly LpTypeface[] = [
  { key: "classic",   stack: 'var(--font-serif), var(--font-ad-ar), Georgia, serif' },
  { key: "editorial", stack: 'var(--font-lp-editorial), var(--font-ad-ar), Georgia, serif' },
  { key: "architect", stack: 'var(--font-lp-architect), var(--font-ad-ar), system-ui, sans-serif' },
]

/** Walkable key list — enumerated in scripts/dynamic-keys-test.ts. */
export const LP_TYPEFACE_KEYS = LP_TYPEFACES.map((t) => t.key)

/** Unknown / empty / junk → null, and null means "default headings (Inter)". */
export function resolveLpTypeface(key: unknown): LpTypeface | null {
  const raw = Array.isArray(key) ? key[0] : key
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : ""
  return LP_TYPEFACES.find((t) => t.key === s) ?? null
}

/**
 * CSS custom property for the page root. No typeface → nothing set, so the
 * scoped `h1,h2,h3 { font-family: var(--lp-heading-font, inherit) }` rule
 * resolves to `inherit` — headings keep the body's --font-sans, unchanged.
 */
export function lpTypefaceVars(typeface: LpTypeface | null): Record<string, string> {
  return typeface ? { "--lp-heading-font": typeface.stack } : {}
}

/** "#D4AF37" → "212,175,55" (for rgba() washes inside gradient strings). */
function hexWash(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return "212,175,55"
  const n = parseInt(m[1], 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

/**
 * CSS custom properties for the page root. No accent → exactly what the page
 * set before the picker existed: --color-gold = BRAND.accent, nothing else
 * (all shade vars absent, so their shipped-hex fallbacks apply).
 */
export function lpAccentVars(accent: LpAccent | null): Record<string, string> {
  if (!accent) return { "--color-gold": BRAND.accent }
  return {
    "--color-gold": accent.accent,
    "--lp-gold-bright": accent.bright,
    "--lp-gold-mid": accent.mid,
    "--lp-gold-deep": accent.deep,
    "--lp-gold-dark": accent.dark,
    "--lp-gold-darkest": accent.darkest,
    "--lp-gold-day-text": accent.dayText,
  }
}

export interface LpPalette {
  /** Root page background. */
  bg: string
  /** Alternating (slightly offset) section background. */
  bgAlt: string
  /** Decorative hero background when no project image is present. */
  bgGradient: string
  /** Card / panel fill. */
  surface: string
  /** Stronger inner-chip / nested fill. */
  surfaceStrong: string
  /** Card / panel border. */
  surfaceBorder: string
  /** Hairline section dividers (border-t between sections, footer rules). */
  divider: string
  /** Primary text (headings). */
  textPrimary: string
  /** Body / secondary text. */
  textMuted: string
  /** Faint labels, captions, disclaimers. */
  textFaint: string
  /** Side gradient laid over a hero image. */
  heroOverlaySide: string
  /** Bottom fade gradient laid over a hero image. */
  heroOverlayBottom: string
  /** Fixed topbar background (translucent). */
  topbarBg: string
  /** Inline hero form / lead-form card background. */
  formBg: string
  /** Input field fill inside forms. */
  inputBg: string
  /** Placeholder / very faint text. */
  placeholder: string
}

const NIGHT: LpPalette = {
  bg: "#06070C",
  bgAlt: "#0A0D16",
  bgGradient:
    "radial-gradient(ellipse 100% 80% at 20% 50%, rgba(212,175,55,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 60% at 80% 20%, rgba(100,120,200,0.08) 0%, transparent 50%), linear-gradient(135deg, #06070C 0%, #0A0D18 50%, #06070C 100%)",
  surface: "rgba(255,255,255,0.02)",
  surfaceStrong: "rgba(255,255,255,0.05)",
  surfaceBorder: "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.06)",
  textPrimary: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.35)",
  heroOverlaySide:
    "linear-gradient(to right, rgba(6,7,12,0.95) 0%, rgba(6,7,12,0.80) 50%, rgba(6,7,12,0.60) 100%)",
  heroOverlayBottom:
    "linear-gradient(to top, #06070C 0%, transparent 60%, transparent 100%)",
  topbarBg: "rgba(6,7,12,0.95)",
  formBg: "rgba(10,13,24,0.90)",
  inputBg: "rgba(255,255,255,0.03)",
  placeholder: "rgba(255,255,255,0.20)",
}

// Polished light "luxury" palette: warm off-white paper, near-black ink, soft
// warm borders — the SAME gold accent as night.
const DAY: LpPalette = {
  bg: "#F7F5F0",
  bgAlt: "#EFEADF",
  bgGradient:
    "radial-gradient(ellipse 100% 80% at 20% 50%, rgba(212,175,55,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 60% at 80% 20%, rgba(120,110,80,0.06) 0%, transparent 50%), linear-gradient(135deg, #F7F5F0 0%, #FBFAF6 50%, #F0EBE0 100%)",
  surface: "#FFFFFF",
  surfaceStrong: "rgba(11,11,15,0.07)",
  surfaceBorder: "rgba(11,11,15,0.16)",
  divider: "rgba(11,11,15,0.12)",
  textPrimary: "#0B0B0F",
  textMuted: "rgba(11,11,15,0.74)",
  textFaint: "rgba(11,11,15,0.58)",
  heroOverlaySide:
    "linear-gradient(to right, rgba(247,245,240,0.96) 0%, rgba(247,245,240,0.82) 50%, rgba(247,245,240,0.55) 100%)",
  heroOverlayBottom:
    "linear-gradient(to top, #F7F5F0 0%, transparent 60%, transparent 100%)",
  topbarBg: "rgba(247,245,240,0.95)",
  formBg: "rgba(255,255,255,0.94)",
  inputBg: "rgba(11,11,15,0.03)",
  placeholder: "rgba(11,11,15,0.42)",
}

// "Lagoon" palette for the Signature template — a cool, aqua-tinted atmosphere
// (turquoise water + the same gold accent) that reads as a premium waterfront /
// branded community, visibly distinct from the warm default without touching
// the gold accent baked into the section components.
const SIGNATURE_NIGHT: LpPalette = {
  bg: "#04090C",
  bgAlt: "#07131A",
  bgGradient:
    "radial-gradient(ellipse 100% 80% at 20% 50%, rgba(45,180,190,0.16) 0%, transparent 55%), radial-gradient(ellipse 60% 60% at 80% 20%, rgba(212,175,55,0.08) 0%, transparent 50%), linear-gradient(135deg, #04090C 0%, #07141C 50%, #04090C 100%)",
  surface: "rgba(255,255,255,0.02)",
  surfaceStrong: "rgba(255,255,255,0.05)",
  surfaceBorder: "rgba(120,220,225,0.12)",
  divider: "rgba(120,220,225,0.08)",
  textPrimary: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.35)",
  heroOverlaySide:
    "linear-gradient(to right, rgba(4,9,12,0.95) 0%, rgba(4,9,12,0.80) 50%, rgba(4,9,12,0.60) 100%)",
  heroOverlayBottom:
    "linear-gradient(to top, #04090C 0%, transparent 60%, transparent 100%)",
  topbarBg: "rgba(4,9,12,0.95)",
  formBg: "rgba(7,19,26,0.90)",
  inputBg: "rgba(255,255,255,0.03)",
  placeholder: "rgba(255,255,255,0.20)",
}

const SIGNATURE_DAY: LpPalette = {
  bg: "#EFF5F4",
  bgAlt: "#E2ECEB",
  bgGradient:
    "radial-gradient(ellipse 100% 80% at 20% 50%, rgba(20,160,165,0.16) 0%, transparent 55%), radial-gradient(ellipse 60% 60% at 80% 20%, rgba(212,175,55,0.10) 0%, transparent 50%), linear-gradient(135deg, #EFF5F4 0%, #F5FAF9 50%, #E6F0EE 100%)",
  surface: "#FFFFFF",
  surfaceStrong: "rgba(8,32,31,0.07)",
  surfaceBorder: "rgba(8,32,31,0.16)",
  divider: "rgba(8,32,31,0.12)",
  textPrimary: "#08201F",
  textMuted: "rgba(8,32,31,0.74)",
  textFaint: "rgba(8,32,31,0.58)",
  heroOverlaySide:
    "linear-gradient(to right, rgba(239,245,244,0.96) 0%, rgba(239,245,244,0.82) 50%, rgba(239,245,244,0.55) 100%)",
  heroOverlayBottom:
    "linear-gradient(to top, #EFF5F4 0%, transparent 60%, transparent 100%)",
  topbarBg: "rgba(239,245,244,0.95)",
  formBg: "rgba(255,255,255,0.94)",
  inputBg: "rgba(8,32,31,0.03)",
  placeholder: "rgba(8,32,31,0.42)",
}

// The template drives the atmosphere; `signature` gets the lagoon palette, all
// others keep the warm default. Unknown/empty template → default.
// A chosen accent only swaps the gold wash (212,175,55) inside the shipped
// gradient strings; with no accent the object is returned untouched, so the
// no-pick page stays byte-identical to the pre-accent one.
export function lpPalette(theme: LpTheme, template?: string | null, accent?: LpAccent | null): LpPalette {
  const base = template === "signature"
    ? (theme === "day" ? SIGNATURE_DAY : SIGNATURE_NIGHT)
    : (theme === "day" ? DAY : NIGHT)
  if (!accent) return base
  return { ...base, bgGradient: base.bgGradient.replaceAll("212,175,55", hexWash(accent.accent)) }
}

// Current hour (0–23) in Dubai local time (UTC+4, no DST).
function dubaiHour(): number {
  return (new Date().getUTCHours() + 4) % 24
}

/**
 * Resolve the active theme. An explicit `?theme=day|night` override always
 * wins; otherwise pick by Dubai local time — day 06:00–17:59, night
 * 18:00–05:59.
 */
export function resolveTheme(param: unknown, nowHourDubai?: number): LpTheme {
  const raw = Array.isArray(param) ? param[0] : param
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : ""
  if (s === "day" || s === "night") return s
  const h = typeof nowHourDubai === "number" ? nowHourDubai : dubaiHour()
  return h >= 6 && h < 18 ? "day" : "night"
}

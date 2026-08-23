/**
 * Generic content blocks the landing builder can add to any page — the
 * "بلوكات مختلفة" half of the builder.
 *
 * This module is deliberately PURE (no imports, no server code) so it can be
 * shared by three worlds that must agree on one list:
 *   - the server store + renderer (lib/landing-pages.ts re-exports it, the
 *     public page's Section switch renders each),
 *   - the client editor ('use client' — it may not import lib/landing-pages,
 *     which pulls node:crypto/db),
 *   - the guard (scripts/lp-blocks-test.ts).
 *
 * Unlike every other section type (derived from the joined project: hero, roi,
 * units…), these carry only the marketer's own free text, never auto-appear,
 * and never enter buildDefaultSections / fallbackOrder — an empty page has none
 * of them.
 */
export const LP_GENERIC_BLOCKS = [
  "free-heading",   // eyebrow + title + subtitle, centered
  "free-text",      // title + body paragraphs
  "call-to-action", // title + subtitle + button (href sanitized at render)
  "free-stats",     // title + up to 4 value/label tiles
  "divider",        // a hairline + breathing room, no content
] as const

export type LandingGenericBlock = (typeof LP_GENERIC_BLOCKS)[number]

/** A generic block never appears unless the marketer added it. */
export const isGenericBlock = (type: string): type is LandingGenericBlock =>
  (LP_GENERIC_BLOCKS as readonly string[]).includes(type)

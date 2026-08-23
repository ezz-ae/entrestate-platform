/**
 * The canvas the public front pages render through.
 *
 * A page hands over its real sections as a keyed map of ReactNodes (the JSX
 * stays in the page file, exactly where it always lived) plus whatever
 * published layout exists. The canvas walks the layout: sections come from
 * the map, generic blocks from FrontGenericBlock, hidden items are skipped,
 * and a section key the map does not know renders nothing rather than
 * crashing — the sanitizer and the guard make that case near-impossible,
 * and the renderer still leans closed.
 *
 * No layout (null) = the built-in order under the shipped palette: the
 * page as coded, byte for byte. That is the resilience contract — a broken
 * or missing row can only ever mean "today's site".
 */
import type { ReactNode } from 'react'
import { defaultFrontLayout, paletteVars, typefaceVars, type FrontLayout, type FrontPage } from '@/lib/freehold/front-layout'
import { FrontGenericBlock } from './blocks'

export function FrontCanvas({
  page, layout, sections, className,
}: {
  page: FrontPage
  layout: FrontLayout | null
  sections: Record<string, ReactNode>
  className?: string
}) {
  const resolved = layout ?? defaultFrontLayout(page)
  // data-fp-typeface is set ONLY when a typeface is chosen, so a default page
  // grows no attribute and the globals.css heading rule never matches it —
  // byte-identical to before the picker existed.
  return (
    <div
      className={className}
      data-fp-palette={resolved.palette}
      data-fp-typeface={resolved.typeface || undefined}
      style={{ ...paletteVars(resolved.palette), ...typefaceVars(resolved.typeface) } as React.CSSProperties}
    >
      {resolved.items.map((item) => {
        if (item.hidden) return null
        if (item.kind === 'section') {
          const node = sections[item.type]
          return node ? <div key={item.id} data-fp-section={item.type}>{node}</div> : null
        }
        return <FrontGenericBlock key={item.id} item={item} />
      })}
    </div>
  )
}

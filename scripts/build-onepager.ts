/**
 * The broker-to-owner one-pager.
 *
 * An authoring tool, not part of the app: run it once, commit the PDF it
 * writes to public/business/, and the site serves that file as a static
 * asset. It is deliberately NOT wired into build, guards, or CI — the PDF
 * changes only when a human reruns this and commits the result.
 *
 *   pnpm tsx scripts/build-onepager.ts
 *
 * Standard Helvetica only (metrics ship inside every PDF viewer, so the
 * file stays a few KB and prints identically everywhere) — which is also
 * why the languages fact reads EN · AR · RU here rather than the scripts
 * themselves. Light on white because this page's life is a printout on an
 * owner's desk, not a screen.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import QRCode from 'qrcode'
import { FULL_SYSTEM, FULL_SYSTEM_PRICE_SHORT } from '../lib/business/full-system'

const OUT = join(process.cwd(), 'public', 'business', 'entrestate-one-pager.pdf')
const LINK = 'https://entrestate.com/business'

// A4 portrait, in points.
const W = 595.28
const H = 841.89
const M = 54
const CW = W - M * 2 // content width

const GOLD = rgb(184 / 255, 150 / 255, 46 / 255) // #B8962E
const INK = rgb(32 / 255, 36 / 255, 42 / 255) // #20242A
const MUTED = rgb(110 / 255, 116 / 255, 124 / 255) // #6E747C
const WASH = rgb(250 / 255, 247 / 255, 238 / 255) // gold-tinted card fill
const WASH_EDGE = rgb(233 / 255, 225 / 255, 204 / 255)
const HAIRLINE = rgb(227 / 255, 229 / 255, 232 / 255)

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const probe = line ? `${line} ${word}` : word
    if (!line || font.widthOfTextAtSize(probe, size) <= maxWidth) line = probe
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawTracked(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
  tracking: number,
): number {
  let cx = x
  for (const ch of text) {
    page.drawText(ch, { x: cx, y, size, font, color })
    cx += font.widthOfTextAtSize(ch, size) + tracking
  }
  return cx - tracking
}

function centered(page: PDFPage, text: string, cx: number, y: number, size: number, font: PDFFont, color: RGB): void {
  page.drawText(text, { x: cx - font.widthOfTextAtSize(text, size) / 2, y, size, font, color })
}

// drawSvgPath treats y as the SVG origin with +y pointing down, so pass the TOP edge.
function roundedRect(
  page: PDFPage,
  x: number,
  top: number,
  w: number,
  h: number,
  r: number,
  fill: RGB | undefined,
  edge: RGB | undefined,
): void {
  const d =
    `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} ` +
    `L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z`
  page.drawSvgPath(d, { x, y: top, color: fill, borderColor: edge, borderWidth: edge ? 1 : 0 })
}

function eyebrow(page: PDFPage, font: PDFFont, text: string, y: number): void {
  drawTracked(page, text, M, y, 7.5, font, GOLD, 1.8)
}

async function main(): Promise<void> {
  const doc = await PDFDocument.create()
  doc.setTitle('Entrestate — the system a real-estate company runs on')
  doc.setSubject('One page: the loop, the products, the guardrails.')
  doc.setAuthor('Entrestate')
  doc.setCreator('Entrestate')

  const page = doc.addPage([W, H])
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  // ── Masthead ─────────────────────────────────────────────────────────────
  drawTracked(page, 'ENTRESTATE', M, 766, 24, bold, INK, 5)
  page.drawText('The system a real-estate company runs on.', { x: M, y: 745, size: 11.5, font: helv, color: MUTED })
  page.drawLine({ start: { x: M, y: 727 }, end: { x: W - M, y: 727 }, thickness: 2, color: GOLD })

  // ── The loop: five steps, arrows forward, one arrow back ─────────────────
  eyebrow(page, bold, 'THE LOOP', 700)
  const steps = ['LISTING', 'PAGE', 'CAMPAIGN', 'LEAD', 'DEAL']
  const boxW = 82
  const boxH = 42
  const boxTop = 688
  // pitch = one box plus the whitespace that spreads the row across the full content width
  const pitch = boxW + (CW - boxW * steps.length) / (steps.length - 1)
  steps.forEach((label, i) => {
    const x = M + i * pitch
    roundedRect(page, x, boxTop, boxW, boxH, 8, undefined, GOLD)
    centered(page, `0${i + 1}`, x + boxW / 2, boxTop - 16, 7, bold, GOLD)
    centered(page, label, x + boxW / 2, boxTop - 30, 9.5, bold, INK)
    if (i < steps.length - 1) {
      const ax = x + boxW + 3
      const tip = x + pitch - 3
      page.drawLine({ start: { x: ax, y: 667 }, end: { x: tip - 6, y: 667 }, thickness: 1.2, color: GOLD })
      page.drawSvgPath('M 0 0 L 6 3.2 L 0 6.4 Z', { x: tip - 6, y: 670.2, color: GOLD })
    }
  })
  // The dotted return is the pitch: closed deals feed the next campaign.
  const dealCx = M + 4 * pitch + boxW / 2
  const listCx = M + boxW / 2
  const loopY = 630
  page.drawLine({ start: { x: dealCx, y: boxTop - boxH }, end: { x: dealCx, y: loopY }, thickness: 1, color: GOLD })
  page.drawLine({ start: { x: listCx, y: loopY }, end: { x: dealCx, y: loopY }, thickness: 1, color: GOLD })
  page.drawLine({ start: { x: listCx, y: loopY }, end: { x: listCx, y: boxTop - boxH - 6 }, thickness: 1, color: GOLD })
  page.drawSvgPath('M 0 6 L 3.2 0 L 6.4 6 Z', { x: listCx - 3.2, y: boxTop - boxH, color: GOLD })
  centered(page, 'Closed deals teach the next campaign.', (listCx + dealCx) / 2, 614, 8.5, helv, MUTED)

  // ── Three plans ──────────────────────────────────────────────────────────
  // Three CARDS, four product pages: Landing Pages is sold on its own page at
  // /business/landing-pages but ships inside Lead Machine, so it is a line in
  // that card rather than a fourth column. Adding a column here also breaks
  // the three-up grid this sheet is laid out on.
  eyebrow(page, bold, 'THREE PRODUCTS', 590)
  const products: Array<{ name: string; line: string; who: string; billed: string }> = [
    {
      name: 'Lead Machine',
      line: 'Inventory, a landing page per project, ads, CRM and the month-end report — one system, your brand.',
      who: 'Brokerages and developers’ sales teams.',
      billed: `${FULL_SYSTEM_PRICE_SHORT}. ${FULL_SYSTEM.trialDays}-day trial, no card.`,
    },
    {
      name: 'Mega Brokerage Platform',
      line: 'Your public site, a landing page for every listing, and the desk that runs it.',
      who: 'Companies that need a public face.',
      billed: 'Set up on request.',
    },
    {
      name: 'Meta for Realtors',
      line: 'A full lead-ads system on Meta. Pick a project from our off-plan inventory, set the budget — a few clicks.',
      who: 'Individual agents.',
      billed: 'AED 5 per token, as you run ads. No monthly fee.',
    },
  ]
  const colGap = 17.14
  const colW = (CW - colGap * 2) / 3
  const cardTop = 578
  const cardH = 166
  products.forEach((p, i) => {
    const x = M + i * (colW + colGap)
    const inner = colW - 24
    const tx = x + 12
    roundedRect(page, x, cardTop, colW, cardH, 10, undefined, HAIRLINE)
    page.drawRectangle({ x: tx, y: cardTop - 15, width: 18, height: 3, color: GOLD })
    page.drawText(p.name, { x: tx, y: cardTop - 32, size: 11, font: bold, color: INK })
    wrap(p.line, helv, 8, inner).forEach((ln, n) => {
      page.drawText(ln, { x: tx, y: cardTop - 48 - n * 10.5, size: 8, font: helv, color: MUTED })
    })
    drawTracked(page, 'FOR', tx, cardTop - 98, 6.5, bold, GOLD, 1.4)
    wrap(p.who, helv, 8, inner).forEach((ln, n) => {
      page.drawText(ln, { x: tx, y: cardTop - 110 - n * 10.5, size: 8, font: helv, color: INK })
    })
    drawTracked(page, 'BILLING', tx, cardTop - 134, 6.5, bold, GOLD, 1.4)
    wrap(p.billed, helv, 8, inner).forEach((ln, n) => {
      page.drawText(ln, { x: tx, y: cardTop - 146 - n * 10.5, size: 8, font: helv, color: INK })
    })
  })

  // ── The guardrails ───────────────────────────────────────────────────────
  eyebrow(page, bold, 'THE GUARDRAILS', 388)
  const punches: Array<{ punch: string; sub: string }> = [
    { punch: 'No rule, no spend.', sub: 'With no rule, it spends nothing on its own.' },
    { punch: 'A weak page cannot be advertised.', sub: 'The gate blocks a campaign before it wastes the click.' },
    { punch: 'Every automatic move is written down.', sub: 'Each budget move, in plain words, with the reason.' },
    { punch: 'No invented numbers.', sub: 'If the assistant doesn’t know, it says so.' },
  ]
  const pGap = 16
  const pW = (CW - pGap) / 2
  punches.forEach((p, i) => {
    const x = M + (i % 2) * (pW + pGap)
    const top = i < 2 ? 376 : 318
    roundedRect(page, x, top, pW, 48, 10, WASH, WASH_EDGE)
    page.drawCircle({ x: x + 18, y: top - 15.5, size: 2.2, color: GOLD })
    page.drawText(p.punch, { x: x + 26, y: top - 19, size: 11, font: bold, color: INK })
    page.drawText(p.sub, { x: x + 26, y: top - 35, size: 7.5, font: helv, color: MUTED })
  })

  // ── Facts row ────────────────────────────────────────────────────────────
  const facts: Array<{ value: string; label: string }> = [
    { value: '171', label: 'working screens' },
    { value: '3', label: 'languages · EN · AR · RU' },
    { value: '7', label: 'roles, enforced everywhere' },
    { value: '82', label: 'checks before any release' },
  ]
  page.drawLine({ start: { x: M, y: 246 }, end: { x: W - M, y: 246 }, thickness: 1, color: HAIRLINE })
  page.drawLine({ start: { x: M, y: 186 }, end: { x: W - M, y: 186 }, thickness: 1, color: HAIRLINE })
  const cell = CW / facts.length
  facts.forEach((f, i) => {
    const cx = M + cell * i + cell / 2
    centered(page, f.value, cx, 212, 21, bold, INK)
    centered(page, f.label, cx, 197, 7, helv, MUTED)
    if (i > 0) {
      const dx = M + cell * i
      page.drawLine({ start: { x: dx, y: 198 }, end: { x: dx, y: 238 }, thickness: 1, color: HAIRLINE })
    }
  })

  // ── Footer: the way back to us ───────────────────────────────────────────
  page.drawLine({ start: { x: M, y: 140 }, end: { x: W - M, y: 140 }, thickness: 1.5, color: GOLD })
  page.drawText('entrestate.com/business', { x: M, y: 108, size: 12.5, font: bold, color: INK })
  page.drawText('Start a 14-day trial · No card.', { x: M, y: 91, size: 8.5, font: helv, color: MUTED })
  page.drawText('Scan the code for the full tour.', { x: M, y: 76, size: 7.5, font: helv, color: MUTED })
  const qrData = await QRCode.toDataURL(LINK, {
    errorCorrectionLevel: 'M',
    margin: 0, // the surrounding white page is the quiet zone
    width: 248,
    color: { dark: '#20242A', light: '#FFFFFF' },
  })
  const qr = await doc.embedPng(qrData)
  const qrSize = 62
  page.drawImage(qr, { x: W - M - qrSize, y: 58, width: qrSize, height: qrSize })

  const bytes = await doc.save()
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, bytes)

  const kb = bytes.length / 1024
  const pages = doc.getPageCount()
  console.log(`wrote ${OUT} — ${kb.toFixed(1)} KB, ${pages} page(s)`)
  if (pages !== 1) throw new Error(`expected exactly 1 page, got ${pages}`)
  if (bytes.length > 300 * 1024) throw new Error(`PDF is ${kb.toFixed(1)} KB — over the 300 KB budget`)
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})

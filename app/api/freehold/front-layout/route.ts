/**
 * The front pages' layouts — read, draft, publish, unpublish.
 *
 * Writes are management + marketing, the same door as every other Web Studio
 * surface (site-content set the precedent). Reads need the same session:
 * the published result is public once rendered, but the editor's view —
 * which pages carry drafts, what is live vs built-in — is an internal view.
 *
 * All shaping goes through sanitizeFrontLayout on the way in AND out, so a
 * hostile PATCH body can never store anything the registries do not name.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/freehold/api-auth'
import { MANAGEMENT_ROLES, type Role } from '@/lib/freehold/session-types'
import {
  FRONT_PAGES, FRONT_SECTIONS, FRONT_BLOCKS, FRONT_PALETTES, FRONT_TYPEFACES,
  getFrontEditorState, saveFrontDraft, publishFront, unpublishFront,
  type FrontPage,
} from '@/lib/freehold/front-layout'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WRITE_ROLES: Role[] = [...MANAGEMENT_ROLES, 'marketing']

const isFrontPage = (p: string): p is FrontPage => (FRONT_PAGES as string[]).includes(p)

export async function GET() {
  const auth = await requireSession(WRITE_ROLES)
  if ('res' in auth) return auth.res
  const pages = await Promise.all(FRONT_PAGES.map((page) => getFrontEditorState(page)))
  return NextResponse.json({
    pages,
    sections: FRONT_SECTIONS,
    blocks: FRONT_BLOCKS,
    palettes: FRONT_PALETTES,
    typefaces: FRONT_TYPEFACES,
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSession(WRITE_ROLES)
  if ('res' in auth) return auth.res
  let body: { page?: string; layout?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const page = String(body.page ?? '')
  if (!isFrontPage(page)) {
    return NextResponse.json({ error: `Unknown page: ${page}` }, { status: 400 })
  }
  const draft = await saveFrontDraft(page, body.layout, auth.user.email)
  return NextResponse.json({ page, draft })
}

export async function POST(req: NextRequest) {
  const auth = await requireSession(WRITE_ROLES)
  if ('res' in auth) return auth.res
  let body: { page?: string; action?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const page = String(body.page ?? '')
  if (!isFrontPage(page)) {
    return NextResponse.json({ error: `Unknown page: ${page}` }, { status: 400 })
  }
  const action = String(body.action ?? '')
  if (action === 'publish') {
    await publishFront(page, auth.user.email)
  } else if (action === 'unpublish') {
    await unpublishFront(page, auth.user.email)
  } else {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
  const state = await getFrontEditorState(page)
  return NextResponse.json(state)
}

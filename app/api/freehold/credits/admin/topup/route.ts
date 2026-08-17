/**
 * The vendor's half of the token till: see who is waiting, confirm the money
 * arrived, or turn it down.
 *
 * This is the ONLY endpoint that turns a top-up request into balance, and it
 * is management-gated exactly like the manual allocation beside it. When a
 * payment provider lands, its webhook calls the same confirm — the ledger
 * write, its idempotency and this audit trail do not change.
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/freehold/auth-edge'
import { confirmTopupRequest, rejectTopupRequest, listPendingTopups } from '@/lib/freehold/credit-topups'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['admin', 'ceo', 'director', 'sales_manager']

async function requireManager() {
  const cookieStore = await cookies()
  const user = await verifySession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!ALLOWED_ROLES.includes(user.role)) {
    return { error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) }
  }
  return { user }
}

export async function GET() {
  const a = await requireManager()
  if ('error' in a) return a.error
  return NextResponse.json({ requests: await listPendingTopups() })
}

export async function POST(req: Request) {
  const a = await requireManager()
  if ('error' in a) return a.error

  let body: { id?: string; action?: 'confirm' | 'reject'; note?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  if (!body.id || (body.action !== 'confirm' && body.action !== 'reject')) {
    return NextResponse.json({ error: 'id and action (confirm|reject) are required' }, { status: 400 })
  }

  if (body.action === 'reject') {
    const rejected = await rejectTopupRequest(body.id, a.user.email, body.note)
    if (!rejected.ok) {
      return NextResponse.json(
        { error: rejected.reason === 'not_found' ? 'No pending request with that id.' : 'Could not update that request.' },
        { status: rejected.reason === 'not_found' ? 404 : 500 },
      )
    }
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  const result = await confirmTopupRequest(body.id, a.user.email)
  if (!result.ok) {
    const status =
      result.reason === 'not_found' ? 404
      : result.reason === 'not_pending' ? 409
      : result.reason === 'self_deal' ? 403
      : 500
    return NextResponse.json(
      {
        error:
          result.reason === 'not_found' ? 'No request with that id.'
          : result.reason === 'not_pending' ? 'That request was already decided.'
          : result.reason === 'self_deal'
            ? 'A top-up cannot be confirmed by the account it credits. Entrestate confirms the payment.'
          : 'Could not confirm the top-up. Nothing was credited.',
      },
      { status },
    )
  }
  // `already` is a success: a second click on Confirm reports the paid state,
  // never an error that invites a third.
  return NextResponse.json({ ok: true, status: 'confirmed', credits: result.credits, already: result.already ?? false })
}

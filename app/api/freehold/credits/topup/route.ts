/**
 * The customer's half of the token till: ask for a pack, see what you asked for.
 *
 * Deliberately cannot move money. A POST here writes a REQUEST row; only the
 * vendor's confirm endpoint touches the ledger (see credits/admin/topup). That
 * split is what lets this ship before a payment provider exists, and keeps the
 * same screens working the day one is wired in behind the confirm.
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/freehold/auth-edge'
import { createTopupRequest, listTopupRequests } from '@/lib/freehold/credit-topups'
import { creditAccountId } from '@/lib/freehold/credit-identity'
import { getTenantBrand } from '@/lib/tenancy/server'
import { TOKEN_PACKS } from '@/lib/freehold/credits-shared'

export const dynamic = 'force-dynamic'

async function account() {
  const cookieStore = await cookies()
  const user = await verifySession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const plan = (await getTenantBrand().catch(() => null))?.plan
  const brokerId = creditAccountId(user, plan)
  if (!brokerId) {
    return { error: NextResponse.json({ error: 'This account is not funded by credits' }, { status: 403 }) }
  }
  return { brokerId, user }
}

export async function GET() {
  const a = await account()
  if ('error' in a) return a.error
  return NextResponse.json({
    requests: await listTopupRequests(a.brokerId),
    packs: TOKEN_PACKS,
  })
}

export async function POST(req: Request) {
  const a = await account()
  if ('error' in a) return a.error

  let body: { credits?: number }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  // The pack list is the price list: the server re-derives the AED from the
  // requested credit count, so a browser cannot post its own cheaper quote.
  const result = await createTopupRequest(a.brokerId, Number(body.credits), a.user.email)
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.reason === 'invalid'
          ? 'Choose one of the published token packs.'
          : 'Could not record that request. Please try again.',
      },
      { status: result.reason === 'invalid' ? 400 : 500 },
    )
  }
  return NextResponse.json({ request: result.request })
}

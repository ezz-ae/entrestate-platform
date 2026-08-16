import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/freehold/auth-edge'
import { readCreditBalance, ensureCreditsSchema } from '@/lib/freehold/credits-db'
import { creditAccountId } from '@/lib/freehold/credit-identity'
import { getTenantBrand } from '@/lib/tenancy/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const user = await verifySession(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Same rule as the launch routes: on a realtor plan the signed-in owner IS
  // the account. Reading it off role alone answered "not a broker account" to
  // the one customer whose whole product is billed in tokens.
  const plan = (await getTenantBrand().catch(() => null))?.plan
  const brokerId = creditAccountId(user, plan) ?? null
  if (!brokerId) return NextResponse.json({ error: 'This account is not funded by credits' }, { status: 403 })

  await ensureCreditsSchema()
  const result = await readCreditBalance(brokerId)
  // A failed read must not render as "no credits yet" — that is a wrong number
  // on a money screen. Fail loudly so the page can say it could not load.
  if (!result.ok) {
    return NextResponse.json({ error: 'Could not read the credit balance.' }, { status: 503 })
  }
  return NextResponse.json({ balance: result.balance, brokerId })
}

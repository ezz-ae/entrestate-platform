import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/freehold/auth-edge'
import { readCreditLedger, getAdSpendAllocations } from '@/lib/freehold/credits-db'
import { creditAccountId } from '@/lib/freehold/credit-identity'
import { getTenantBrand } from '@/lib/tenancy/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const user = await verifySession(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // The same account the balance and the launch routes resolve. Left on the
  // role test, a realtor's balance loaded and their history 403'd — one screen
  // telling two stories about one ledger.
  const plan = (await getTenantBrand().catch(() => null))?.plan
  const brokerId = creditAccountId(user, plan) ?? null
  if (!brokerId) return NextResponse.json({ error: 'This account is not funded by credits' }, { status: 403 })

  const [ledgerResult, allocations] = await Promise.all([
    readCreditLedger(brokerId),
    getAdSpendAllocations(brokerId),
  ])
  // An empty history and a failed query must never look the same to the broker.
  if (!ledgerResult.ok) {
    return NextResponse.json({ error: 'Could not read the credit history.' }, { status: 503 })
  }
  return NextResponse.json({ ledger: ledgerResult.ledger, allocations, brokerId })
}

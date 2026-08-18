/**
 * The numbers a brokerage says are theirs.
 *
 * POST records a CLAIM and nothing more. It cannot mark a number verified —
 * verification is the provider's fact, established by the number appearing in
 * the provider's own list, and a claim that never gets verified stays pending
 * forever rather than quietly becoming usable. See lib/calling/caller-id.ts
 * for why an unverified number must never originate a call.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/freehold/api-auth'
import { MANAGEMENT_ROLES } from '@/lib/freehold/session-types'
import { claimCallerId, listCallerIdClaims, removeCallerIdClaim } from '@/lib/calling/caller-id'

const ALLOWED = [...MANAGEMENT_ROLES, 'marketing'] as const

export async function GET() {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res
  return NextResponse.json({ claims: await listCallerIdClaims() })
}

export async function POST(req: NextRequest) {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res

  const body = (await req.json().catch(() => ({}))) as { number?: string; label?: string }
  const label = String(body.label ?? '').trim() || null
  const e164 = await claimCallerId(String(body.number ?? ''), label, auth.user.email)
  if (!e164) {
    // We do not guess a country code. Guessing dials a stranger.
    return NextResponse.json(
      { error: 'Enter the number in full international form, starting with + — for example +9715XXXXXXXX.' },
      { status: 400 },
    )
  }
  return NextResponse.json({ ok: true, e164, verified: false })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res
  const number = new URL(req.url).searchParams.get('number') ?? ''
  await removeCallerIdClaim(number)
  return NextResponse.json({ ok: true })
}

/**
 * The voice provider connection for this tenant.
 *
 * POST validates the key against the provider BEFORE storing it. A key that
 * cannot list numbers cannot place a call, and storing it anyway would leave
 * the integration screen saying "connected" while every call fails — the exact
 * dishonest state this product refuses to render.
 *
 * The key is sealed at rest (AES-256-GCM, lib/freehold/secure-store.ts) and is
 * never returned to the browser, not even masked: a masked secret is still a
 * secret sitting in a response body.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/freehold/api-auth'
import { MANAGEMENT_ROLES } from '@/lib/freehold/session-types'
import {
  ElevenLabsProvider, callingConnection, clearCallingCreds, saveCallingCreds, CallingApiError,
} from '@/lib/calling/provider'

// Connecting a provider spends the brokerage's money on every subsequent call,
// so it sits with the roles that already own budget — not with every broker.
const ALLOWED = [...MANAGEMENT_ROLES, 'marketing'] as const

export async function GET() {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res
  return NextResponse.json(await callingConnection())
}

export async function POST(req: NextRequest) {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res

  const body = (await req.json().catch(() => ({}))) as { apiKey?: string; agentId?: string }
  const apiKey = String(body.apiKey ?? '').trim()
  const agentId = String(body.agentId ?? '').trim()
  if (!apiKey || !agentId) {
    return NextResponse.json({ error: 'apiKey and agentId are required' }, { status: 400 })
  }

  try {
    const numbers = await new ElevenLabsProvider(apiKey, agentId).listNumbers()
    await saveCallingCreds({ apiKey, agentId }, auth.user.email)
    // The count is a fact about rows the provider returned, not an estimate.
    return NextResponse.json({ ok: true, agentId, numbers: numbers.length })
  } catch (e) {
    const status = e instanceof CallingApiError ? e.status : 502
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'The voice provider did not answer.' },
      { status: status >= 400 && status < 600 ? status : 502 },
    )
  }
}

export async function DELETE() {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res
  await clearCallingCreds()
  return NextResponse.json({ ok: true })
}

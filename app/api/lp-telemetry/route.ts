/**
 * ENGINE 04 — the public telemetry door. One endpoint, three kinds:
 *
 *   { kind: 'active',   sessionId, events: [{ elementId, hoverDurationMs, … }] }
 *   { kind: 'idle',     sessionId, idleDurationSeconds, triggeredByTabHide }
 *   { kind: 'reengage', sessionId }
 *
 * Anonymous by design — the landing pages are public, like /api/lp-analytics
 * beside it (both on proxy.ts PUBLIC_API_EXACT). What keeps an open door
 * honest lives in lib/freehold/behavioral-telemetry.ts and is guarded:
 * NO leadId is accepted from the browser (rows are session-keyed; the lead
 * link is made server-side by /api/leads), every number is clamped, element
 * ids are slugged, and each session has a hard row budget past which events
 * are acknowledged and dropped. The response never says which — a probe
 * learns nothing from this endpoint.
 */
import { NextResponse } from 'next/server'
import { recordActiveTelemetry, recordIdleTelemetry, markReEngaged } from '@/lib/freehold/behavioral-telemetry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const kind = String(body.kind ?? '')
    const sessionId = body.sessionId
    if (kind === 'active') await recordActiveTelemetry(sessionId, body.events)
    else if (kind === 'idle') await recordIdleTelemetry(sessionId, { idleDurationSeconds: body.idleDurationSeconds, triggeredByTabHide: body.triggeredByTabHide })
    else if (kind === 'reengage') await markReEngaged(sessionId)
    else return NextResponse.json({ error: 'unknown kind' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch {
    // Telemetry is a gift, never a failure a visitor can see.
    return NextResponse.json({ ok: true })
  }
}

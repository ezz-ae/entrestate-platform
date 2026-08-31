/**
 * ENGINE 06 + 07 ON A TIMER.
 *
 * Two sweeps that must not depend on anybody opening a screen:
 *
 *   · THE NEGLECT GATE — a convergent buyer whose 15-minute clock ran out
 *     with no contact loses their owner (lib/freehold/lead-rate-db.ts,
 *     sweepNeglectDeadlines). The CRM list also settles this when opened;
 *     the timer is what makes the rule true at 3 am.
 *   · DECAY — open leads re-evaluated once a day, oldest evaluation first,
 *     so a rate that nobody touched for a fortnight comes down on its own
 *     (sweepRateDecay).
 *
 * Every fifteen minutes (vercel.json), matching the gate's own window: the
 * worst case a neglected buyer waits past the deadline is one more window.
 *
 * Fail closed on CRON_SECRET, like every cron here: /api/cron/ is on the
 * public prefix list in proxy.ts, so this check is the only gate there is.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sweepNeglectDeadlines, sweepRateDecay } from '@/lib/freehold/lead-rate-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  const authHeader = req.headers.get('authorization') || ''
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  const neglect = await sweepNeglectDeadlines()
  const decay = await sweepRateDecay()
  return NextResponse.json({ neglect, decay, at: new Date().toISOString() })
}

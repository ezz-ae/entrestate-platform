/**
 * GET  /api/sales-team — the roster: who is hired, how trained, what blocks them.
 * POST /api/sales-team — hire a member, end their employment, or record training.
 *
 * lib/freehold/sales-employment.ts became the payroll every calling gate reads,
 * and then nothing could write to it: an operator had no way to hire anybody, so
 * assignCaller() answered "nobody is employed" forever and the call button was
 * unreachable by construction. This route is the missing half.
 *
 * WHO MAY HIRE IS NARROWER THAN WHO MAY CALL. A broker places calls; only
 * management changes the payroll, because a hire is a recurring charge on the
 * account and an end-of-employment silently takes a colleague off the phones.
 * The POST list is deliberately shorter than the calling route's ALLOWED.
 *
 * Every write is validated against the catalogue: a payroll row for an id that
 * is not a real member is a row nothing can ever pay, and a term outside
 * EMPLOYMENT_TERMS is a call that can never be planned.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/freehold/api-auth'
import { MANAGEMENT_ROLES } from '@/lib/freehold/session-types'
import {
  listEmployment, employMember, endEmployment, setTrainedLevel,
  rosterFrom, stillTraining, notHired,
  EMPLOYMENT_TERMS, type EmploymentTerm,
} from '@/lib/freehold/sales-employment'
import { rosterReadiness } from '@/lib/freehold/lead-caller'
import { SALES_TEAM, totalRate, getMember, READINESS_THRESHOLD } from '@/lib/freehold/visual-sales-team'

/** Reading the roster is a normal part of working the desk. */
const CAN_READ = [...MANAGEMENT_ROLES, 'marketing', 'team_leader', 'broker'] as const
/** Changing the payroll is not: it costs money and takes people off the phone. */
const CAN_WRITE = [...MANAGEMENT_ROLES] as const

export async function GET() {
  const auth = await requireSession([...CAN_READ])
  if ('res' in auth) return auth.res

  const now = new Date()
  const rows = await listEmployment()
  const roster = rosterFrom(rows, now)
  const readiness = rosterReadiness(roster)
  const byMember = new Map(rows.map((r) => [r.memberId, r]))
  const blockerFor = new Map(readiness.map((r) => [r.memberId, r]))

  return NextResponse.json({
    threshold: READINESS_THRESHOLD,
    terms: EMPLOYMENT_TERMS,
    // One row per catalogue member, hired or not, so the screen renders the
    // whole team and an unhired member is an offer rather than an absence.
    members: SALES_TEAM.map((m) => {
      const e = byMember.get(m.id)
      const r = blockerFor.get(m.id)
      return {
        id: m.id,
        name: m.name,
        title: m.title,
        tier: m.tier,
        yearsExperience: m.yearsExperience,
        languages: m.languages,
        industries: m.industries,
        topSkills: m.topSkills,
        rate: totalRate(m),
        price: m.price,
        employed: roster.employed.includes(m.id),
        term: e?.term ?? null,
        endsAt: e?.endsAt ?? null,
        trainedLevel: e?.trainedLevel ?? m.baseLevel,
        ready: r?.ready ?? false,
        blocker: r?.blocker ?? null,
      }
    }),
    stillTraining: stillTraining(rows, now),
    notHired: notHired(rows),
  })
}

interface Body {
  action?: 'hire' | 'end' | 'train'
  memberId?: string
  term?: EmploymentTerm
  endsAt?: string | null
  level?: number
}

export async function POST(req: NextRequest) {
  const auth = await requireSession([...CAN_WRITE])
  if ('res' in auth) return auth.res

  const body = (await req.json().catch(() => ({}))) as Body
  const memberId = String(body.memberId ?? '').trim()
  if (!getMember(memberId)) {
    return NextResponse.json(
      { ok: false, message: 'That is not somebody on the team.' },
      { status: 400 },
    )
  }

  switch (body.action) {
    case 'hire': {
      const term = body.term as EmploymentTerm
      if (!EMPLOYMENT_TERMS.includes(term)) {
        return NextResponse.json({ ok: false, message: 'Unknown employment term.' }, { status: 400 })
      }
      const row = await employMember(memberId, term, body.endsAt ?? null)
      return NextResponse.json({ ok: !!row, employment: row })
    }
    case 'end': {
      await endEmployment(memberId)
      return NextResponse.json({ ok: true })
    }
    case 'train': {
      const level = await setTrainedLevel(memberId, Number(body.level))
      return NextResponse.json({ ok: level !== null, trainedLevel: level })
    }
    default:
      return NextResponse.json({ ok: false, message: 'Unknown action.' }, { status: 400 })
  }
}

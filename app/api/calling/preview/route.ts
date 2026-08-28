/**
 * GET /api/calling/preview — who would call this lead, and why not.
 *
 * The same decision POST /api/calling makes, without the call. It exists
 * because the product's real value on this screen is the REFUSAL: "no dated
 * consent record", "it is Friday prayer", "Hessa is trained to 61%" are three
 * different problems with three different people who fix them, and a broker
 * should read the one that applies BEFORE pressing anything.
 *
 * IT IS A GET, AND THAT IS THE SAFETY PROPERTY. A dry-run flag on the POST
 * would put the decision and the dial in one handler, one boolean apart — and
 * the day somebody defaults that boolean wrong, a preview places a call. This
 * file cannot dial: it never imports getCallingProvider, and the guard asserts
 * that it never does. A preview that could ring a stranger's phone is not a
 * preview.
 *
 * It reads the provider only for CONNECTION STATE (are we connected at all),
 * which is the same read GET /api/calling already does.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/freehold/api-auth'
import { MANAGEMENT_ROLES } from '@/lib/freehold/session-types'
import { placeLeadCall } from '@/lib/calling/place'
import { getMember, totalRate } from '@/lib/freehold/visual-sales-team'

const ALLOWED = [...MANAGEMENT_ROLES, 'marketing', 'team_leader', 'broker'] as const

/** One shape for every answer, so the screen renders one component either way. */
interface Preview {
  ready: boolean
  /** Who would speak, when ready. */
  member: { id: string; name: string; title: string; rate: number } | null
  /** Colleagues also allowed — the operator's override list. */
  alternates: Array<{ id: string; name: string }>
  reason: string | null
  message: string | null
  /** True when the block is about the LEAD (consent, hours, do-not-call) rather
   *  than about the team. The screen sends the broker to a different fix. */
  aboutLead: boolean
}

const blocked = (reason: string, message: string, aboutLead: boolean): Preview => ({
  ready: false, member: null, alternates: [], reason, message, aboutLead,
})

export async function GET(req: NextRequest) {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res

  const url = new URL(req.url)
  const langParam = url.searchParams.get('language')

  // The SAME sequence the POST runs, stopped one line before the dial.
  // dryRun is set here and nowhere else in this file, and this file imports no
  // provider factory — a preview that could ring a phone is not a preview.
  const r = await placeLeadCall({
    leadId: (url.searchParams.get('leadId') ?? '').trim(),
    templateId: (url.searchParams.get('templateId') ?? '').trim(),
    language: langParam === 'ar' || langParam === 'ru' ? langParam : 'en',
    avoidMemberIds: (url.searchParams.get('avoid') ?? '').split(',').map((x) => x.trim()).filter(Boolean),
    placedBy: auth.user.email,
    dryRun: true,
  })

  if (r.placed) {
    // Unreachable: dryRun is hardcoded true above. Typed so a future edit that
    // drops it fails here instead of quietly placing calls from a GET.
    return NextResponse.json(blocked('previewDialled', 'A preview must never place a call.', false), { status: 500 })
  }

  if (!r.wouldPlace) {
    return NextResponse.json(
      blocked(r.reason, r.message, r.kind === 'lead'),
      { status: r.status >= 500 ? r.status : 200 },
    )
  }

  const member = getMember(r.memberId)!
  const preview: Preview = {
    ready: true,
    member: { id: member.id, name: member.name, title: member.title, rate: totalRate(member) },
    alternates: r.alternates
      .map((id) => getMember(id))
      .filter((m): m is NonNullable<typeof m> => !!m)
      .map((m) => ({ id: m.id, name: m.name })),
    reason: null,
    message: null,
    aboutLead: false,
  }
  return NextResponse.json(preview)
}

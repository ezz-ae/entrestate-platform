import type { Metadata } from 'next'
import Link from 'next/link'
import { Section, Eyebrow, Display, H2, H3, Lede, P, ButtonLink, Mono } from '@/components/business/ui'
import { GlowBand } from '@/components/business/visuals'
import {
  TARGETECT,
  TARGETECT_ACTS,
  TARGETECT_CLAIMS,
  TARGETECT_IDENTITY_RULE,
  TARGETECT_PAIRS,
  TARGETECT_PROMISE,
  type ClaimStatus,
  type TargetectAct,
  type TargetectClaim,
} from '@/lib/targetect/product'

/**
 * Targetect — the page, and the first thing targetect.com answers with.
 *
 * IT SAYS WHAT IS NOT BUILT. Most of this product is specified rather than
 * shipped, and the page prints that beside every claim instead of at the
 * bottom in grey. A reader deciding whether to trust the numbers a targeting
 * product will later show them is the last person to hand a page of ten green
 * ticks on day one — and the claim list this renders
 * (lib/targetect/product.ts) carries the status, so the page cannot quietly
 * promote a plan into a feature. scripts/targetect-test.ts fails the build if
 * it ever does.
 */

export const metadata: Metadata = {
  title: 'Targetect',
  description: TARGETECT_PROMISE,
  alternates: { canonical: TARGETECT.href },
}

const STATUS_LABEL: Record<ClaimStatus, string> = {
  shipped: 'Built',
  partial: 'Half built',
  specified: 'Not built yet',
}

const STATUS_TONE: Record<ClaimStatus, string> = {
  shipped: 'border-positive/40 text-positive-bright',
  partial: 'border-caution/40 text-caution-bright',
  specified: 'border-line text-ink-faint',
}

const ACT_ORDER: TargetectAct[] = ['spot', 'reach', 'touch']

function Claim({ claim }: { claim: TargetectClaim }) {
  return (
    <li className="border-t border-line py-7">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <H3>{claim.title}</H3>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-[3px] font-mono text-[10px] uppercase tracking-[0.14em] ${STATUS_TONE[claim.status]}`}
        >
          {STATUS_LABEL[claim.status]}
        </span>
      </div>
      <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-[1.65] text-ink-muted">{claim.body}</p>
      {claim.missing ? (
        <p className="mt-3 max-w-[62ch] text-[0.875rem] leading-[1.6] text-ink-faint">
          What is missing: {claim.missing}.
        </p>
      ) : null}
      {claim.engine ? (
        <div className="mt-3">
          <Mono>{claim.engine}</Mono>
        </div>
      ) : null}
    </li>
  )
}

export default function TargetectPage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-14 pt-16 lg:pb-20 lg:pt-24">
        <Eyebrow>Targetect · building audience</Eyebrow>
        <div className="mt-5 max-w-[52rem]">
          <Display>Where is your audience today?</Display>
        </div>
        <div className="mt-7 max-w-[60ch]">
          <Lede>{TARGETECT_PROMISE}</Lede>
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/business/contact">Talk to us</ButtonLink>
          <ButtonLink href="#what-exists" variant="ghost">What exists today</ButtonLink>
        </div>
      </Section>

      {/* ── The problem, in one scene ───────────────────────────────────── */}
      <GlowBand>
        <div className="mx-auto max-w-[64ch] text-center">
          <H2>To call Ali, Ali has to register.</H2>
          <div className="mt-6">
            <Lede>
              So the machine is built backwards. You buy a crowd of everyone who
              resembles him, you pay for the crowd, and you wait for one of them to fill
              a form before anybody is allowed to say a word. The resemblance costs full
              price and gets counted as if it were him.
            </Lede>
          </div>
          <div className="mt-6">
            <Lede>
              Targetect asks the question the other way round. Not build me an audience —
              where is he, today.
            </Lede>
          </div>
        </div>
      </GlowBand>

      {/* ── Spot · Reach · Touch ────────────────────────────────────────── */}
      <div id="what-exists">
      <Section className="py-16 lg:py-24">
        <div className="max-w-[46rem]">
          <H2>Spot him. Reach him. Touch the rest as themselves.</H2>
          <div className="mt-5">
            <Lede>
              Three acts, and each claim below says whether it is built, half built, or
              still only written down. Most of it is written down — this is a new
              product, and a page of ten green ticks on its first day is the least
              believable thing anybody could hand you.
            </Lede>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-14">
          {ACT_ORDER.map((act) => (
            <div key={act}>
              <div className="max-w-[52ch]">
                <H2>{TARGETECT_ACTS[act].title}</H2>
                <div className="mt-4">
                  <P>{TARGETECT_ACTS[act].body}</P>
                </div>
              </div>
              <ul className="mt-8">
                {TARGETECT_CLAIMS.filter((c) => c.act === act).map((c) => (
                  <Claim key={c.title} claim={c} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
      </div>

      {/* ── The rule that decides what spotting means ───────────────────── */}
      <GlowBand>
        <div className="mx-auto max-w-[64ch] text-center">
          <H2>Your people, not strangers.</H2>
          <div className="mt-6">
            <Lede>{TARGETECT_IDENTITY_RULE}</Lede>
          </div>
          <div className="mt-6">
            <Lede>
              A product that resolves a stranger by name from bought data is surveillance
              with a marketing name on it, and it stops working the week a platform
              closes the door. One that resolves your own people gets better every week
              you use it.
            </Lede>
          </div>
        </div>
      </GlowBand>

      {/* ── What it works with ──────────────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <div className="max-w-[46rem]">
          <H2>It works best with two things that already run.</H2>
          <div className="mt-5">
            <Lede>
              Spotting a person is worth nothing until somebody speaks to them. Both of
              the things that speak live on the Entrestate deployment Targetect shares —
              separate names, one address.
            </Lede>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TARGETECT_PAIRS.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              className="group rounded-2xl border border-line bg-surface p-7 shadow-(--shadow-card) transition hover:bg-surface-2"
            >
              <span aria-hidden className="block h-0.5 w-6 bg-brand" />
              <div className="mt-5 font-sans text-[1.35rem] font-semibold leading-[1.25] tracking-[-0.01em] text-ink">
                {p.name}
              </div>
              <p className="mt-2.5 text-[0.875rem] leading-[1.6] text-ink-faint">{p.body}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  )
}

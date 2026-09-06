/**
 * targetect.com — Targetect's own chrome.
 *
 * Targetect is not one of the Entrestate products, so it does not wear the
 * platform site's header (that is app/business/layout.tsx) and it must never
 * wear the brokerage property nav that the root layout renders — a visitor who
 * typed targetect.com looking for audience software met "Golden Visa" and
 * featured apartments, which is the same defect lib/tenancy/vendor-host.ts was
 * written for, one layer up. The suppression is in components/site-header.tsx,
 * site-footer.tsx and whatsapp-float.tsx, and scripts/targetect-test.ts holds
 * all three.
 *
 * The room is the family's dark theme. Separate product, separate name, same
 * house — and one design system beats a second one nobody maintains.
 *
 * Inside a tenant's own instance this tree does not exist at all: a broker's
 * customers must never meet the vendor's other products.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { SAAS_TENANCY, tenantSubdomainFromHost } from '@/lib/tenancy/config'
import { TARGETECT } from '@/lib/targetect/product'

export const metadata: Metadata = {
  title: {
    default: 'Targetect — where is your audience today?',
    template: '%s — Targetect',
  },
  description:
    'Audience building the other way round: spot the person you actually meant, reach them where they are today, and touch the people around them as themselves.',
  robots: SAAS_TENANCY ? undefined : { index: false, follow: false },
}

export default async function TargetectLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get('host')
  if (tenantSubdomainFromHost(host)) notFound()

  return (
    <div className="theme-terminal min-h-screen bg-app font-sans text-ink antialiased [color-scheme:dark] selection:bg-brand/25">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-6 py-5 lg:px-10">
          <Link href={TARGETECT.href} className="font-sans text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
            Targetect
          </Link>
          <Link
            href="/business/contact"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint transition hover:text-ink"
          >
            Talk to us
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 px-6 py-8 lg:px-10">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            {TARGETECT.domain}
          </span>
          <span className="text-[0.8125rem] text-ink-faint">
            Runs beside Leadformer and the caller, on the Entrestate deployment.
          </span>
        </div>
      </footer>
    </div>
  )
}

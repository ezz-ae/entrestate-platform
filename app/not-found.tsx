/**
 * The 404 every wrong address lands on — including a workspace that does not
 * exist.
 *
 * The wildcard DNS record makes every label under the base domain reach this
 * app, so this page is what a typo, a probe or a closed workspace sees. It is
 * written for that reader: it says the address is wrong without guessing which
 * of the three they are, and it offers the only two doors that are always
 * right — the platform's own site, and starting a workspace of their own.
 *
 * Deliberately free of tenant branding: on an unknown host there is no tenant
 * to brand it with, and dressing it in the vendor's identity would tell the
 * reader they had reached a company they had not.
 */
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#07090C] px-6 py-24 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#64748B]">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
        There is nothing at this address.
      </h1>
      <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-[#94A3B8]">
        The page may have moved, or this workspace address may never have existed.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="https://entrestate.com/business"
          className="rounded-lg bg-[#3B82F6] px-4 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#60A5FA]"
        >
          See the platform
        </Link>
        <Link
          href="https://entrestate.com/signup"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-[0.875rem] font-semibold text-white transition hover:border-white/30"
        >
          Start a workspace
        </Link>
      </div>
    </main>
  )
}

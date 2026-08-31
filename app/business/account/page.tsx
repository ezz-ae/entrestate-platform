import Link from "next/link"
import { Section, Grid, Eyebrow, PageHeader, H3, P } from "@/components/business/ui"
import { STORE } from "@/lib/freehold/app-store"
import { getTerminalUser } from "@/lib/terminal-session"
import { ensureBusinessAccount, listAccountApps } from "@/lib/terminal-account"
import { readAccountWallet, recentAccountPostings, TOPUP_MIN_AED, TOPUP_MAX_AED } from "@/lib/account-wallet"
import { submitTopUp } from "./actions"

/**
 * THE ACCOUNT PAGE — phase 3's surface. One identity (the Terminal's
 * sign-in), one account (phase 2's row), one wallet (Ads Coin, phase 3), and
 * the apps the account asked for — on one page the owner of that account can
 * read in ten seconds.
 *
 * The wallet block tells the truth the ledger tells: the balance is what the
 * double-entry postings sum to, a top-up is a REQUEST until a person
 * approves it in the finance screen, and the pending list says so in words.
 * Anonymous visitors get the same page shape with the Terminal's sign-in as
 * the door — recognition is a bonus, never a gate.
 */

export const metadata = {
  title: "Your account | Entrestate",
  robots: { index: false },
}

const TERMINAL_URL = "https://terminal.entrestate.com"

export default async function BusinessAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string }>
}) {
  const { topup } = await searchParams
  const user = await getTerminalUser()

  if (!user) {
    return (
      <Section className="py-24">
        <PageHeader
          eyebrow="Your account"
          title="One account carries all of it."
          lede="Market discovery comes with the Terminal account; the wallet, the apps and the workspace attach to that same account. Sign in on the Terminal and this page fills itself in."
        />
        <a href={`${TERMINAL_URL}/login`} className="bg-[#3B82F6] px-6 py-3 text-[0.9375rem] font-semibold text-white">
          Sign in on the Terminal
        </a>
      </Section>
    )
  }

  const account = await ensureBusinessAccount(user)
  const wallet = account ? await readAccountWallet(account) : null
  const postings = account ? await recentAccountPostings(account, 8) : []
  const apps = account ? await listAccountApps(account.id) : new Map<string, string>()
  const appRows = STORE.filter((p) => apps.has(p.id))

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title={account?.name ?? account?.email ?? "Your account"}
        lede="Everything you add — apps, coin, the workspace — lands here, on the one account."
        meta={[
          { k: "Signed in as", v: account?.email ?? "Terminal account" },
          { k: "Wallet", v: wallet ? `AED ${wallet.balanceAed}` : "—" },
          { k: "Apps on the account", v: String(appRows.length) },
        ]}
      />

      <Section className="pb-16">
        <Grid cols={2}>
          {/* ── The wallet ── */}
          <article className="bg-surface p-8 outline outline-1 outline-white/[0.07]">
            <Eyebrow className="mb-4">Ads Coin wallet</Eyebrow>
            {wallet ? (
              <>
                <div className="flex items-end gap-3">
                  <span className="text-[2rem] font-semibold leading-none text-white tabular-nums">AED {wallet.balanceAed}</span>
                  {Number(wallet.heldAed.replace(/,/g, "")) > 0 ? (
                    <span className="mb-1 text-[0.8125rem] text-ink-muted">+ AED {wallet.heldAed} held in running work</span>
                  ) : null}
                </div>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">{wallet.accountNo}</p>
                <P className="mt-4">
                  One coin, one ledger: campaigns, apps and the marketplace all settle against this balance. Top-ups are
                  confirmed by the team before coin lands — you see it here the moment it does.
                </P>

                {topup === "requested" ? (
                  <p className="mt-5 bg-[#3B82F6]/10 px-4 py-3 text-[0.875rem] text-[#93C5FD] outline outline-1 outline-[#3B82F6]/25">
                    Top-up recorded — the team confirms it and the balance updates right here.
                  </p>
                ) : topup === "bounds" ? (
                  <p className="mt-5 bg-surface px-4 py-3 text-[0.875rem] text-amber-300 outline outline-1 outline-amber-400/25">
                    Amounts between AED {TOPUP_MIN_AED.toLocaleString()} and AED {TOPUP_MAX_AED.toLocaleString()} — try again inside that range.
                  </p>
                ) : topup === "failed" ? (
                  <p className="mt-5 bg-surface px-4 py-3 text-[0.875rem] text-amber-300 outline outline-1 outline-amber-400/25">
                    That did not save — nothing was lost, try once more in a minute.
                  </p>
                ) : null}

                {wallet.pendingRequests.length > 0 ? (
                  <div className="mt-5 space-y-2">
                    {wallet.pendingRequests.map((r) => (
                      <p key={r.id} className="text-[0.8125rem] text-ink-muted">
                        AED {r.amountAed} — requested, waiting for the team&apos;s confirmation.
                      </p>
                    ))}
                  </div>
                ) : null}

                <form action={submitTopUp} className="mt-6 flex flex-wrap items-center gap-3">
                  <label className="text-[0.875rem] text-ink-muted" htmlFor="amount">Top up</label>
                  <input
                    id="amount"
                    name="amount"
                    inputMode="numeric"
                    placeholder={`AED ${TOPUP_MIN_AED}+`}
                    className="w-36 bg-[#0B0F17] px-3 py-2.5 text-[0.9375rem] text-white outline outline-1 outline-white/[0.12] placeholder:text-ink-faint focus:outline-[#3B82F6]/60"
                  />
                  <button type="submit" className="bg-[#3B82F6] px-5 py-2.5 text-[0.875rem] font-semibold text-white">
                    Request the top-up
                  </button>
                </form>
              </>
            ) : (
              <P>The wallet is reachable in a moment — refresh and it is here. Nothing about your account was lost.</P>
            )}
          </article>

          {/* ── The apps ── */}
          <article className="bg-surface p-8 outline outline-1 outline-white/[0.07]">
            <Eyebrow className="mb-4">Apps on this account</Eyebrow>
            {appRows.length === 0 ? (
              <>
                <H3>Market discovery is already on.</H3>
                <P className="mt-3">
                  Search, data and the advisor come with the account. Add the selling work — ads, pages, follow-up —
                  from the App Store, and each one lands on this page.
                </P>
              </>
            ) : (
              <ul className="space-y-4">
                {appRows.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.9375rem] font-medium text-white">{p.name}</p>
                      <p className="mt-0.5 text-[0.8125rem] text-ink-muted">{p.tagline}</p>
                    </div>
                    <span className={`mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] ${apps.get(p.id) === "active" ? "text-emerald-400" : "text-ink-muted"}`}>
                      {apps.get(p.id) === "active" ? "Active" : "Requested"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/business/store" className="mt-6 inline-block text-[0.875rem] font-medium text-[#3B82F6]">
              Open the App Store →
            </Link>
          </article>
        </Grid>
      </Section>

      {postings.length > 0 ? (
        <Section className="pb-24">
          <Eyebrow className="mb-4">Last movements</Eyebrow>
          <div className="divide-y divide-white/[0.06] bg-surface outline outline-1 outline-white/[0.07]">
            {postings.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-[0.875rem]">
                <span className="text-ink-muted">{p.kind}</span>
                <span className={`tabular-nums ${p.direction === "credit" ? "text-emerald-400" : "text-ink"}`}>
                  {p.direction === "credit" ? "+" : "−"} AED {p.amountAed}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  )
}

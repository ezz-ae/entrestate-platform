import Link from "next/link"
import { Section, Grid, Eyebrow, PageHeader, H3, P } from "@/components/business/ui"
import { STORE } from "@/lib/freehold/app-store"
import { getTerminalUser } from "@/lib/terminal-session"
import { ensureBusinessAccount, listAccountApps } from "@/lib/terminal-account"
import { readAccountWallet, recentAccountPostings, TOPUP_MIN_AED, TOPUP_MAX_AED } from "@/lib/account-wallet"
import { SAAS_TENANCY, TENANT_BASE_DOMAIN } from "@/lib/tenancy/config"
import { workspacesForAccount } from "@/lib/tenancy/account-workspace"
import { submitTopUp, createWorkspace, redeemOffer, humanFromHeaders } from "./actions"
import { issueOfferCode, readAccountCredit } from "@/lib/account-credit"

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

/** What each redemption outcome says, in words, on the page. */
const CREDIT_MESSAGE: Record<string, string> = {
  landed: "It is on your account. It comes off your next bills.",
  landed_ads: "Ad credit is on its way — the team confirms it and it shows in your ads wallet.",
  already: "That code already landed on this account.",
  already_claimed: "This one has already been used — once per person, and it has been.",
  not_yours: "That code was issued to another account.",
  unknown_code: "That code is not one of ours. Check the letters and try again.",
  not_eligible: "That code needs a plan this account is not on yet.",
  used_up: "That code has been claimed as many times as it could be.",
  expired: "That code has run its course — it is past its date.",
  not_yet: "That code is not open yet. Try again on its date.",
  paused: "That code is on hold for the moment. Try again later.",
  ended: "That code has been closed.",
  slow_down: "That is a lot of attempts in a row. Give it a few minutes.",
  failed: "That did not save on our side. Nothing was lost — try once more in a minute.",
}

/** What each workspace outcome says, in words, on the page. */
const WORKSPACE_MESSAGE: Record<string, string> = {
  taken: "That address is already in use — pick another and the rest carries over.",
  reserved: "That address is kept for the platform. Any other name works.",
  invalid_subdomain: "Use letters, numbers and hyphens — that is the whole rule.",
  company_required: "The workspace needs a name to put on it.",
  not_found: "That workspace is not on this account.",
  slow_down: "That is a lot of attempts in a row. Give it a few minutes.",
  store_unreachable: "That did not save on our side. Nothing was lost — try once more in a minute.",
  email_unverified: "Confirm your email on the Terminal first — the workspace is tied to it, so it has to be yours.",
}

export default async function BusinessAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string; workspace?: string; credit?: string }>
}) {
  const { topup, workspace, credit: creditFlag } = await searchParams
  const user = await getTerminalUser()

  if (!user) {
    return (
      <Section className="py-24">
        <PageHeader
          eyebrow="Your account"
          title="One account carries all of it."
          lede="Market discovery comes with the Terminal account; the wallet, the apps and the workspace attach to that same account. Sign in on the Terminal and this page fills itself in."
        />
        <a href={`${TERMINAL_URL}/login`} className="rounded-xl bg-brand px-6 py-3 text-[0.9375rem] font-semibold text-ink">
          Sign in on the Terminal
        </a>
      </Section>
    )
  }

  const account = await ensureBusinessAccount(user)
  // The welcome code is minted the first time the account is seen here —
  // once per human (device, network, email); the ledger refuses a second.
  if (account) await issueOfferCode(account, 'welcome', await humanFromHeaders())
  const credit = account ? await readAccountCredit(account) : null
  const wallet = account ? await readAccountWallet(account) : null
  const postings = account ? await recentAccountPostings(account, 8) : []
  const apps = account ? await listAccountApps(account.id) : new Map<string, string>()
  const appRows = STORE.filter((p) => apps.has(p.id))
  // The email on the VERIFIED Neon session is the key — see the header of
  // lib/tenancy/account-workspace.ts for why an email is safe to look up here
  // and unsafe to look up on a sign-in form.
  const workspaces = SAAS_TENANCY ? await workspacesForAccount(user) : []
  const workspaceNote = workspace ? WORKSPACE_MESSAGE[workspace] : null

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title={account?.name ?? account?.email ?? "Your account"}
        lede="Everything you add — apps, coin, the workspace — lands here, on the one account."
        meta={[
          { k: "Signed in as", v: account?.email ?? "Terminal account" },
          { k: "On your account", v: credit ? `AED ${credit.balanceAed}` : "—" },
          { k: "Ads wallet", v: wallet ? `AED ${wallet.balanceAed}` : "—" },
          { k: "Apps on the account", v: String(appRows.length) },
        ]}
      />

      {/*
        THE BALANCE. The owner: "this must FEEL like money — if he feels it is
        points, or any such talk, it will not work." So it is shown the way a
        bank shows it: an amount in AED, a statement beneath, and the code
        that puts money on it. No points, no coins, no percentages.
      */}
      {account && credit ? (
        <Section className="pb-10">
          <article className="rounded-2xl border border-line bg-surface p-8 shadow-(--shadow-card)">
            <Eyebrow className="mb-4">On your account</Eyebrow>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="text-[2.4rem] font-semibold leading-none tabular-nums text-ink">AED {credit.balanceAed}</span>
                {credit.pockets.length > 0 ? (
                  <p className="mt-2 text-[0.8125rem] text-ink-muted">
                    Of it, {credit.pockets.map((k, i) => (
                      <span key={k.scope}>{i > 0 ? " · " : ""}<span className="tabular-nums text-ink">AED {k.amountAed}</span> on {k.label}</span>
                    ))}.
                  </p>
                ) : null}
                <P className="mt-3 max-w-[44ch]">
                  Pays your bills here — the subscription, apps, pages. Each bill takes its share; what is left waits for the next one.
                </P>
              </div>
              <div className="flex flex-col gap-4">
                {credit.waiting.length > 0 ? (
                  <form action={redeemOffer} className="flex flex-col gap-2">
                    {credit.waiting.map((w) => (
                      <div key={w.code} className="flex flex-wrap items-center gap-3">
                        <span className="text-[0.8125rem] text-ink-muted">{w.headline}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        name="code"
                        defaultValue={credit.waiting[0].code}
                        readOnly
                        aria-label="Your code"
                        className="w-48 rounded-2xl border border-line bg-surface-2 px-3 py-2.5 font-mono text-[0.9375rem] tracking-[0.08em] text-ink"
                      />
                      <button type="submit" className="rounded-xl bg-brand px-5 py-2.5 text-[0.875rem] font-semibold text-brand-ink">
                        Redeem
                      </button>
                    </div>
                  </form>
                ) : null}
                {/* A coupon from a coupon site, or a voucher somebody bought — typed here, same button. */}
                <form action={redeemOffer} className="flex flex-col gap-2">
                  <label htmlFor="coupon" className="text-[0.8125rem] text-ink-muted">Have a coupon or a voucher?</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="coupon"
                      name="code"
                      placeholder="V500-K7PM-Q2XD"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-48 rounded-2xl border border-line bg-surface-2 px-3 py-2.5 font-mono text-[0.9375rem] tracking-[0.08em] text-ink placeholder:text-ink-faint focus:outline-brand/60"
                    />
                    <button type="submit" className="rounded-xl border border-line-strong bg-surface-2 px-5 py-2.5 text-[0.875rem] font-semibold text-ink">
                      Add it
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {creditFlag ? (
              <p className={`mt-5 rounded-xl border px-4 py-3 text-[0.875rem] ${
                creditFlag === "landed" || creditFlag === "landed_ads" ? "border-positive/40 bg-positive/10 text-ink" : "border-caution/40 bg-caution/10 text-ink"
              }`}>
                {CREDIT_MESSAGE[creditFlag] ?? CREDIT_MESSAGE.failed}
              </p>
            ) : null}

            {credit.recent.length > 0 ? (
              <ul className="mt-6 divide-y divide-line border-t border-line">
                {credit.recent.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 py-3 text-[0.875rem]">
                    <span className="min-w-0 truncate text-ink-muted">{r.memo}</span>
                    <span className={`shrink-0 font-mono tabular-nums ${r.kind === "grant" ? "text-positive-bright" : "text-ink"}`} dir="ltr">
                      {r.kind === "grant" ? "+" : "−"} AED {r.amountAed}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </Section>
      ) : null}

      {/*
        THE WORKSPACE. This block exists because the account could be seen and
        not entered: the workspace lives on its own host with its own cookie,
        and the only way in was a password nobody set. "Open" mints a
        two-minute claim token on the tenant host — one account, one password,
        and it is the one already used to get here.
      */}
      {SAAS_TENANCY ? (
        <Section className="pb-10">
          <article className="bg-surface p-8 rounded-2xl border border-line shadow-(--shadow-card)">
            <Eyebrow className="mb-4">Your workspace</Eyebrow>

            {workspaceNote ? (
              <p className="mb-5 rounded-xl border border-caution/40 bg-caution/10 px-4 py-3 text-[0.875rem] text-ink">
                {workspaceNote}
              </p>
            ) : null}

            {!user.emailVerified ? (
              <>
                <H3>One step before the workspace.</H3>
                <P className="mt-3">
                  The workspace is tied to your email, so the email has to be confirmed first. Open the verification
                  message from the Terminal, then come back — the form is waiting here.
                </P>
                <a href={`${TERMINAL_URL}/account`} className="mt-6 inline-block text-[0.875rem] font-medium text-brand">
                  Confirm it on the Terminal →
                </a>
              </>
            ) : workspaces.length > 0 ? (
              <ul className="divide-y divide-line">
                {workspaces.map((w) => (
                  <li key={w.subdomain} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0">
                    <div>
                      <p className="text-[0.9375rem] font-medium text-ink">{w.company}</p>
                      <p className="mt-0.5 font-mono text-[11px] tracking-[0.06em] text-ink-faint">
                        {w.subdomain}.{TENANT_BASE_DOMAIN}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${w.status === "active" ? "text-emerald-400" : "text-ink-muted"}`}>
                        {w.status === "trial" ? "Starting" : w.status === "active" ? "Active" : "Paused"}
                      </span>
                      <a
                        href={`/api/account/workspace/enter?sub=${encodeURIComponent(w.subdomain)}`}
                        className="rounded-xl bg-brand px-5 py-2.5 text-[0.875rem] font-semibold text-ink"
                      >
                        Open the workspace
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <H3>Give the work a place to live.</H3>
                <P className="mt-3">
                  Your workspace carries the inventory, the campaigns, the leads and the team — on your own address, in
                  your own brand. It opens with this account: there is no second sign-in to remember.
                </P>
                <form action={createWorkspace} className="mt-6 flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8125rem] text-ink-muted">Company</span>
                    <input
                      name="company"
                      placeholder="Marina Realty"
                      className="w-56 bg-surface-2 px-3 py-2.5 text-[0.9375rem] text-ink rounded-2xl border border-line shadow-(--shadow-card) placeholder:text-ink-faint focus:outline-brand/60"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8125rem] text-ink-muted">Address</span>
                    <span className="flex items-center">
                      <input
                        name="subdomain"
                        placeholder="marina"
                        className="w-40 bg-surface-2 px-3 py-2.5 text-[0.9375rem] text-ink rounded-2xl border border-line shadow-(--shadow-card) placeholder:text-ink-faint focus:outline-brand/60"
                      />
                      <span className="ml-2 font-mono text-[12px] text-ink-faint">.{TENANT_BASE_DOMAIN}</span>
                    </span>
                  </label>
                  <button type="submit" className="rounded-xl bg-brand px-5 py-2.5 text-[0.875rem] font-semibold text-ink">
                    Create the workspace
                  </button>
                </form>
              </>
            )}
          </article>
        </Section>
      ) : null}

      <Section className="pb-16">
        <Grid cols={2}>
          {/* ── The wallet ── */}
          <article className="bg-surface p-8 rounded-2xl border border-line shadow-(--shadow-card)">
            <Eyebrow className="mb-4">Ads Coin wallet</Eyebrow>
            {wallet ? (
              <>
                <div className="flex items-end gap-3">
                  <span className="text-[2rem] font-semibold leading-none text-ink tabular-nums">AED {wallet.balanceAed}</span>
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
                  <p className="mt-5 rounded-xl border border-brand/25 bg-brand/10 px-4 py-3 text-[0.875rem] text-brand">
                    Top-up recorded — the team confirms it and the balance updates right here.
                  </p>
                ) : topup === "bounds" ? (
                  <p className="mt-5 rounded-xl border border-caution/40 bg-caution/10 px-4 py-3 text-[0.875rem] text-ink">
                    Amounts between AED {TOPUP_MIN_AED.toLocaleString()} and AED {TOPUP_MAX_AED.toLocaleString()} — try again inside that range.
                  </p>
                ) : topup === "failed" ? (
                  <p className="mt-5 rounded-xl border border-caution/40 bg-caution/10 px-4 py-3 text-[0.875rem] text-ink">
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
                    className="w-36 bg-surface-2 px-3 py-2.5 text-[0.9375rem] text-ink rounded-2xl border border-line shadow-(--shadow-card) placeholder:text-ink-faint focus:outline-brand/60"
                  />
                  <button type="submit" className="rounded-xl bg-brand px-5 py-2.5 text-[0.875rem] font-semibold text-ink">
                    Request the top-up
                  </button>
                </form>
              </>
            ) : (
              <P>The wallet is reachable in a moment — refresh and it is here. Nothing about your account was lost.</P>
            )}
          </article>

          {/* ── The apps ── */}
          <article className="bg-surface p-8 rounded-2xl border border-line shadow-(--shadow-card)">
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
                      <p className="text-[0.9375rem] font-medium text-ink">{p.name}</p>
                      <p className="mt-0.5 text-[0.8125rem] text-ink-muted">{p.tagline}</p>
                    </div>
                    <span className={`mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] ${apps.get(p.id) === "active" ? "text-emerald-400" : "text-ink-muted"}`}>
                      {apps.get(p.id) === "active" ? "Active" : "Requested"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/business/store" className="mt-6 inline-block text-[0.875rem] font-medium text-brand">
              Open the App Store →
            </Link>
          </article>
        </Grid>
      </Section>

      {postings.length > 0 ? (
        <Section className="pb-24">
          <Eyebrow className="mb-4">Last movements</Eyebrow>
          <div className="divide-y divide-line bg-surface rounded-2xl border border-line shadow-(--shadow-card)">
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

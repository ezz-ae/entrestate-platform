import Link from "next/link"
import { Section, PageHeader, P } from "@/components/business/ui"
import { STORE } from "@/lib/freehold/app-store"
import { getTerminalUser } from "@/lib/terminal-session"
import { ensureBusinessAccount, requestApp } from "@/lib/terminal-account"
import { getLeadershipLeadRecipients, sendSystemEmail } from "@/lib/transactional-email"

/**
 * PHASE 2's INSTALL FLOW — the door the store's "Start with this app" opens.
 *
 * Before this, every card pointed at /signup: a Terminal account holder who
 * clicked an app was asked to create a second identity, which is exactly the
 * split the account foundation exists to end. Now the click lands on the
 * ONE account:
 *
 *   · Signed in (the shared .entrestate.com session) → the app is recorded
 *     on the business account (find-or-create, lib/terminal-account.ts) as a
 *     request, leadership is emailed once — a request IS a sales signal —
 *     and the page says exactly what happens next.
 *   · Anonymous → the page explains that apps attach to the Terminal
 *     account and points at the Terminal's sign-in. No second funnel, no
 *     second identity.
 *
 * The copy follows the standing rules: benefit before description, and the
 * included layer is named — never the banned word.
 */

export const metadata = {
  title: "Add an app | Entrestate",
  robots: { index: false },
}

const TERMINAL_URL = "https://terminal.entrestate.com"

export default async function StoreStartPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>
}) {
  const { app: appId } = await searchParams
  const product = STORE.find((p) => p.id === (appId ?? "").trim())

  if (!product) {
    return (
      <Section className="py-24">
        <PageHeader
          eyebrow="Entrestate App Store"
          title="That app isn't in the catalog."
          lede="Pick an app from the store and its card brings you here with the right one."
        />
        <Link href="/business/store" className="text-[0.9375rem] font-medium text-brand">
          Back to the App Store →
        </Link>
      </Section>
    )
  }

  const user = await getTerminalUser()

  if (!user) {
    return (
      <Section className="py-24">
        <PageHeader
          eyebrow={product.name}
          title="Apps land on your account."
          lede={`${product.tagline} Sign in on the Terminal — market discovery comes with the account — and ${product.name} attaches to that same account the moment you add it.`}
        />
        <div className="flex flex-wrap items-center gap-6">
          <a
            href={`${TERMINAL_URL}/login`}
            className="rounded-xl bg-brand px-6 py-3 text-[0.9375rem] font-semibold text-ink"
          >
            Open your account on the Terminal
          </a>
          <Link href="/business/store" className="text-[0.9375rem] text-ink-muted">
            Back to the store
          </Link>
        </div>
      </Section>
    )
  }

  const account = await ensureBusinessAccount(user)
  const request = account ? await requestApp(account.id, product.id) : null

  // A request is a person raising their hand — leadership hears about it the
  // moment it happens, once. Best-effort: the page must render regardless.
  if (account && request?.created) {
    void (async () => {
      try {
        const { emails } = await getLeadershipLeadRecipients()
        if (emails.length) {
          await sendSystemEmail({
            to: emails,
            subject: `App Store request: ${product.name}`,
            headline: `${account.name ?? account.email ?? "A Terminal account"} asked for ${product.name}`,
            lines: [
              `Account: ${account.email ?? account.neonUserId}`,
              `App: ${product.name} (${product.id})`,
              "Recorded on the business account — activate it and tell them.",
            ],
          })
        }
      } catch (err) {
        console.error("[store-start] leadership alert failed", err)
      }
    })()
  }

  const alreadyActive = request?.status === "active"

  return (
    <Section className="py-24">
      <PageHeader
        eyebrow={product.name}
        title={
          !request
            ? "Almost — we could not record that just now."
            : alreadyActive
              ? `${product.name} is already on your account.`
              : `${product.name} is on your account's list.`
        }
        lede={
          !request
            ? "Your account is signed in, but the request did not save. Try once more in a minute — nothing was lost."
            : alreadyActive
              ? "Open the Terminal and it is there, working."
              : `Recorded for ${account?.name ?? account?.email ?? "your account"}. The team activates it on this same account and you hear back by email — no second sign-up, nothing to configure.`
        }
      />
      <div className="flex flex-wrap items-center gap-6">
        <a href={`${TERMINAL_URL}/me`} className="rounded-xl bg-brand px-6 py-3 text-[0.9375rem] font-semibold text-ink">
          Open your account
        </a>
        <Link href="/business/store" className="text-[0.9375rem] text-ink-muted">
          Add another app
        </Link>
      </div>
      <div className="mt-10">
        <P className="text-ink-faint">
          Market discovery — search, data, the advisor — is already on every account. Apps add the selling work on top.
        </P>
      </div>
    </Section>
  )
}

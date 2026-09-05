import Link from "next/link"
import { Section, Grid, Eyebrow, PageHeader, H3, P } from "@/components/business/ui"
import { STORE, BILLING_LABELS } from "@/lib/freehold/app-store"
import { getTerminalUser } from "@/lib/terminal-session"
import { ensureBusinessAccount, listAccountApps, type AppRequestStatus } from "@/lib/terminal-account"

/**
 * THE ENTRESTATE APP STORE — the public one.
 *
 * The catalog in lib/freehold/app-store.ts had exactly one page, and that
 * page lives INSIDE a client's signed-in workspace: a prospect following a
 * store link landed on someone else's login, under someone else's name. The
 * owner's rule ends that: the client is a client — his workspace, his
 * sessions, his data and his leads stay exactly as they run today — and the
 * store Entrestate SELLS from wears Entrestate's name on Entrestate's
 * surface.
 *
 * Same catalog, second reader: this page and the client's in-workspace page
 * both render lib/freehold/app-store.ts, so a price or a plan gate can never
 * disagree between them. The Terminal's account area links HERE.
 *
 * THE COPY RULE, from the owner: benefit before description — always. The
 * first headline here was "The tools are the product.", a sentence about US;
 * his correction: "خلينا نركز في المحتوى دايماً على الفايدة مش على الوصف" and
 * he wrote the replacement himself. Every line on this page states what the
 * reader GETS, not what the software is. And the included layer is never
 * called "free" — his word ban: "بلاش نستخدم فري لأنها دايماً بتعطي انطباع
 * بالغير أهمية" — it is named for what it is: market discovery.
 *
 * DRESS CODE. The first cut of this page wore the OTHER design system's
 * tokens (bg-card, text-primary, rounded-2xl) — on /business those resolve
 * to the light theme, and the live page rendered washed-out grey cards on
 * the dark vendor ground. Everything visual here now comes from
 * components/business/ui and the home page's tile vocabulary (bg-surface,
 * hairline outlines, ink-muted text, the one blue accent), so this page
 * reads as a page of the business site, not a guest wearing the wrong suit.
 */

export const metadata = {
  title: "App Store | Entrestate",
  description:
    "The working tools Entrestate sells — Meta advertising, lead capture, landing pages and more. One account, add what your business needs.",
  alternates: { canonical: "/business/store" },
}

export default async function EntrestateStorePage() {
  // Phase 1 of the account foundation: the shared .entrestate.com session —
  // recognition is a bonus, never a gate (null renders the anonymous page).
  const terminalUser = await getTerminalUser()
  // Phase 2: recognition lands on a ROW. Find-or-create the business account
  // and read what it already asked for, so the cards tell the truth instead
  // of offering the same start twice. All fail-soft — the store renders for
  // everyone whether or not the account layer is reachable.
  const account = terminalUser ? await ensureBusinessAccount(terminalUser) : null
  const requested: Map<string, AppRequestStatus> = account ? await listAccountApps(account.id) : new Map()
  const live = STORE.filter((product) => product.status === "live")
  const planned = STORE.filter((product) => product.status === "planned")

  return (
    <>
      <PageHeader
        eyebrow="Entrestate App Store"
        title="Everything you need to find the next qualified lead."
        lede="Market discovery — search, data, the advisor — comes with the Terminal account. These apps do the selling work — ads that find buyers, pages that capture them, follow-up that closes them — inside your own workspace, on your own account."
        meta={[
          { k: "Market discovery", v: "With every account" },
          { k: "Available now", v: `${live.length} apps` },
          { k: "Being built", v: `${planned.length} more` },
        ]}
      />

      {terminalUser ? (
        <Section className="pb-10">
          <div className="flex items-center gap-3 bg-surface px-5 py-3.5 rounded-2xl border border-brand/25 shadow-(--shadow-card)">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
            <p className="text-[0.875rem] text-ink-muted">
              Signed in as <span className="text-ink">{terminalUser.name ?? terminalUser.email ?? "your Terminal account"}</span>
              {" — apps you add here land on this same account."}
            </p>
          </div>
        </Section>
      ) : null}

      <Section className="pb-16">
        <Eyebrow className="mb-4">Available now</Eyebrow>
        <Grid cols={3}>
          {live.map((product) => (
            <article
              key={product.id}
              id={product.id}
              className="group flex flex-col bg-surface p-8 rounded-2xl border border-line shadow-(--shadow-card) transition hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-3">
                <H3>{product.name}</H3>
                <span className="mt-0.5 shrink-0 rounded-full bg-surface-2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted ring-1 ring-line">
                  {product.tier === "lite" ? "Lite" : "Full"}
                </span>
              </div>
              <div className="mt-3 flex-1">
                <P>{product.tagline}</P>
                {/* Phase 4 — the app's own economics, as catalog facts: how it
                    charges, what ships inside it, what it installs onto. */}
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  {BILLING_LABELS[product.billing]}
                </p>
                {(product.includes ?? []).length > 0 ? (
                  <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
                    Ships with {(product.includes ?? []).map((id) => STORE.find((x) => x.id === id)?.name ?? id).join(", ")} inside.
                  </p>
                ) : null}
                {(product.installsOn ?? []).length > 0 ? (
                  <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
                    Installs onto {(product.installsOn ?? []).map((id) => STORE.find((x) => x.id === id)?.name ?? id).join(", ")}.
                  </p>
                ) : null}
              </div>
              {requested.get(product.id) === "active" ? (
                <p className="mt-6 text-[0.875rem] font-medium text-emerald-400">On your account — open the Terminal.</p>
              ) : requested.get(product.id) === "requested" ? (
                <p className="mt-6 text-[0.875rem] font-medium text-ink-muted">On your account&apos;s list — the team is on it.</p>
              ) : (
                <Link
                  href={`/business/store/start?app=${product.id}`}
                  className="mt-6 inline-flex items-baseline gap-1.5 text-[0.875rem] font-medium text-brand"
                >
                  Start with this app
                  <span aria-hidden className="opacity-0 transition group-hover:opacity-100">
                    →
                  </span>
                </Link>
              )}
            </article>
          ))}
        </Grid>
      </Section>

      {planned.length > 0 ? (
        <Section className="pb-24">
          <Eyebrow className="mb-4">Being built</Eyebrow>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planned.map((product) => (
              <article
                key={product.id}
                id={product.id}
                className="border border-dashed border-line p-8"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[1.0625rem] font-semibold leading-snug text-ink-muted">{product.name}</h3>
                  <span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    In build
                  </span>
                </div>
                <p className="mt-3 text-[0.9375rem] leading-[1.7] text-ink-faint">{product.tagline}</p>
                <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  It appears here the day it opens.
                </p>
              </article>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  )
}

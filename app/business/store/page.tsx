import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { STORE } from "@/lib/freehold/app-store"

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
 */

export const metadata = {
  title: "App Store | Entrestate",
  description:
    "The working tools Entrestate sells — Meta advertising, lead capture, landing pages and more. One account, add what your business needs.",
  alternates: { canonical: "/business/store" },
}

export default function EntrestateStorePage() {
  const live = STORE.filter((product) => product.status === "live")
  const planned = STORE.filter((product) => product.status === "planned")

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Entrestate App Store</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          The tools are the product.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Search and market data stay free on the Terminal. These are the working tools we sell —
          each one runs inside your own workspace, on your own account.
        </p>
      </header>

      <section aria-label="Available now" className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Available now</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((product) => (
            <article
              key={product.id}
              id={product.id}
              className="flex flex-col rounded-2xl border border-border/60 bg-card/60 p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{product.name}</h3>
                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {product.tier === "lite" ? "Lite" : "Full"}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{product.tagline}</p>
              <Link
                href="/signup"
                className="mt-5 inline-flex items-center text-sm font-semibold text-primary hover:underline"
              >
                Start with this app <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {planned.length > 0 ? (
        <section aria-label="Being built" className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Being built</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planned.map((product) => (
              <article
                key={product.id}
                id={product.id}
                className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6"
              >
                <h3 className="font-semibold text-muted-foreground">{product.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground/80">{product.tagline}</p>
                <p className="mt-4 text-xs text-muted-foreground">In build — it appears here the day it opens.</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}

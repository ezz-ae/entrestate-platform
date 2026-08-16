import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ColumnRegistryTable } from "@/components/registry/column-registry-table"
import Link from "next/link"

export default function ColumnRegistryPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-28">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
          Column Registry
        </p>
        <h1 className="mt-3 text-3xl font-serif font-semibold tracking-tight text-foreground lg:text-4xl">
          Single source of truth for every signal, tier, and tier gate
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground leading-relaxed">
          The Column Registry defines the 55+ fields that power timing, stress, yield, and clearance within the Decision Tunnel. Each entry includes the evidence layer, tier access, metadata source, and a short description so you can understand why every verdict is auditable.
        </p>

        <div className="mt-8 space-y-8">
          <ColumnRegistryTable limit={12} />
          <section className="rounded-2xl border border-border/70 bg-card/60 p-6">
            <h2 className="text-lg font-semibold text-foreground">Tier gating + enforcement</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The tier gate middleware reads this registry (versioned alongside the code) and removes any columns above a user’s tier before the query even runs. Every API response notes which registry version served the data so you can trace a vision chain from the UI back into the Column Registry row.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Need to confirm a column for your tier? Open the Evidence Drawer for any project and the provenance block cites the registry ID plus the Request ID run that issued it.
            </p>
          </section>
          <section className="rounded-2xl border border-primary/40 bg-primary/10 p-6">
            <h2 className="text-lg font-semibold text-foreground">Next actions</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the registry as your checklist before building new pages: reference the column ID, check the tier label, and surface the Evidence Drawer link so compliance teams can verify the calculation path.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/evidence/Marina%20Vista"
                className="rounded-full border border-primary/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary transition hover:bg-primary/10"
              >
                View Evidence Drawer
              </Link>
              <Link
                href="/execution"
                className="rounded-full border border-border/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground transition hover:border-primary/40"
              >
                Review execution spine
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}

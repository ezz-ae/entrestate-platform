"use client"

import { TRUST_COPY, formatProvenance, type NotebookProvenanceLike, type TrustConfidence } from "@/lib/copy/trust"
import { ConfidenceBadge } from "@/components/ConfidenceBadge"

export type EvidenceBlock = {
  sources_used?: unknown[]
  exclusions?: unknown[]
  assumptions?: unknown[]
  calculation_steps?: unknown[]
  confidence?: TrustConfidence
}

export type TierContext = {
  tier?: string | null
  gated_columns?: string[]
  upgrade_cta?: string | null
}

type EvidenceDrawerProps = {
  evidence: EvidenceBlock
  provenance: NotebookProvenanceLike
  tierContext?: TierContext
}

function renderItems(items: unknown[] | undefined, fallback: string) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">{fallback}</p>
  }

  return (
    <ul className="space-y-2 text-sm text-foreground">
      {items.map((item, index) => (
        <li key={index} className="rounded-lg border border-border/50 bg-background/60 px-3 py-2">
          {typeof item === "string" ? item : JSON.stringify(item)}
        </li>
      ))}
    </ul>
  )
}

export function EvidenceDrawer({
  evidence,
  provenance,
  tierContext,
}: EvidenceDrawerProps) {
  const footer = formatProvenance(provenance)

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{TRUST_COPY.evidence_drawer.header}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{footer}</p>
        </div>
        {evidence.confidence ? <ConfidenceBadge confidence={evidence.confidence} /> : null}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {TRUST_COPY.evidence_drawer.sources_label}
          </h4>
          {renderItems(evidence.sources_used, "Not available")}
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {TRUST_COPY.evidence_drawer.exclusions_label}
          </h4>
          {renderItems(evidence.exclusions, TRUST_COPY.evidence_drawer.no_exclusions_copy.replace("{policy_version}", "current"))}
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {TRUST_COPY.evidence_drawer.assumptions_label}
          </h4>
          {renderItems(evidence.assumptions, "Not available")}
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {TRUST_COPY.evidence_drawer.steps_label}
          </h4>
          {renderItems(evidence.calculation_steps, "Not available")}
        </section>
      </div>

      {tierContext?.upgrade_cta ? (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
          {tierContext.upgrade_cta}
        </div>
      ) : null}
    </div>
  )
}

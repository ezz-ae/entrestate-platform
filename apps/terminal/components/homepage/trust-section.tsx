import { TrustBar } from "@/components/decision/trust-bar"

type Props = {
  verifiedRows: number
  highConfidencePct: number
  updatedAt: string
  title?: string
  methodology?: string
}

export function TrustSection({
  verifiedRows,
  highConfidencePct,
  updatedAt,
  title = "Verify Every Assumption",
  methodology = "L1 Canonical → L2 Derived → L3 Dynamic → L4 External → L5 Raw",
}: Props) {
  return (
    <section className="mt-8">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">5-Layer Evidence Stack</h2>
      <p className="mt-2 text-sm text-muted-foreground">{methodology}</p>
      <div className="mt-4">
        <TrustBar verifiedRows={verifiedRows} highConfidencePct={highConfidencePct} updatedAt={updatedAt} />
      </div>
    </section>
  )
}

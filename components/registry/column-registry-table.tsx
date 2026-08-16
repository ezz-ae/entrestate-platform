import Link from "next/link"
import { ColumnDefinition, COLUMN_REGISTRY, EvidenceLayer, LAYER_LABELS, TIER_LABELS } from "@/lib/registry/columns"
import { prefixLocalePath } from "@/i18n/locale"

type Props = {
  title?: string
  columns?: ColumnDefinition[]
  limit?: number
}

const GROUP_COLORS: Record<string, string> = {
  Identity: "text-blue-400",
  Geography: "text-sky-400",
  Price: "text-emerald-400",
  Temporal: "text-amber-400",
  Scoring: "text-violet-400",
  Risk: "text-red-400",
  Yield: "text-emerald-500",
  Developer: "text-fuchsia-400",
  Quality: "text-indigo-400",
  Contract: "text-amber-500",
  Operations: "text-slate-400",
}

export function ColumnRegistryTable({ title = "Column Registry v1.0", columns = COLUMN_REGISTRY, limit = 12 }: Props) {
  const slice = columns.slice(0, limit)

  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">Column Registry</p>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        </div>
        <Link
          href={prefixLocalePath("/column-registry", "en")}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:underline"
        >
          View full spec
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {slice.map((column) => (
          <article key={column.id} className="rounded-xl border border-border/40 bg-background/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{column.label}</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground/60">{column.id}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-wide">
                <span className="rounded-full border border-foreground/20 px-2 py-0.5 text-muted-foreground">{column.group}</span>
                <span className={`rounded-full border px-2 py-0.5 ${GROUP_COLORS[column.group] ?? "border-border/30 text-muted-foreground"}`}>
                  {LAYER_LABELS[column.layer]}
                </span>
                <span className="rounded-full border border-primary/30 px-2 py-0.5 text-primary">{TIER_LABELS[column.tier]}</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{column.description}</p>
            <p className="mt-1 text-[11px] font-mono text-muted-foreground/70">
              Source: {column.source.toUpperCase()} · Type: {column.dataType}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}

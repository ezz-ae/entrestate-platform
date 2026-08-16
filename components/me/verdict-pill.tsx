import { cn } from "@/lib/utils"

interface Props {
  verdict?: string | null
  confidence?: number | null
}

const STYLES: Record<string, string> = {
  STRONG_BUY: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  BUY: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  HOLD: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/60 dark:text-zinc-200",
  WAIT: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  AVOID: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200",
}

export function VerdictPill({ verdict, confidence }: Props) {
  if (!verdict) return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-zinc-100 dark:bg-zinc-800 text-zinc-500">SCORING…</span>
  const cls = STYLES[verdict] ?? STYLES.HOLD
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap", cls)}>
      {verdict}{typeof confidence === "number" ? ` · ${Math.round(confidence)}%` : ""}
    </span>
  )
}

"use client"

import { ShieldCheck, Database, Clock } from "lucide-react"
import { useLocale } from "next-intl"

type TrustBarProps = {
  verifiedRows?: number
  highConfidencePct?: number
  updatedAt?: string | null
}

function formatUpdatedAt(value: string | null | undefined, locale: string) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(locale === "ar" ? "ar-AE" : "en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export function TrustBar({ verifiedRows, highConfidencePct, updatedAt }: TrustBarProps) {
  const locale = useLocale()
  const isArabic = locale === "ar"
  const highConfStr =
    typeof highConfidencePct === "number" && Number.isFinite(highConfidencePct)
      ? `${highConfidencePct.toFixed(1)}%`
      : "—"

  return (
    <div className="flex flex-wrap items-center gap-px overflow-hidden rounded-xl border border-border/60 bg-card/60 text-xs">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-medium text-foreground">{isArabic ? "بيانات متحققة" : "Verified data"}</span>
      </div>
      <div className="h-4 w-px bg-border/60" />
      <div className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground">
        <Database className="h-3.5 w-3.5 text-sky-400" />
        <span><span className="font-medium text-foreground">{verifiedRows?.toLocaleString(isArabic ? "ar-AE" : "en-US") ?? "—"}</span> {isArabic ? "صفوف" : "rows"}</span>
      </div>
      <div className="h-4 w-px bg-border/60" />
      <div className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span><span className="font-medium text-foreground">{highConfStr}</span> {isArabic ? "ثقة عالية" : "high confidence"}</span>
      </div>
      <div className="h-4 w-px bg-border/60" />
      <div className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>{isArabic ? "تم التحديث" : "Updated"} <span className="font-medium text-foreground">{formatUpdatedAt(updatedAt, locale)}</span></span>
      </div>
    </div>
  )
}

"use client"

import { Building, Gem, Home, MapPin, ShieldCheck, Tag, TrendingUp, Trophy } from "lucide-react"
import { useLocale } from "next-intl"
import { getNotificationStyle } from "@/lib/dld/notification-styles"
import { formatAed } from "@/lib/format/currency"

type DldFeedEntry = {
  headline: string
  subline: string
  amount: number
  badge: string | null
  reg_type: string
  prop_type: string
  is_notable: boolean
}

const ICON_MAP = {
  trophy: Trophy,
  "shield-check": ShieldCheck,
  "trending-up": TrendingUp,
  building: Building,
  home: Home,
  tag: Tag,
  gem: Gem,
  "map-pin": MapPin,
} as const

export function TransactionNotification({ txn }: { txn: DldFeedEntry }) {
  const locale = useLocale()
  const style = getNotificationStyle(txn)
  const Icon = ICON_MAP[style.icon as keyof typeof ICON_MAP] || Tag

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${style.color} ${style.accent} ${
        style.prominence === "high" ? "border-l-4" : "border-l-2"
      }`}
    >
      <div className="relative mt-0.5">
        <Icon className="h-4 w-4" />
        {style.pulse ? <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-current" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{txn.headline}</p>
        <p className="truncate text-xs opacity-70">{txn.subline}</p>
      </div>
      <span className="whitespace-nowrap text-xs font-mono">
        {formatAed(txn.amount, locale, { compact: true, fallback: "—" })}
      </span>
    </div>
  )
}

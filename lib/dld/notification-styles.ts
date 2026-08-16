export type NotificationStyle = {
  variant: "mega" | "golden-visa" | "premium" | "standard" | "entry" | "land" | "above-market"
  color: string
  accent: string
  icon: string
  prominence: "high" | "medium" | "low"
  pulse: boolean
}

export function getNotificationStyle(txn: {
  amount: number
  badge: string | null
  reg_type: string
  prop_type: string
  is_notable: boolean
}): NotificationStyle {
  if (txn.amount >= 10_000_000 || txn.badge === "mega-deal") {
    return {
      variant: "mega",
      color: "bg-amber-50 dark:bg-amber-950/30",
      accent: "border-amber-500 text-amber-700 dark:text-amber-400",
      icon: "trophy",
      prominence: "high",
      pulse: true,
    }
  }

  if (txn.badge === "above-market") {
    return {
      variant: "above-market",
      color: "bg-red-50 dark:bg-red-950/30",
      accent: "border-red-500 text-red-700 dark:text-red-400",
      icon: "trending-up",
      prominence: "high",
      pulse: true,
    }
  }

  if (txn.badge === "golden-visa" || txn.amount >= 2_000_000) {
    return {
      variant: "golden-visa",
      color: "bg-yellow-50 dark:bg-yellow-950/30",
      accent: "border-yellow-500 text-yellow-700 dark:text-yellow-400",
      icon: "shield-check",
      prominence: "high",
      pulse: false,
    }
  }

  if (txn.prop_type === "Land") {
    return {
      variant: "land",
      color: "bg-green-50 dark:bg-green-950/30",
      accent: "border-green-500 text-green-700 dark:text-green-400",
      icon: "map-pin",
      prominence: "medium",
      pulse: false,
    }
  }

  if (txn.amount >= 3_000_000) {
    return {
      variant: "premium",
      color: "bg-purple-50 dark:bg-purple-950/30",
      accent: "border-purple-500 text-purple-700 dark:text-purple-400",
      icon: "gem",
      prominence: "medium",
      pulse: false,
    }
  }

  if (txn.amount >= 1_000_000) {
    return {
      variant: "standard",
      color: "bg-blue-50 dark:bg-blue-950/30",
      accent: "border-blue-400 text-blue-700 dark:text-blue-400",
      icon: txn.reg_type === "Off-Plan" ? "building" : "home",
      prominence: "low",
      pulse: false,
    }
  }

  return {
    variant: "entry",
    color: "bg-slate-50 dark:bg-slate-900/30",
    accent: "border-slate-300 text-slate-600 dark:text-slate-400",
    icon: "tag",
    prominence: "low",
    pulse: false,
  }
}

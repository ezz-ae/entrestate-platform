"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import { Home, ListChecks, Plug, Bell, KeyRound, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

interface Props {
  tier: "free" | "pro" | "team" | "institutional"
}

const TABS = [
  { href: "/me", label: "Home", icon: Home, paid: false },
  { href: "/me/listings", label: "Listings", icon: ListChecks, paid: true },
  { href: "/me/connections", label: "Connections", icon: Plug, paid: true },
  { href: "/me/feed", label: "Alerts", icon: Bell, paid: true },
  { href: "/me/api-access", label: "API", icon: KeyRound, paid: true },
] as const

export function MeNav({ tier }: Props) {
  const pathname = usePathname() ?? ""
  const locale = useLocale() as AppLocale
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")
  const isFree = tier === "free"

  const tabs = TABS.map((tab) => ({ ...tab, href: prefixLocalePath(tab.href, locale) }))

  return (
    <nav aria-label="Personal home navigation" className="border-b border-border">
      <ul className="-mb-px flex flex-wrap gap-1 sm:gap-3 text-sm">
        {tabs.map(({ href, label, icon: Icon, paid }) => {
          const active = isActive(href)
          const locked = paid && isFree
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 border-b-2 font-medium transition-colors",
                  active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted",
                  locked && !active && "opacity-70"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{label}</span>
                {locked && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    <Sparkles className="h-3 w-3" aria-hidden /> Pro
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

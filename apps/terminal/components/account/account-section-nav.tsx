import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

export type AccountSectionKey = "overview" | "profile" | "notebooks" | "reports" | "billing" | "api"

type Props = {
  active: AccountSectionKey
  locale: AppLocale
  apiEnabled?: boolean | null
}

const COPY = {
  en: {
    overview: "Overview",
    profile: "Profile",
    notebooks: "Notebooks",
    reports: "Reports",
    billing: "Billing",
    api: "API",
    institutional: "Institutional",
  },
  ar: {
    overview: "الواجهة",
    profile: "الملف",
    notebooks: "الدفاتر",
    reports: "التقارير",
    billing: "الفوترة",
    api: "API",
    institutional: "مؤسسي",
  },
} as const

export function AccountSectionNav({ active, locale, apiEnabled = null }: Props) {
  const copy = COPY[locale] ?? COPY.en
  const items: Array<{
    key: AccountSectionKey
    href: string
    label: string
    badge: string | null
  }> = [
    { key: "overview", href: "/account", label: copy.overview, badge: null },
    { key: "profile", href: "/account/profile", label: copy.profile, badge: null },
    { key: "notebooks", href: "/account/book", label: copy.notebooks, badge: null },
    { key: "reports", href: "/account/reports", label: copy.reports, badge: null },
    { key: "billing", href: "/account/billing", label: copy.billing, badge: null },
    { key: "api", href: "/account/api-keys", label: copy.api, badge: apiEnabled === false ? copy.institutional : null },
  ]

  return (
    <nav
      aria-label={locale === "ar" ? "أقسام الحساب" : "Account sections"}
      className="mt-6 overflow-x-auto pb-1"
    >
      <div className="flex min-w-max items-center gap-2">
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <Link
              key={item.key}
              href={prefixLocalePath(item.href, locale)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/70 bg-card text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <Badge variant="outline" className="rounded-full border-current/20 px-2 py-0 text-[10px] font-semibold">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

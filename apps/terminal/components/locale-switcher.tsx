"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("locale")

  const normalizedPath = stripLocalePrefix(pathname || "/")
  const search = searchParams.toString()
  const targetLocale: AppLocale = locale === "ar" ? "en" : "ar"
  const href = `${prefixLocalePath(normalizedPath, targetLocale)}${search ? `?${search}` : ""}`
  const targetLabel = targetLocale === "ar" ? "عربي" : "English"

  return (
    <button
      type="button"
      aria-label={t("label")}
      className="inline-flex items-center rounded-full border border-border/70 bg-card/80 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground transition hover:bg-secondary"
      onClick={() => {
        window.location.assign(href)
      }}
    >
      {targetLabel}
    </button>
  )
}

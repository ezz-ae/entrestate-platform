"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Home, LayoutGrid, MessageSquare, Search, User2 } from "lucide-react"
import { prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"
import { buildLoginHref } from "@/lib/auth/navigation"
import { buildCopilotShellHref } from "@/lib/copilot/navigation"

type Props = {
  isAuthenticated: boolean
  isSidebarOpen: boolean
  onOpenChat: () => void
}

export function MobileBottomNav({ isAuthenticated, isSidebarOpen, onOpenChat }: Props) {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("nav")
  const normalizedPathname = stripLocalePrefix(pathname)
  const hasOpenChatIntent = searchParams?.get("openChat") === "true"
  const accountLabel = isAuthenticated ? t("account") : locale === "ar" ? "تسجيل الدخول" : "Sign in"
  const chatHref = buildCopilotShellHref({
    authenticated: isAuthenticated,
    locale,
    pathname,
    search: searchParams?.toString() ?? "",
  })
  const loginHref = buildLoginHref(
    locale,
    normalizedPathname.startsWith("/chat") || hasOpenChatIntent
      ? buildCopilotShellHref({
          authenticated: true,
          locale,
          pathname,
          search: searchParams?.toString() ?? "",
        })
      : "/me",
  )

  const items = [
    { key: "home", href: isAuthenticated ? prefixLocalePath("/me", locale) : prefixLocalePath("/", locale), label: isAuthenticated ? (locale === "ar" ? "الواجهة" : "Home") : t("overview"), icon: Home },
    { key: "search", href: prefixLocalePath("/search", locale), label: locale === "ar" ? "البحث" : "Search", icon: Search },
    { key: "workspace", href: prefixLocalePath("/workspace", locale), label: t("workspace"), icon: LayoutGrid },
    { key: "chat", href: chatHref, label: t("chat"), icon: MessageSquare },
    {
      key: "account",
      href: isAuthenticated ? prefixLocalePath("/account", locale) : loginHref,
      label: accountLabel,
      icon: User2,
    },
  ] as const

  return (
    <div className="fixed inset-x-0 bottom-0 z-[65] border-t border-border/60 bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
      <nav className="mx-auto grid max-w-xl grid-cols-5 gap-1" aria-label={t("mainNavigation")}>
        {items.map(({ key, href, label, icon: Icon }) => {
          const isActive =
            key === "home"
              ? (isAuthenticated ? normalizedPathname.startsWith("/me") : normalizedPathname === "/") && !hasOpenChatIntent
              : key === "chat"
                ? isSidebarOpen || hasOpenChatIntent || normalizedPathname.startsWith("/chat")
                : key === "account"
                  ? normalizedPathname.startsWith(isAuthenticated ? "/account" : "/login")
                  : normalizedPathname.startsWith(stripLocalePrefix(href))

          if (key === "chat") {
            return (
              <button
                key={key}
                type="button"
                onClick={onOpenChat}
                className={`flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-semibold transition-colors ${
                  isActive ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                aria-label={label}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{label}</span>
              </button>
            )
          }

          return (
            <Link
              key={key}
              href={href}
              className={`flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-semibold transition-colors ${
                isActive ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

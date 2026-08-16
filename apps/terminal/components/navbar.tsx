"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Menu, X } from "lucide-react"
import { AccountMenu } from "@/components/account-menu"
import { LlmSidebar } from "@/components/llm-search/sidebar"
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { useCopilot } from "@/components/copilot-provider"
import { authClient } from "@/lib/auth/client"
import { MessageSquare } from "lucide-react"
import { ReportNudge } from "@/components/report-nudge"
import { prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"
import { useRuntimeShell } from "@/hooks/use-runtime-shell"
import { buildLoginHref } from "@/lib/auth/navigation"
import { buildCopilotShellHref } from "@/lib/copilot/navigation"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const t = useTranslations("nav")
  const runtimeShell = useRuntimeShell()
  const isDedicatedMobileShell = runtimeShell === "mobile"
  const normalizedPathname = stripLocalePrefix(pathname)
  const navLinks = [
    { label: t("enterprise"), href: "/infrastructure" },
    { label: t("chat"), href: "/chat" },
    { label: t("areas"), href: "/areas" },
    { label: t("developers"), href: "/developers" },
    { label: t("properties"), href: "/properties" },
    { label: t("signals"), href: "/top-data" },
    { label: t("research"), href: "/reports/library" },
  ]
  const isChatPage = normalizedPathname.startsWith("/chat")
  const router = useRouter()
  const { toggleSidebar, openSidebar, isSidebarOpen } = useCopilot()
  const { data: session } = authClient.useSession()
  const isAuthenticated = Boolean(session?.user)
  const search = searchParams?.toString() ?? ""
  const hasOpenChatIntent = searchParams?.get("openChat") === "true"
  const shouldRenderSidebar = !isChatPage && (isAuthenticated || isSidebarOpen || hasOpenChatIntent)
  const loginNextPath = isChatPage || hasOpenChatIntent
    ? buildCopilotShellHref({
        authenticated: true,
        locale,
        pathname,
        search,
      })
    : "/me"
  // Logged-in users see /me as their home — a personalised whole-site experience,
  // not a dashboard. Public users keep the marketing home at /.
  const logoHref = isAuthenticated ? "/me" : "/"
  const accountEntryHref = isAuthenticated ? prefixLocalePath("/account", locale) : buildLoginHref(locale, loginNextPath)
  const accountEntryLabel = isAuthenticated ? t("account") : locale === "ar" ? "تسجيل الدخول" : "Sign in"

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileMenuOpen])

  const openChatShell = () => {
    if (!isChatPage) {
      router.replace(
        buildCopilotShellHref({
          authenticated: isAuthenticated,
          locale,
          pathname,
          search,
        }),
        { scroll: false },
      )
    }
    if (!isSidebarOpen) {
      openSidebar()
    }
    setIsMobileMenuOpen(false)
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === "/chat") {
      const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches
      if (isAuthenticated || isDedicatedMobileShell || isMobileViewport) {
        e.preventDefault()
        openChatShell()
        return
      }
    }

    if (href.startsWith("/#")) {
      const hash = href.substring(1)
      if (normalizedPathname === "/") {
        e.preventDefault()
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: "smooth" })
      } else {
        e.preventDefault()
        router.push(prefixLocalePath("/", locale))
        setTimeout(() => {
          const el = document.querySelector(hash)
          if (el) el.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    }
    setIsMobileMenuOpen(false)
  }

  const handleCopilotClick = () => {
    if (isAuthenticated) {
      if (isDedicatedMobileShell) {
        openChatShell()
      } else {
        toggleSidebar()
      }
      return
    }

    const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches
    if (isMobileViewport) {
      router.replace(
        buildCopilotShellHref({
          authenticated: false,
          locale,
          pathname,
          search,
        }),
        { scroll: false },
      )
      openSidebar()
      setIsMobileMenuOpen(false)
      return
    }

    router.push(prefixLocalePath("/chat", locale))
  }

  return (
    <>
      <header
        className="app-header fixed top-0 left-0 right-0 z-50 animate-navbar-slide backdrop-blur-md bg-background/90 border-b border-border/50"
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <nav className="flex items-center justify-between" aria-label={t("mainNavigation")}>
            <Link href={prefixLocalePath(logoHref, locale)} className="flex items-center gap-2.5">
              <div className="flex gap-0.5" aria-hidden="true">
                <div className="w-3 h-3 rounded-sm bg-foreground" />
                <div className="w-3 h-3 rounded-sm bg-foreground/60" />
                <div className="w-3 h-3 rounded-sm bg-accent" />
              </div>
              <span className="text-base sm:text-lg font-medium tracking-tight text-foreground">entrestate</span>
            </Link>

            <div className={`hidden items-center gap-5 xl:gap-8 ${isDedicatedMobileShell ? "" : "lg:flex"}`}>
              {navLinks.map((link) => {
                const isActive = link.href === "/chat"
                  ? isChatPage || isSidebarOpen || hasOpenChatIntent
                  : link.href === "/"
                    ? normalizedPathname === "/"
                    : normalizedPathname.startsWith(link.href)
                return (
                  <Link
                    key={link.label}
                    href={prefixLocalePath(link.href, locale)}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`nav-link-underline text-sm transition-colors ${isDedicatedMobileShell ? "hidden" : ""} ${
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`${isDedicatedMobileShell ? "block" : "hidden md:block"}`}>
                <LocaleSwitcher />
              </div>
              {!isChatPage && !isAuthenticated && !isDedicatedMobileShell ? (
                <button
                  onClick={handleCopilotClick}
                  className="hidden md:flex items-center rounded-full border border-border bg-secondary p-2 text-foreground hover:bg-secondary/80 transition-colors"
                  aria-label={t("openAssistant")}
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              ) : null}
              <AccountMenu />

              {!isDedicatedMobileShell ? (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden relative z-50 p-2 text-foreground"
                  aria-label={isMobileMenuOpen ? t("closeMenu") : t("openMenu")}
                >
                  <div className="relative w-5 h-5">
                    <Menu
                      className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                        isMobileMenuOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                      }`}
                    />
                    <X
                      className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                        isMobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                      }`}
                    />
                  </div>
                </button>
              ) : null}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      {!isDedicatedMobileShell ? (
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ease-out ${
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-background/95 backdrop-blur-xl transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className={`relative h-full flex flex-col ${isMobileMenuOpen ? "" : "pointer-events-none"}`}>

          {/* Top spacer for header */}
          <div className="h-16 shrink-0" />

          {/* Nav links — left-aligned, staggered */}
          <nav className="flex-1 flex flex-col justify-center px-8 gap-0.5">
            {navLinks.map((link, i) => {
              const isActive = link.href === "/chat"
                ? isChatPage || isSidebarOpen || hasOpenChatIntent
                : link.href === "/"
                  ? normalizedPathname === "/"
                  : normalizedPathname.startsWith(link.href)
              return (
                <Link
                  key={link.label}
                  href={prefixLocalePath(link.href, locale)}
                 
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-[2rem] font-semibold tracking-tight transition-all duration-400 py-1.5 ${
                    isActive ? "text-primary" : "text-foreground hover:text-primary"
                  } ${
                    isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
                  }`}
                  style={{ transitionDelay: isMobileMenuOpen ? `${80 + i * 50}ms` : "0ms" }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div
            className={`px-8 pb-10 pt-6 border-t border-border/30 flex items-center justify-between transition-all duration-400 ${
              isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: isMobileMenuOpen ? "380ms" : "0ms" }}
          >
            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <button
                onClick={openChatShell}
                className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                {t("openAssistant")}
              </button>
            </div>
            <Link
              href={accountEntryHref}
             
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {accountEntryLabel}
            </Link>
          </div>
        </div>
      </div>
      ) : null}
      {shouldRenderSidebar ? (
        <Suspense fallback={null}>
          <LlmSidebar authenticated={isAuthenticated} />
        </Suspense>
      ) : null}
      {isDedicatedMobileShell && !isSidebarOpen && !hasOpenChatIntent ? (
        <MobileBottomNav
          isAuthenticated={isAuthenticated}
          isSidebarOpen={isSidebarOpen}
          onOpenChat={openChatShell}
        />
      ) : null}
      {isAuthenticated ? <ReportNudge /> : null}
    </>
  )
}

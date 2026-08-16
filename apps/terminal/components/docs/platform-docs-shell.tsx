"use client"

import type { ComponentType, ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import { Bot, Command, FileText, Handshake, Building2, Briefcase, BarChart3, BookOpen, Server, ShieldCheck } from "lucide-react"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"

type DocsNavItem = {
  title: string
  href: string
  icon: ComponentType<{ className?: string }>
}

type DocsNavGroup = {
  title: string
  items: DocsNavItem[]
}

function getDocsNavGroups(locale: AppLocale): DocsNavGroup[] {
  const isArabic = locale === "ar"

  return [
  {
    title: isArabic ? "الأقسام الرئيسية" : "Main Sections",
    items: [
      { title: isArabic ? "نظرة عامة" : "Overview", href: "/docs", icon: BookOpen },
      { title: isArabic ? "الشركاء والواجهات" : "Partners & APIs", href: "/docs/partners-apis", icon: Handshake },
      { title: isArabic ? "التوثيق" : "Documentation", href: "/docs/documentation", icon: FileText },
      { title: isArabic ? "السوق" : "Industry", href: "/docs/industry", icon: Building2 },
      { title: isArabic ? "الوظائف والتدريب" : "Careers & Intern", href: "/docs/careers-intern", icon: Briefcase },
      { title: isArabic ? "علاقات المستثمرين" : "Investors Relations", href: "/docs/investors-relations", icon: BarChart3 },
      { title: isArabic ? "مقالات المنصة" : "Mind Map Articles", href: "/docs/articles", icon: FileText },
      { title: isArabic ? "البيانات والمعلومات" : "Data & Information", href: "/docs/data-information", icon: FileText },
    ],
  },
  {
    title: isArabic ? "الرؤى" : "Insights",
    items: [
      { title: isArabic ? "الوثائق" : "Docs", href: "/docs", icon: BookOpen },
      { title: isArabic ? "الأسواق" : "Markets", href: "/markets", icon: Building2 },
      { title: isArabic ? "البحث" : "Search", href: "/search", icon: FileText },
    ],
  },
  {
    title: isArabic ? "الشركة" : "Company",
    items: [
      { title: isArabic ? "حول" : "About", href: "/about", icon: Building2 },
      { title: isArabic ? "علاقات المستثمرين" : "Investor Relations", href: "/docs/investors-relations", icon: BarChart3 },
      { title: isArabic ? "سجل التغييرات" : "Changelog", href: "/changelog", icon: FileText },
      { title: isArabic ? "خارطة الطريق" : "Roadmap", href: "/roadmap", icon: FileText },
      { title: isArabic ? "الدعم" : "Support", href: "/support", icon: FileText },
    ],
  },
  {
    title: isArabic ? "الهندسة" : "Engineering",
    items: [
      { title: isArabic ? "معمارية النشر" : "Deployment Architecture", href: "/docs/deployment-architecture", icon: Server },
      { title: isArabic ? "مراجعة نشر CTO" : "CTO Deployment Review", href: "/docs/cto-deployment-review", icon: ShieldCheck },
    ],
  },
  {
    title: isArabic ? "الحالة" : "Status",
    items: [
      { title: isArabic ? "الحالة" : "Status", href: "/status", icon: FileText },
      { title: isArabic ? "اتصل بنا" : "Contact", href: "/contact", icon: FileText },
    ],
  },
]
}

function isActivePath(pathname: string | null | undefined, href: string) {
  const normalizedPath = stripLocalePrefix(pathname)
  if (href === "/docs") return normalizedPath === "/docs"
  return normalizedPath.startsWith(href)
}

export function PlatformDocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const docsNavGroups = getDocsNavGroups(locale)
  const copy = {
    brand: isArabic ? "وثائق Entrestate" : "Entrestate Docs",
    platformMap: isArabic ? "أقسام المنصة" : "Platform Map",
    partners: isArabic ? "الشركاء" : "Partners",
    investors: isArabic ? "المستثمرون" : "Investors",
    articles: isArabic ? "المقالات" : "Articles",
    searchDocs: isArabic ? "ابحث في التوثيق" : "Search docs",
    aiSupport: isArabic ? "المساعد الذكي" : "AI Support",
    aiWorkflow: isArabic ? "استخدامات المساعد" : "AI Workflow",
    aiWorkflowBody: isArabic
      ? "اطلب من المساعد تلخيص أي صفحة أو تجهيز موجز سريع للشركاء أو المستثمرين."
      : "Ask AI to summarize any section into partner or investor-ready briefs.",
    openAssistant: isArabic ? "افتح المحطة" : "Open Terminal",
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_50%_-20%,rgba(56,189,248,0.14),transparent_52%)]" />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href={prefixLocalePath("/docs", locale)} className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <div className="flex gap-0.5" aria-hidden="true">
                <div className="h-2.5 w-2.5 rounded-sm bg-foreground" />
                <div className="h-2.5 w-2.5 rounded-sm bg-foreground/60" />
                <div className="h-2.5 w-2.5 rounded-sm bg-accent" />
              </div>
              {copy.brand}
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
              <Link href={prefixLocalePath("/docs/documentation", locale)} className="hover:text-foreground transition-colors">
                {copy.platformMap}
              </Link>
              <Link href={prefixLocalePath("/docs/partners-apis", locale)} className="hover:text-foreground transition-colors">
                {copy.partners}
              </Link>
              <Link href={prefixLocalePath("/docs/investors-relations", locale)} className="hover:text-foreground transition-colors">
                {copy.investors}
              </Link>
              <Link href={prefixLocalePath("/docs/articles", locale)} className="hover:text-foreground transition-colors">
                {copy.articles}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={prefixLocalePath("/search", locale)}
              className="hidden items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground sm:flex hover:text-foreground"
            >
              <Command className="h-3.5 w-3.5" />
              <span>{copy.searchDocs}</span>
            </Link>
            <CopilotEntryLink
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Bot className="h-3.5 w-3.5" />
              {copy.aiSupport}
            </CopilotEntryLink>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-0 md:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-border/70 md:block">
          <div className="sticky top-14 h-[calc(100vh-56px)] overflow-y-auto p-4">
            <div className="space-y-5">
              {docsNavGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">{group.title}</p>
                  <nav className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActivePath(pathname, item.href)
                      return (
                        <Link
                          key={`${group.title}-${item.href}`}
                          href={prefixLocalePath(item.href, locale)}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${
                            active
                              ? "bg-accent/15 text-foreground border border-accent/30"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">{copy.aiWorkflow}</p>
              <p className="mt-1 text-xs text-emerald-100/90">
                {copy.aiWorkflowBody}
              </p>
              <CopilotEntryLink className="mt-2 inline-block text-xs font-medium text-emerald-100 underline-offset-2 hover:underline">
                {copy.openAssistant}
              </CopilotEntryLink>
            </div>
          </div>
        </aside>

        <main id="main-content" className="min-h-[calc(100vh-56px)]">
          <div className="mx-auto w-full max-w-[980px] px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

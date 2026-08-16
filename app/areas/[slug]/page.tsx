import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/JsonLd"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { formatAed, formatYield } from "@/components/decision/formatters"
import { getAreaBySlug } from "@/lib/decision-infrastructure"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { pickLocalizedText } from "@/lib/format/entities"
import { formatInteger } from "@/lib/format/number"
import { SEO, absoluteUrl, getLocaleAlternates, getOpenGraphLocale } from "@/lib/seo"
import { breadcrumbSchema } from "@/lib/seo/schema"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const detail = await getAreaBySlug(slug)

  if (!detail) {
    return {
      title: locale === "ar" ? "المنطقة غير موجودة | Entrestate" : "Area not found | Entrestate",
      alternates: getLocaleAlternates(`/areas/${slug}`, locale),
    }
  }

  const area = detail.area
  const profile = area.profile as Record<string, unknown> | null
  const areaName = pickLocalizedText(locale, profile?.area_ar, area.area, locale === "ar" ? "المنطقة" : "Area")
  const title = locale === "ar"
    ? `${areaName} — ملف المنطقة والأدلة | Entrestate`
    : `${areaName} — Area intelligence and evidence | Entrestate`
  const description = locale === "ar"
    ? `${areaName} مع متوسط السعر، ومتوسط العائد، وضغط المعروض، وفرص الشراء، وروابط مباشرة إلى المشاريع النشطة والمطورين المرتبطين.`
    : `${areaName} with average price, yield, supply pressure, BUY signals, and direct links to active projects and linked developers.`
  const alternates = getLocaleAlternates(`/areas/${slug}`, locale)

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      locale: getOpenGraphLocale(locale),
      url: alternates.languages?.[locale],
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default async function AreaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const detail = await getAreaBySlug(slug)
  if (!detail) notFound()

  const area = detail.area
  const profile = area.profile as Record<string, unknown> | null
  const copy = locale === "ar"
    ? {
        areaFallback: "المنطقة",
        developerFallback: "المطور",
        pageEyebrow: "بيانات المنطقة",
        profileFallback: "ملف التحليل العقاري للمنطقة",
        projects: "المشاريع",
        avgPrice: "متوسط السعر",
        avgYield: "متوسط العائد",
        supplyPressure: "ضغط المعروض",
        buySignals: "فرص الشراء",
        projectsInArea: "المشاريع المتاحة",
        developerPresence: "نطاق المطورين",
        projectFallback: "المشروع",
      }
    : {
        areaFallback: "Area",
        developerFallback: "Developer",
        pageEyebrow: "Area Detail",
        profileFallback: "Area intelligence profile",
        projects: "Projects",
        avgPrice: "Avg price",
        avgYield: "Avg yield",
        supplyPressure: "Supply pressure",
        buySignals: "BUY signals",
        projectsInArea: "Projects in area",
        developerPresence: "Developer presence",
        projectFallback: "Project",
      }
  const areaLabel = pickLocalizedText(locale, profile?.area_ar, area.area, copy.areaFallback)
  const cityLabel = typeof profile?.city === "string"
    ? pickLocalizedText(locale, null, profile.city, profile.city)
    : null
  const breadcrumb = breadcrumbSchema([
    { name: locale === "ar" ? "الرئيسية" : "Home", href: prefixLocalePath("/", locale) },
    { name: locale === "ar" ? "المناطق" : "Areas", href: prefixLocalePath("/areas", locale) },
    { name: areaLabel, href: prefixLocalePath(`/areas/${slug}`, locale) },
  ])

  return (
    <main id="main-content">
      <JsonLd data={breadcrumb} />
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-6">
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/25" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(680px_circle_at_50%_-280px,rgba(59,130,246,0.2),transparent_58%)] opacity-80" />

          <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.pageEyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">{areaLabel}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {[profile?.area_type, cityLabel].filter(Boolean).join(" · ") || copy.profileFallback}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.projects}</p>
              <p className="font-medium text-foreground">{formatInteger(area.projects, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.avgPrice}</p>
              <p className="font-medium text-foreground">{formatAed(area.avg_price, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.avgYield}</p>
              <p className="font-medium text-foreground">{formatYield(area.avg_yield, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.supplyPressure}</p>
              <p className="font-medium text-foreground">{String(area.supply_pressure ?? "—")}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.buySignals}</p>
              <p className="font-medium text-foreground">{String(area.buy_signals ?? "—")}</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
            <h2 className="text-lg font-semibold text-foreground">{copy.projectsInArea}</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {detail.projects.map((project) => (
                <ProjectCard
                  key={String(project.slug)}
                  slug={String(project.slug)}
                  name={String(project.name ?? copy.projectFallback)}
                  area={String(area.area ?? "")}
                  area_ar={typeof profile?.area_ar === "string" ? profile.area_ar : null}
                  developer={String(project.developer ?? "")}
                  developer_ar={typeof project.developer_ar === "string" ? project.developer_ar : null}
                  l1_canonical_price={typeof project.l1_canonical_price === "number" ? project.l1_canonical_price : null}
                  l1_canonical_yield={typeof project.l1_canonical_yield === "number" ? project.l1_canonical_yield : null}
                  l2_stress_test_grade={
                    typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null
                  }
                  l3_timing_signal={typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null}
                  engine_god_metric={typeof project.engine_god_metric === "number" ? project.engine_god_metric : null}
                  l1_confidence={typeof project.l1_confidence === "string" ? project.l1_confidence : null}
                />
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
            <h2 className="text-lg font-semibold text-foreground">{copy.developerPresence}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {detail.developers.map((developer, index) => (
                <li
                  key={`${String(developer.developer)}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2"
                >
                  <Link
                    href={prefixLocalePath(`/developers/${slugify(String(developer.developer ?? "developer"))}`, locale)}
                    className="truncate pr-3 text-foreground transition hover:text-primary"
                  >
                    {pickLocalizedText(locale, developer.developer_ar, developer.developer, copy.developerFallback)}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatInteger(developer.projects, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
      <Footer />
    </main>
  )
}

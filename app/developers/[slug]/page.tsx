import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/JsonLd"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { formatAed, formatScore } from "@/components/decision/formatters"
import { getDeveloperBySlug } from "@/lib/decision-infrastructure"
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
  const detail = await getDeveloperBySlug(slug)

  if (!detail) {
    return {
      title: locale === "ar" ? "المطور غير موجود | Entrestate" : "Developer not found | Entrestate",
      alternates: getLocaleAlternates(`/developers/${slug}`, locale),
    }
  }

  const developer = detail.developer
  const profile = developer.profile as Record<string, unknown> | null
  const developerName = pickLocalizedText(locale, profile?.developer_ar, developer.developer, locale === "ar" ? "المطور" : "Developer")
  const title = locale === "ar"
    ? `${developerName} — موثوقية المطور وسجله | Entrestate`
    : `${developerName} — Developer reliability and track record | Entrestate`
  const description = locale === "ar"
    ? `${developerName} مع درجة الموثوقية، وكفاءة التشغيل، وعدد المشاريع، والتواجد الجغرافي، وروابط مباشرة إلى المشاريع المتصلة.`
    : `${developerName} with reliability score, operating efficiency, project count, area presence, and direct links to connected projects.`
  const alternates = getLocaleAlternates(`/developers/${slug}`, locale)

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

export default async function DeveloperDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const detail = await getDeveloperBySlug(slug)
  if (!detail) notFound()

  const developer = detail.developer
  const profile = developer.profile as Record<string, unknown> | null
  const primaryArea = detail.area_presence[0]
  const primaryAreaLabel = primaryArea
    ? pickLocalizedText(locale, primaryArea.area_ar, primaryArea.area, "")
    : null
  const liveSubtitle = [profile?.founded_year, profile?.hq].filter(Boolean).join(" · ")
  const subtitleFallback = locale === "ar"
    ? `${formatInteger(detail.projects.length, locale)} مشروع حي${primaryAreaLabel ? ` · ${primaryAreaLabel}` : ""}`
    : `${formatInteger(detail.projects.length, locale)} live project${detail.projects.length === 1 ? "" : "s"}${primaryAreaLabel ? ` · ${primaryAreaLabel}` : ""}`
  const profileNoteFallback = locale === "ar"
    ? `${formatInteger(detail.projects.length, locale)} مشروع مرتبط${primaryAreaLabel ? ` في ${primaryAreaLabel}` : ""}${typeof developer.reliability === "number" ? ` · موثوقية ${formatScore(developer.reliability, locale)}` : ""}`
    : `${formatInteger(detail.projects.length, locale)} linked project${detail.projects.length === 1 ? "" : "s"}${primaryAreaLabel ? ` in ${primaryAreaLabel}` : ""}${typeof developer.reliability === "number" ? ` · Reliability ${formatScore(developer.reliability, locale)}` : ""}`
  const copy = locale === "ar"
    ? {
        developerFallback: "المطور",
        pageEyebrow: "تفاصيل المطور",
        profileFallback: "بيانات المطور الحية",
        reliability: "الموثوقية",
        efficiency: "الكفاءة التشغيلية",
        projects: "المشاريع",
        safeProjects: "مشاريع منخفضة المخاطر",
        avgTicket: "متوسط قيمة الوحدات",
        areaPresence: "التواجد الجغرافي",
        areaFallback: "المنطقة",
        profileNotes: "ملاحظات الملف",
        operationsAvailable: "سياق المطور متصل بالبيانات الحية",
        projectFallback: "المشروع",
        emptyProjects: "لا توجد مشاريع متصلة بهذا المطور في العرض الحالي.",
        emptyAreas: "لا توجد مناطق مرتبطة في هذا العرض الحالي.",
      }
    : {
        developerFallback: "Developer",
        pageEyebrow: "Developer Detail",
        profileFallback: "Live developer context",
        reliability: "Reliability",
        efficiency: "Efficiency",
        projects: "Projects",
        safeProjects: "Safe projects",
        avgTicket: "Avg ticket",
        areaPresence: "Area presence",
        areaFallback: "Area",
        profileNotes: "Profile notes",
        operationsAvailable: "Live developer context connected",
        projectFallback: "Project",
        emptyProjects: "No connected projects surfaced for this developer in the current dataset view.",
        emptyAreas: "No linked areas surfaced for this developer in the current dataset view.",
      }
  const developerLabel = pickLocalizedText(locale, profile?.developer_ar, developer.developer, copy.developerFallback)
  const breadcrumb = breadcrumbSchema([
    { name: locale === "ar" ? "الرئيسية" : "Home", href: prefixLocalePath("/", locale) },
    { name: locale === "ar" ? "المطورون" : "Developers", href: prefixLocalePath("/developers", locale) },
    { name: developerLabel, href: prefixLocalePath(`/developers/${slug}`, locale) },
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
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">{developerLabel}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {liveSubtitle || subtitleFallback || copy.profileFallback}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.reliability}</p>
              <p className="font-medium text-foreground">{formatScore(developer.reliability, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.efficiency}</p>
              <p className="font-medium text-foreground">{formatScore(developer.efficiency, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.projects}</p>
              <p className="font-medium text-foreground">{formatInteger(developer.projects, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.safeProjects}</p>
              <p className="font-medium text-foreground">{formatInteger(developer.safe_projects, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.avgTicket}</p>
              <p className="font-medium text-foreground">{formatAed(developer.avg_price, locale)}</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
            <h2 className="text-lg font-semibold text-foreground">{copy.projects}</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {detail.projects.map((project) => (
                <ProjectCard
                  key={String(project.slug)}
                  slug={String(project.slug)}
                  name={String(project.name ?? copy.projectFallback)}
                  area={String(project.area ?? "")}
                  developer={String(developer.developer ?? "")}
                  developer_ar={typeof profile?.developer_ar === "string" ? profile.developer_ar : null}
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
            {detail.projects.length === 0 ? (
              <p className="mt-3 rounded-lg border border-border/50 bg-background/50 px-3 py-3 text-sm text-muted-foreground">
                {copy.emptyProjects}
              </p>
            ) : null}
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
            <h2 className="text-lg font-semibold text-foreground">{copy.areaPresence}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {detail.area_presence.map((area, index) => (
                <li
                  key={`${String(area.area)}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2"
                >
                  <a
                    href={prefixLocalePath(`/areas/${slugify(String(area.area ?? "area"))}`, locale)}
                    className="truncate pr-3 text-foreground transition hover:text-primary"
                  >
                    {pickLocalizedText(locale, area.area_ar, area.area, copy.areaFallback)}
                  </a>
                  <span className="text-xs text-muted-foreground">{formatInteger(area.projects, locale)}</span>
                </li>
              ))}
            </ul>
            {detail.area_presence.length === 0 ? (
              <p className="mt-3 rounded-lg border border-border/50 bg-background/50 px-3 py-3 text-sm text-muted-foreground">
                {copy.emptyAreas}
              </p>
            ) : null}

            {profile ? (
              <div className="mt-4 rounded-xl border border-border/50 bg-background/50 p-3 text-xs text-muted-foreground">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{copy.profileNotes}</p>
                <p className="mt-1 text-sm text-foreground">
                  {[profile?.footprint, profile?.continuity].filter(Boolean).join(" · ") || profileNoteFallback || copy.operationsAvailable}
                </p>
              </div>
            ) : null}
          </aside>
        </section>
      </div>
      <Footer />
    </main>
  )
}

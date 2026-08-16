import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { listProperties } from "@/lib/decision-infrastructure"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { formatInteger } from "@/lib/format/number"

export const dynamic = "force-dynamic"

type SearchParams = {
  profile?: string
}

function profileConfig(profile: string | undefined, isArabic: boolean) {
  const normalized = (profile ?? "conservative").toLowerCase()
  if (normalized === "balanced") {
    return {
      stressGradeMin: "C" as const,
      sortBy: "god_metric" as const,
      heading: isArabic ? "توجيه متوازن" : "Balanced routing",
      description: isArabic
        ? "مخزون متوازن بين المرونة وانضباط السعر ودرجة المستثمر."
        : "Balanced inventory across resilience, price discipline, and investor score.",
    }
  }
  if (normalized === "aggressive") {
    return {
      stressGradeMin: "D" as const,
      sortBy: "yield" as const,
      heading: isArabic ? "توجيه هجومي" : "Aggressive routing",
      description: isArabic
        ? "مخزون بعوائد أعلى مع تحمّل ضغط أوسع وتركيز على الصعود."
        : "Higher-yield inventory with broader stress tolerance and upside focus.",
    }
  }

  return {
    stressGradeMin: "B" as const,
    sortBy: "reliability" as const,
    heading: isArabic ? "توجيه محافظ" : "Conservative routing",
    description: isArabic
      ? "مخزون بموثوقية أعلى ومرونة أقوى ضد الضغط وحماية أنظف للخسائر."
      : "Higher-reliability inventory with stronger stress resilience and cleaner downside protection.",
  }
}

export default async function AgentRuntimePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const params = await searchParams
  const activeProfile = params.profile ?? "conservative"
  const config = profileConfig(activeProfile, isArabic)

  const result = await listProperties({
    filters: {
      stressGradeMin: config.stressGradeMin,
      budgetMinAed: 1,
    },
    sortBy: config.sortBy,
    page: 1,
    pageSize: 20,
  })

  const pageProjects = result.projects
  const buyCount = pageProjects.filter((project) => String(project.l3_timing_signal ?? "").toUpperCase() === "BUY").length
  const buyShare = pageProjects.length > 0 ? Math.round((buyCount / pageProjects.length) * 100) : 0
  const routingInsight = pageProjects.length > 0
    ? isArabic
      ? `هذا التوجيه يُظهر ${formatInteger(pageProjects.length, locale)} أصلاً — ${buyShare}٪ منها ضمن نطاق الشراء.`
      : `This routing is surfacing ${formatInteger(pageProjects.length, locale)} assets — ${buyShare}% sit inside the BUY band.`
    : null

  const profileOptions: Array<[string, string]> = [
    ["conservative", isArabic ? "محافظ" : "Conservative"],
    ["balanced", isArabic ? "متوازن" : "Balanced"],
    ["aggressive", isArabic ? "هجومي" : "Aggressive"],
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {isArabic ? "توجيه المستثمر" : "Investor Routing"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "مكتب مطابقة المستثمرين" : "Investor Match Desk"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? "توجيه المخزون القائم على الملف الاستثماري عبر المرونة وإمكانية الشراء وجودة إشارة V1."
              : "Profile-based inventory routing across resilience, affordability, and V1 signal quality."}
          </p>
          <div className="mt-4 rounded-2xl border border-border/60 bg-card/40 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{config.heading}:</span> {config.description}
            {routingInsight ? (
              <span className="mt-1 block text-xs text-foreground/80">{routingInsight}</span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {profileOptions.map(([value, label]) => (
              <Link
                key={value}
                href={prefixLocalePath(`/agent-runtime?profile=${value}`, locale)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  activeProfile === value
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card/50 text-muted-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageProjects.map((project) => (
            <ProjectCard
              key={String(project.slug)}
              slug={String(project.slug)}
              name={String(project.name ?? "Project")}
              area={String(project.final_area ?? project.area ?? "")}
              area_ar={typeof project.area_ar === "string" ? project.area_ar : null}
              developer={String(project.developer ?? "")}
              developer_ar={typeof project.developer_ar === "string" ? project.developer_ar : null}
              l1_canonical_price={typeof project.l1_canonical_price === "number" ? project.l1_canonical_price : null}
              l1_canonical_yield={typeof project.l1_canonical_yield === "number" ? project.l1_canonical_yield : null}
              l2_stress_test_grade={typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null}
              l3_timing_signal={typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null}
              engine_god_metric={typeof project.engine_god_metric === "number" ? project.engine_god_metric : null}
              l1_confidence={typeof project.l1_confidence === "string" ? project.l1_confidence : null}
            />
          ))}
        </section>
      </div>
      <Footer />
    </main>
  )
}

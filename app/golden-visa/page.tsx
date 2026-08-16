import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { getGoldenVisaProjects } from "@/lib/decision-infrastructure"
import { getRequestLocale } from "@/i18n/request"

export const dynamic = "force-dynamic"

export default async function GoldenVisaPage() {
  const locale = await getRequestLocale()
  const copy = locale === "ar"
    ? {
        eyebrow: "التأشيرة الذهبية",
        title: "المؤهلات للتأشيرة الذهبية",
        subtitle: "مشاريع تبدأ من 2 مليون درهم مع فلترة تعتمد على الثقة وإشارات التوقيت والضغط.",
        empty: "لا توجد مشاريع متاحة حالياً ضمن شاشة التأشيرة الذهبية.",
        projectFallback: "المشروع",
      }
    : {
        eyebrow: "Golden Visa",
        title: "Golden Visa Qualifier",
        subtitle: "Projects priced at AED 2M+ with confidence-aware screening and timing/stress signals.",
        empty: "No projects are currently available in the golden visa screen.",
        projectFallback: "Project",
      }

  const result = await getGoldenVisaProjects().catch(() => ({
    projects: [],
    total: 0,
    page: 1,
    pageSize: 50,
    data_as_of: new Date().toISOString(),
  }))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
        </header>

        {result.projects.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
            {copy.empty}
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.projects.map((project) => (
              <ProjectCard
                key={String(project.slug)}
                slug={String(project.slug)}
                name={String(project.name ?? copy.projectFallback)}
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
        )}
      </div>
      <Footer />
    </main>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Cable,
  Database,
  Lock,
  Network,
  ShieldCheck,
  TerminalSquare,
  Workflow,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { getApiContentRows } from "@/lib/frontend-content"

export const dynamic = "force-dynamic"

type EndpointGroup = {
  title: string
  tone: string
  endpoints: Array<{ method: string; endpoint: string; description: string }>
}

const FALLBACK_API_GROUPS: EndpointGroup[] = [
  {
    title: "The Brain · GET /api/intel",
    tone: "border-sky-500/25 bg-sky-500/10",
    endpoints: [
      { method: "GET", endpoint: "/api/intel/decision/project/:id", description: "Project intelligence package" },
      { method: "GET", endpoint: "/api/intel/decision/area/:slug", description: "Area profile and benchmarks" },
      { method: "GET", endpoint: "/api/intel/decision/developer/:slug", description: "Developer profile" },
      { method: "POST", endpoint: "/api/intel/decision/compare", description: "Project delta analysis" },
    ],
  },
  {
    title: "The Hands · POST /api/tx",
    tone: "border-amber-500/25 bg-amber-500/10",
    endpoints: [
      { method: "POST", endpoint: "/api/tx/deal-chats/:id/contact-share", description: "Mutual contact reveal" },
      { method: "POST", endpoint: "/api/tx/folders/:id/join-queue", description: "Queue placement" },
      { method: "POST", endpoint: "/api/tx/deals/:id/draft-agreement", description: "Agreement drafting" },
      { method: "POST", endpoint: "/api/tx/hold/request", description: "Timed hold request" },
    ],
  },
  {
    title: "Bridge and Controls",
    tone: "border-emerald-500/25 bg-emerald-500/10",
    endpoints: [
      { method: "TOOL", endpoint: "Evidence Drawer", description: "Lineage and traceability" },
      { method: "TOOL", endpoint: "Tier Gating", description: "Server-side access control" },
      { method: "TOOL", endpoint: "State Machine", description: "Verified state transitions" },
      { method: "TOOL", endpoint: "Request IDs", description: "Auditable delivery" },
    ],
  },
]

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title: locale === "ar" ? "مساحة API للمؤسسات - Entrestate" : "Enterprise API - Entrestate",
    description:
      locale === "ar"
        ? "سطح Entrestate الـ Headless لواجهات القرار والتنفيذ: حمولة معيارية، أدلة، انتقالات حالة حتمية، ونموذج نشر يحافظ على واجهتك."
        : "Headless decision and transaction APIs for existing real estate portals: typed payloads, evidence lineage, deterministic state changes, and frontend-safe deployment.",
  }
}

export default async function EnterprisePage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const t = (en: string, ar: string) => (isArabic ? ar : en)
  const apiContent = await getApiContentRows().catch(() => ({ rows: [], data_as_of: new Date().toISOString() }))

  const endpointCount = apiContent.rows.length
  const endpointPill = endpointCount > 0
    ? t(`${endpointCount} live endpoint${endpointCount === 1 ? "" : "s"}`, `${endpointCount} نقطة API مباشرة`)
    : t("Typed enterprise endpoint surface", "سطح نقاط معيارية للمؤسسات")

  const integrationSteps = [
    t("Map read flows to /api/intel.", "اربط مسارات القراءة مع /api/intel."),
    t("Route actions through /api/tx.", "مرر الإجراءات عبر /api/tx."),
    t("Keep your UI and brand in place.", "احتفظ بواجهتك وعلامتك كما هي."),
    t("Enable evidence, request IDs, and tier gating.", "فعّل الأدلة ومعرفات الطلب وتقييد الباقات."),
  ]

  const guardrails = [
    {
      icon: ShieldCheck,
      title: t("Evidence on every verdict", "أدلة مع كل حكم"),
      body: t(
        "Every important output carries lineage and an audit trail.",
        "كل مخرج مهم يحمل تتبعاً للمصدر ومسار تدقيق.",
      ),
    },
    {
      icon: Lock,
      title: t("AI stays on intent", "الذكاء يبقى في طبقة النية"),
      body: t(
        "AI extracts intent. Verified tools execute.",
        "الذكاء يستخرج النية. الأدوات المتحققة تنفذ.",
      ),
    },
    {
      icon: Database,
      title: t("Tier gating happens server-side", "تقييد الباقات يتم في الخادم"),
      body: t(
        "Restricted fields are removed before the payload leaves the backend.",
        "تتم إزالة الحقول المقيدة قبل خروج الحمولة من الخلفية.",
      ),
    },
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1240px] px-6 pb-24 pt-28 md:pt-36">
        <header className="overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,250,252,0.94))] p-8 shadow-[0_24px_80px_rgba(15,21,29,0.08)] md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                <Network className="h-3.5 w-3.5" />
                {t("Enterprise API Space", "مساحة API للمؤسسات")}
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                {t(
                  "Headless decision and transaction APIs for existing property portals.",
                  "واجهات قرار وتنفيذ Headless للبوابات العقارية القائمة.",
                )}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                {t(
                  "Keep your frontend. Plug in Entrestate for intelligence, transaction state, and evidence-backed delivery.",
                  "احتفظ بواجهتك. أوصل Entrestate للاستخبارات وحالة المعاملة والتسليم المدعوم بالأدلة.",
                )}
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {[
                  endpointPill,
                  t("request_id + Evidence Drawer", "request_id + درج الأدلة"),
                  t("Zero UI opinions", "بدون آراء على الواجهة"),
                  t("Headless deployment model", "نموذج نشر Headless"),
                ].map((item) => (
                  <span key={item} className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={prefixLocalePath("/infrastructure", locale)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  {t("See the full system", "شاهد النظام الكامل")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={prefixLocalePath("/contact", locale)}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-6 py-3 text-sm font-semibold text-foreground"
                >
                  {t("Talk to enterprise sales", "تحدث مع فريق المؤسسات")}
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-slate-950 p-6 text-slate-100 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("Payload shape", "شكل الحمولة")}
              </p>
              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-4">
                  <p className="text-sm font-semibold text-sky-100">GET /api/intel/...</p>
                  <p className="mt-1 text-xs leading-6 text-slate-300">
                    {t("Read-heavy intelligence for screens, projects, and area context.", "استخبارات قرائية للشاشات والمشاريع وسياق المناطق.")}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4">
                  <p className="text-sm font-semibold text-amber-100">POST /api/tx/...</p>
                  <p className="mt-1 text-xs leading-6 text-slate-300">
                    {t("Execution for holds, queues, agreements, and controlled state changes.", "تنفيذ للحجوزات والطوابير والعقود وتغييرات الحالة المحكومة.")}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4">
                  <p className="text-sm font-semibold text-emerald-100">{t("Shared controls", "ضوابط مشتركة")}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-300">
                    {t("Evidence, gating, request IDs, and deterministic tools sit across both lanes.", "الأدلة والتقييد ومعرفات الطلب والأدوات الحتمية تعمل عبر المسارين.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-16 grid gap-5 lg:grid-cols-2">
          {[
            {
              label: t("The Brain", "الدماغ"),
              title: "GET /api/intel",
              body: t(
                "Delivers intelligence, ranking, context, and packaged decision payloads.",
                "يقدم الاستخبارات والترتيب والسياق وحمولات القرار الجاهزة.",
              ),
              tone: "border-sky-500/20 bg-sky-500/10",
            },
            {
              label: t("The Hands", "اليدان"),
              title: "POST /api/tx",
              body: t(
                "Handles holds, queues, agreements, contact reveal, and transaction state.",
                "يعالج الحجوزات والطوابير والعقود وكشف التواصل وحالة المعاملة.",
              ),
              tone: "border-amber-500/20 bg-amber-500/10",
            },
          ].map((lane) => (
            <div key={lane.title} className={`rounded-[28px] border p-6 ${lane.tone}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{lane.label}</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground">{lane.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{lane.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <div className="mb-7 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">
              {t("Delivery guardrails", "ضوابط التسليم")}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {guardrails.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-[24px] border border-border/70 bg-card/70 p-6">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section id="api" className="mt-16">
          <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("Endpoint registry", "سجل النقاط")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                {t("Live surface for the headless integration payload", "السطح المباشر لحمولة التكامل الـ Headless")}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              {t(
                "If live endpoints are available, they render here. Otherwise the fallback groups show the intended payload shape.",
                "إذا كانت النقاط الحية متاحة فستظهر هنا. وإلا تعرض المجموعات الاحتياطية شكل الحمولة المقصود.",
              )}
            </p>
          </div>

          {apiContent.rows.length > 0 ? (
            <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card/80">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-4">{t("Method", "النوع")}</th>
                      <th className="px-4 py-4">{t("Endpoint", "المسار")}</th>
                      <th className="px-4 py-4">{t("Description", "الوصف")}</th>
                      <th className="px-4 py-4">{t("Tier", "الباقة")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiContent.rows.map((row) => (
                      <tr key={`${row.method}-${row.endpoint}`} className="border-b border-border/50 last:border-b-0">
                        <td className="px-4 py-4">
                          <span className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground">
                            {row.method}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-foreground">{row.endpoint}</td>
                        <td className="px-4 py-4 text-muted-foreground">{row.description ?? "-"}</td>
                        <td className="px-4 py-4 text-muted-foreground">{row.tier_required ?? "Enterprise"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {FALLBACK_API_GROUPS.map((group) => (
                <div key={group.title} className={`rounded-[28px] border p-6 ${group.tone}`}>
                  <h3 className="text-lg font-semibold text-foreground">{group.title}</h3>
                  <div className="mt-5 space-y-4">
                    {group.endpoints.map((endpoint) => (
                      <div key={`${group.title}-${endpoint.endpoint}`} className="rounded-2xl border border-border/40 bg-background/75 px-4 py-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                            {endpoint.method}
                          </span>
                          <span className="font-mono text-xs text-foreground">{endpoint.endpoint}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{endpoint.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16 rounded-[32px] border border-border/70 bg-[linear-gradient(135deg,rgba(245,247,250,0.98),rgba(237,242,247,0.95))] p-8 md:p-10">
          <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("Deployment model", "نموذج النشر")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                {t("Keep the UI. Add the platform layer.", "احتفظ بالواجهة. وأضف طبقة المنصة.")}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              {t(
                "The model is headless by design: your team keeps the client experience while Entrestate powers the backend.",
                "النموذج Headless عن قصد: يحتفظ فريقك بتجربة العميل بينما تشغل Entrestate الخلفية.",
              )}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                icon: TerminalSquare,
                title: t("Your frontend", "واجهتك"),
                body: t(
                  "Search, listings, CRM, and brand presentation stay yours.",
                  "البحث والقوائم وCRM والعرض البصري تبقى لك.",
                ),
              },
              {
                icon: Cable,
                title: t("Entrestate API boundary", "حد Entrestate API"),
                body: t(
                  "Typed intelligence and transaction payloads flow through one stable boundary.",
                  "تتدفق حمولات الاستخبارات والتنفيذ المعيارية عبر حد ثابت واحد.",
                ),
              },
              {
                icon: Workflow,
                title: t("Deterministic transaction core", "لب المعاملة الحتمي"),
                body: t(
                  "Evidence, state machines, holds, queues, and agreements stay governed in one layer.",
                  "تبقى الأدلة وآلات الحالات والحجوزات والطوابير والعقود محكومة داخل طبقة واحدة.",
                ),
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-[24px] border border-border/60 bg-background/80 p-6">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-7 flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">
              {t("Rollout flow", "مسار الإطلاق")}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {integrationSteps.map((step, index) => (
              <div key={step} className="rounded-[24px] border border-border/70 bg-card/70 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("Step", "خطوة")} {index + 1}
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}

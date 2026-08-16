import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Blocks,
  Bot,
  Building2,
  Cable,
  Database,
  Fingerprint,
  GitBranch,
  Layers3,
  Lock,
  MapPinned,
  Network,
  ShieldCheck,
  Workflow,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { ArchitectureDiagram } from "@/components/platform/architecture-diagram"
import { ExecutionFlowDiagram } from "@/components/platform/execution-flow-diagram"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title:
      locale === "ar"
        ? "تكامل المؤسسات العقارية — طبقة قرار Headless | Entrestate"
        : "Enterprise Real Estate API — Headless Decision Layer | Entrestate",
    description:
      locale === "ar"
        ? "أوصل Entrestate ببوابتك الحالية كطبقة استخبارات وتنفيذ محكومة، مع بيانات موثقة، وغرف صفقات منظمة، ووصول عبر API."
        : "Plug Entrestate into your existing portal as a governed intelligence and execution layer with verified data, scored outputs, deal rooms, and API access.",
  }
}

export default async function InfrastructurePage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const t = (en: string, ar: string) => (isArabic ? ar : en)
  const linkIntakePrompt = isArabic
    ? "حوّل هذا الرابط إلى سجل قائمة محكوم واشرح ما الذي استخرجته وما الذي ما زال ناقصاً."
    : "Turn this listing link into a governed listing record and explain what you extracted versus what is still missing."
  const linkIntakeHref = `${prefixLocalePath("/chat", locale)}?prompt=${encodeURIComponent(linkIntakePrompt)}`

  const systemIncludes = [
    {
      title: t("Verified property spine", "العمود العقاري الموثق"),
      body: t(
        "A verified property layer for inventory, pricing, media, listing folders, and source lineage.",
        "طبقة عقارية موثقة للمخزون والسعر والوسائط ومجلدات القوائم وتتبع المصدر.",
      ),
    },
    {
      title: t("Scored intelligence layer", "طبقة الاستخبارات المصنفة"),
      body: t(
        "Signals become ranked outputs only after evidence, validation, and scoring.",
        "تتحول الإشارات إلى مخرجات مرتبة بعد الأدلة والتحقق والتقييم.",
      ),
    },
    {
      title: t("Governed deal rooms", "غرف الصفقات المحكومة"),
      body: t(
        "Every reservation, approval, SPA, and document trail moves inside one governed workspace.",
        "كل حجز وموافقة وSPA ومسار مستندات يتحرك داخل مساحة عمل واحدة ومحكومة.",
      ),
    },
    {
      title: t("API-first, headless", "تكامل API أولاً وHeadless"),
      body: t(
        "Your interface stays in place while Entrestate runs underneath it across sales, rent, and research workflows.",
        "تبقى واجهتك كما هي بينما تعمل Entrestate تحتها عبر المبيعات والإيجار والبحث.",
      ),
    },
  ]

  const modules = [
    {
      icon: Database,
      title: t("Verified property spine", "العمود العقاري الموثق"),
      body: t(
        "One verified property layer across sources, stock, and media.",
        "طبقة عقارية موثقة واحدة عبر المصادر والمخزون والوسائط.",
      ),
      accent: "from-cyan-400/20 to-sky-400/5",
    },
    {
      icon: Blocks,
      title: t("Scored intelligence layer", "طبقة الاستخبارات المصنفة"),
      body: t(
        "Evidence, lineage, and scoring turn signals into usable verdicts.",
        "الأدلة وتتبع المصدر والتقييم تحول الإشارات إلى أحكام قابلة للاستخدام.",
      ),
      accent: "from-amber-400/20 to-orange-400/5",
    },
    {
      icon: MapPinned,
      title: t("Rent operating layer", "طبقة تشغيل الإيجار"),
      body: t(
        "Lease-ready inventory, rent benchmarks, and unit turnover logic run on the same verified spine.",
        "المخزون الجاهز للإيجار ومقارنات الإيجار ومنطق دوران الوحدات تعمل على نفس العمود الموثق.",
      ),
      accent: "from-emerald-400/20 to-green-400/5",
    },
    {
      icon: Workflow,
      title: t("Governed deal rooms", "غرف الصفقات المحكومة"),
      body: t(
        "Documents, consent, approvals, reservations, and contracts stay in one stateful room.",
        "الوثائق والموافقات والاعتمادات والحجوزات والعقود تبقى داخل غرفة واحدة ذات حالة.",
      ),
      accent: "from-fuchsia-400/20 to-pink-400/5",
    },
    {
      icon: GitBranch,
      title: t("Listing folder spine", "عمود مجلدات القوائم"),
      body: t(
        "Every project, unit, brochure, floor plan, and media asset stays grouped in one governed listing folder.",
        "يبقى كل مشروع ووحدة وبروشور ومخطط ووسائط مجمعة داخل مجلد قائمة واحد ومحكوم.",
      ),
      accent: "from-blue-400/20 to-indigo-400/5",
    },
    {
      icon: Cable,
      title: t("Drop-link intake", "إدخال عبر الرابط"),
      body: t(
        "Drop a listing link, rent page, or brochure URL and convert it into a governed record instead of a chat-only suggestion.",
        "أسقط رابط قائمة أو صفحة إيجار أو رابط بروشور وحوله إلى سجل محكوم بدلاً من اقتراح داخل الدردشة فقط.",
      ),
      accent: "from-lime-400/20 to-emerald-400/5",
    },
  ]

  const executionFlow = [
    {
      title: t("Raw URL ingest", "إدخال عبر الرابط"),
      body: t(
        "Drop in a listing URL, rent page, brochure link, or a project landing page.",
        "أدخل رابط قائمة أو صفحة إيجار أو رابط بروشور أو صفحة مشروع.",
      ),
    },
    {
      title: t("Spine check", "فحص العمود الفقري"),
      body: t(
        "We fill project, media, and pricing context from the verified spine.",
        "نملأ المشروع والوسائط والسياق السعري من العمود الموثق.",
      ),
    },
    {
      title: t("Only the missing data", "فقط البيانات الناقصة"),
      body: t(
        "We ask only for what is still missing.",
        "نطلب فقط ما لا يزال ناقصاً.",
      ),
    },
    {
      title: t("Verified state change", "تغيير حالة موثّق"),
      body: t(
        "Publishing lands as a verified state change.",
        "يصبح النشر تغيير حالة موثّقاً.",
      ),
    },
  ]

  const operatingSurfaces = [
    {
      title: t("Rent infrastructure", "بنية الإيجار"),
      body: t(
        "Teams can run rent-ready inventory, benchmark asking rent, track turnover, and keep lease workflow on the same audited layer as sales inventory.",
        "يمكن للفرق تشغيل المخزون الجاهز للإيجار ومقارنة الإيجارات ومتابعة دوران الوحدات والحفاظ على سير عمل الإيجار على نفس الطبقة المدققة لمخزون المبيعات.",
      ),
    },
    {
      title: t("Listing folders", "مجلدات القوائم"),
      body: t(
        "Instead of scattered rows, every listing gets a governed folder with media, unit facts, pricing history, source lineage, and ready-to-share outputs.",
        "بدلاً من الصفوف المبعثرة، تحصل كل قائمة على مجلد محكوم يضم الوسائط وحقائق الوحدة وتاريخ التسعير وتتبع المصدر والمخرجات الجاهزة للمشاركة.",
      ),
    },
    {
      title: t("Drop-a-link trial", "تجربة إسقاط الرابط"),
      body: t(
        "A lightweight pilot mode lets your team drop one URL and watch Entrestate build the scored record, the folder, and the execution-ready state in front of them.",
        "يتيح وضع تجريبي خفيف لفريقك إسقاط رابط واحد ومشاهدة Entrestate تبني السجل المصنف والمجلد وحالة التنفيذ الجاهزة أمامهم.",
      ),
    },
  ]

  const roiPillars = [
    {
      title: t("Cleaner stock", "مخزون أنظف"),
      body: t(
        "Duplicate and unverified listings are filtered before reaching search or agents.",
        "تتم تصفية القوائم المكررة وغير الموثقة قبل أن تصل إلى البحث أو الوكلاء.",
      ),
    },
    {
      title: t("No demand leakage", "لا تسرّب في الطلب"),
      body: t(
        "Timed holds and queue logic keep qualified buyers inside the transaction flow.",
        "الحجوزات المؤقتة ومنطق الطوابير يحافظان على المشترين المؤهلين داخل مسار المعاملة.",
      ),
    },
    {
      title: t("Zero re-platforming", "دون إعادة بناء المنصة"),
      body: t(
        "You deploy on your existing interface with no migration and no retraining.",
        "تنشر على واجهتك الحالية من دون هجرة ومن دون إعادة تدريب.",
      ),
    },
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="relative isolate bg-[#061019] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,rgba(6,16,25,0.98),rgba(6,16,25,1))]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(to right, #8ef5b41a 1px, transparent 1px), linear-gradient(to bottom, #8ef5b41a 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative mx-auto max-w-[1240px] px-6 pb-24 pt-28 md:pt-36">
          <header className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,22,34,0.98),rgba(5,13,21,0.94))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  <Network className="h-3.5 w-3.5" />
                  {t("For enterprise teams", "لفرق المؤسسات")}
                </p>
                <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  {t("Your portal, our intelligence layer underneath it.", "بوابتك كما هي، وطبقة الاستخبارات تعمل تحتها.")}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                  {t(
                    "Plug Entrestate into your existing portal as a governed intelligence and execution layer. Your team keeps the interface they already know.",
                    "أوصل Entrestate ببوابتك الحالية كطبقة استخبارات وتنفيذ محكومة. يحتفظ فريقك بالواجهة التي يعرفها بالفعل.",
                  )}
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                  {t(
                    "The data, scoring, deal rooms, and transaction logic run underneath, verified, auditable, and API-accessible.",
                    "تعمل البيانات والتقييم وغرف الصفقات ومنطق المعاملة تحتها بشكل موثّق وقابل للتدقيق ومتاح عبر API.",
                  )}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={prefixLocalePath("/enterprise", locale)}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    {t("Review the API docs", "راجع وثائق الـ API")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={prefixLocalePath("/contact", locale)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-emerald-300/40 hover:bg-white/10"
                  >
                    {t("Talk to enterprise sales", "تحدث مع فريق المؤسسات")}
                  </Link>
                  <Link
                    href={linkIntakeHref}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:bg-cyan-300/15"
                  >
                    {t("Try a link intake", "جرّب إسقاط رابط")}
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-300">
                  {[
                    t("Verified property layer", "طبقة عقارية موثقة"),
                    t("API boundary", "حد API واضح"),
                    t("Governed deal rooms", "غرف صفقات محكومة"),
                    t("Headless deployment", "نشر Headless"),
                  ].map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <ArchitectureDiagram locale={locale} />
            </div>
          </header>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("Core modules", "الوحدات الأساسية")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("Four layers, one governed stack", "أربع طبقات، ومكدس محكوم واحد")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "Most enterprise teams start with two layers and expand from there.",
                  "تبدأ أغلب الفرق المؤسسية بطبقتين ثم تتوسع بعد ذلك.",
                )}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {systemIncludes.map((item) => (
                <div key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("System map", "خريطة النظام")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("The scoring layer, execution layer, and verified data underneath them", "طبقة التقييم وطبقة التنفيذ والبيانات الموثقة تحتها")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "The core modules behind the platform.",
                  "الوحدات الأساسية خلف المنصة.",
                )}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className={`rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)]`}
                  >
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-20 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_0.1fr_0.95fr] lg:items-center">
              <div className="rounded-[26px] border border-white/10 bg-slate-950/35 p-6">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-cyan-300" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {t("Stage 1", "المرحلة 1")}
                    </p>
                    <h3 className="text-xl font-semibold text-white">{t("Intent routing", "توجيه النية")}</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {t(
                    "Intent is translated into structured objects. The model does not change state.",
                    "تتم ترجمة النية إلى كائنات منظمة. النموذج لا يغيّر الحالة.",
                  )}
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-5 py-5 text-center">
                  <Lock className="mx-auto h-5 w-5 text-amber-200" />
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                    {t("Verified execution boundary", "حد التنفيذ المتحقق")}
                  </p>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-slate-950/35 p-6">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {t("Stage 2", "المرحلة 2")}
                    </p>
                    <h3 className="text-xl font-semibold text-white">{t("Verified execution", "تنفيذ موثّق")}</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {t(
                    "Verified tools, SQL, and state machines execute every outcome.",
                    "تنفذ الأدوات المتحققة وSQL وآلات الحالات كل نتيجة.",
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("Execution model", "نموذج التنفيذ")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("How it runs", "كيف يعمل")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "Less repeated input. More governed execution.",
                  "إدخال مكرر أقل. وتنفيذ محكوم أكثر.",
                )}
              </p>
            </div>

            <ExecutionFlowDiagram locale={locale} steps={executionFlow} />

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Fingerprint,
                  title: t("Cryptographic contact reveal", "كشف تواصل مشفر"),
                  body: t(
                    "Contact sharing unlocks only after the right conditions are met.",
                    "يتم فتح مشاركة التواصل فقط بعد تحقق الشروط الصحيحة.",
                  ),
                },
                {
                  icon: Workflow,
                  title: t("Timed holds and queue promotion", "حجوزات مؤقتة وترقية في الطابور"),
                  body: t(
                    "Time windows and queue promotion keep transactions moving.",
                    "النوافذ الزمنية وترقية الطابور تحافظ على حركة المعاملات.",
                  ),
                },
                {
                  icon: ShieldCheck,
                  title: t("Compliance before advance", "الامتثال قبل التقدم"),
                  body: t(
                    "Documents and verification are checked before any next step.",
                    "يتم فحص المستندات والتحقق قبل أي خطوة تالية.",
                  ),
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-[26px] border border-white/10 bg-slate-950/30 p-6">
                    <Icon className="h-5 w-5 text-emerald-300" />
                    <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("Operational surfaces", "الأسطح التشغيلية")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("What enterprise teams actually run on top of it", "ما الذي تشغله فرق المؤسسات فعلياً فوقه")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "This is not just an analytics page. It is the operating layer behind rent, listings, and deal execution.",
                  "هذه ليست مجرد صفحة تحليلات. إنها طبقة التشغيل خلف الإيجار والقوائم وتنفيذ الصفقات.",
                )}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {operatingSurfaces.map((item) => (
                <div key={item.title} className="rounded-[26px] border border-white/10 bg-slate-950/30 p-6">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,20,30,0.9),rgba(6,12,18,0.95))] p-8 md:p-10">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("Deployment model", "نموذج النشر")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("Headless underneath your existing portal", "طبقة Headless تحت بوابتك الحالية")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "The backend is opinionated. The interface stays yours.",
                  "الخلفية واضحة التوجه. والواجهة تبقى لك.",
                )}
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {[
                {
                  icon: Building2,
                  title: t("Your frontend", "واجهتك"),
                  body: t(
                    "Search, listings, CRM, and brand stay under your control.",
                    "البحث والقوائم وCRM والعلامة تبقى تحت تحكمك.",
                  ),
                },
                {
                  icon: Cable,
                  title: t("Typed API payload", "حمولة API معيارية"),
                  body: t(
                    "Entrestate sends the decision and transaction payloads.",
                    "ترسل Entrestate حمولات القرار والتنفيذ.",
                  ),
                },
                {
                  icon: Database,
                  title: t("Our deterministic backend", "خلفيتنا الحتمية"),
                  body: t(
                    "Truth, tooling, evidence, and state control stay centralized.",
                    "تبقى الحقيقة والأدوات والأدلة والتحكم بالحالة مركزية.",
                  ),
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-[26px] border border-white/10 bg-white/5 p-6">
                    <Icon className="h-5 w-5 text-cyan-300" />
                    <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                  </div>
                )
              })}
            </div>

            <p className="mt-8 text-center text-lg font-medium text-white md:text-xl">
              {t(
                "Keep your frontend. Plug in the backend.",
                "احتفظ بواجهتك. أوصل الخلفية.",
              )}
            </p>
          </section>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("Operational outcomes", "النتائج التشغيلية")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("What changes after deployment", "ما الذي يتغير بعد النشر")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "Teams typically report three gains in the first 90 days.",
                  "تذكر الفرق عادة ثلاثة مكاسب واضحة في أول 90 يوماً.",
                )}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {roiPillars.map((item) => (
                <div key={item.title} className="rounded-[28px] border border-emerald-300/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02))] p-7">
                  <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-200">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20 rounded-[32px] border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(8,14,24,0.94))] px-8 py-10 text-center md:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
              {t("Ready to scope deployment?", "جاهز لتحديد نطاق النشر؟")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              {t(
                "Two ways to start",
                "طريقتان للبداية",
              )}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-8 text-slate-200 md:text-base">
              {t(
                "Review the API surface independently, or bring your team to a scoping call.",
                "راجع سطح الـ API بنفسك، أو أحضر فريقك إلى مكالمة تحديد نطاق.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={prefixLocalePath("/enterprise", locale)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {t("Open the API guide", "افتح دليل الـ API")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={prefixLocalePath("/contact", locale)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {t("Book a scoping call", "احجز مكالمة نطاق")}
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}

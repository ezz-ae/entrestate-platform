import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { EvidenceDrawer } from "@/components/decision/evidence-drawer"
import { getEvidenceByProjectName, getProjectBySlug } from "@/lib/decision-infrastructure"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { pickLocalizedText } from "@/lib/format/entities"
import { formatAed } from "@/lib/format/currency"
import { formatDate } from "@/lib/format/date"

type EvidencePageProps = {
  params: Promise<{
    projectId: string
  }>
}

function toList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === "object") return [value as Record<string, unknown>]
  return []
}

function firstNonEmptyList(...values: unknown[]) {
  for (const value of values) {
    const resolved = toList(value)
    if (resolved.length > 0) return resolved
  }
  return []
}

function resolveConfidenceLevel(value: unknown) {
  const normalized = typeof value === "string" ? value.toUpperCase() : ""
  return normalized === "HIGH" || normalized === "MEDIUM" || normalized === "LOW"
    ? normalized
    : undefined
}

export default async function EvidencePage({ params }: EvidencePageProps) {
  const { projectId } = await params
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const detail = await getProjectBySlug(projectId)

  if (!detail) notFound()

  const project = detail.project
  const evidenceResponse = await getEvidenceByProjectName(String(project.name ?? detail.slug)).catch(() => null)
  const evidenceRow = evidenceResponse?.rows?.[0] as Record<string, unknown> | undefined
  const area = pickLocalizedText(locale, project.area_ar, project.final_area ?? project.area, isArabic ? "منطقة غير معروفة" : "Unknown area")
  const developer = pickLocalizedText(locale, project.developer_ar, project.developer, isArabic ? "غير محدد" : "Unassigned")
  const confidenceLevel = resolveConfidenceLevel(project.l1_confidence ?? evidenceRow?.l1_confidence)
  const confidenceScore = typeof project.evidence_score === "number" ? project.evidence_score : undefined

  const sources = firstNonEmptyList(
    project.evidence_sources,
    evidenceRow?.evidence_sources,
    [
      {
        label: isArabic ? "المشروع" : "Project",
        value: String(project.name ?? detail.slug),
      },
      {
        label: isArabic ? "المنطقة" : "Area",
        value: area,
      },
      {
        label: isArabic ? "المطور" : "Developer",
        value: developer,
      },
      {
        label: isArabic ? "تغطية المصدر" : "Source coverage",
        value: typeof project.l1_source_coverage === "string" ? project.l1_source_coverage : "Entrestate decision spine",
      },
    ],
  )

  const exclusions = firstNonEmptyList(
    project.evidence_exclusions,
    evidenceRow?.evidence_exclusions,
    [
      isArabic
        ? "تُستبعد الصفوف غير المكتملة أو المكررة قبل تثبيت السجل المرجعي."
        : "Incomplete or duplicate rows are removed before the canonical record is fixed.",
      isArabic
        ? "لا تدخل السجلات الضعيفة في طبقة الحكم إن لم تتجاوز حد الثقة."
        : "Low-confidence records do not enter the judgment layer unless they clear the confidence threshold.",
      isArabic
        ? "تُحجب المشاريع غير المطابقة لحرس الجودة من مسارات التوصية."
        : "Projects that fail quality guardrails are held out of recommendation flows.",
    ],
  )

  const assumptions = firstNonEmptyList(
    project.evidence_assumptions,
    evidenceRow?.evidence_assumptions,
    [
      isArabic
        ? "العائد يعكس السعر المرجعي الحالي ومدخلات الإيجار المتاحة."
        : "Yield reflects the current canonical price and available rental inputs.",
      isArabic
        ? "إشارة التوقيت مأخوذة من آخر قراءة معتمدة للمشروع."
        : "Timing inherits the latest approved project signal.",
      isArabic
        ? "الحكم يُقرأ من أحدث سجل مُسجّل داخل محرك القرار."
        : "The verdict is read from the latest scored project record in the decision engine.",
    ],
  )

  const copy = isArabic
    ? {
        eyebrow: "طبقة الأدلة",
        title: "سجل القرار",
        body: "هذه الصفحة تعرض نفس مصدر الحقيقة المستخدم داخل تقييم المشروع، بدون طبقة عرض إضافية أو بيانات تجريبية.",
        canonicalPrice: "السعر المرجعي",
        verdict: "الحكم",
        confidence: "الثقة",
        source: "المصدر",
        nextSteps: "الخطوات التالية",
        stepOne: "استخدم رابط الصفحة نفسها عند مشاركة الأساس التحليلي مع أصحاب القرار.",
        stepTwo: "راجع صفحة المشروع لمطابقة الأدلة مع السعر والعائد والضغط.",
        stepThree: "مرّر السجل إلى مساحة العمل أو المخرجات المؤسسية عند الحاجة.",
        browse: "تصفح المشاريع",
        openProject: "افتح المشروع",
      }
    : {
        eyebrow: "Evidence layer",
        title: "Decision record",
        body: "This page exposes the same source-of-truth record used in project scoring, without a presentation-only mock layer.",
        canonicalPrice: "Canonical price",
        verdict: "Verdict",
        confidence: "Confidence",
        source: "Source",
        nextSteps: "Next steps",
        stepOne: "Share this page URL when stakeholders need the same analytical basis.",
        stepTwo: "Cross-check the project page against price, yield, and stress signals.",
        stepThree: "Move the record into workspace or institutional outputs when needed.",
        browse: "Browse properties",
        openProject: "Open project",
      }

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-28 md:pt-36">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-serif font-semibold tracking-tight text-foreground md:text-5xl">
          {copy.title}: {String(project.name ?? detail.slug)}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          {copy.body}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <p className="text-[11px] text-muted-foreground">{copy.canonicalPrice}</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {formatAed(project.l1_canonical_price, locale, { fallback: "AED —" })}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <p className="text-[11px] text-muted-foreground">{copy.verdict}</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {typeof project.decision_label_v1 === "string" ? project.decision_label_v1 : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <p className="text-[11px] text-muted-foreground">{copy.confidence}</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {typeof project.l1_confidence === "string" ? project.l1_confidence : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <p className="text-[11px] text-muted-foreground">{copy.source}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {typeof project.l1_source_coverage === "string" ? project.l1_source_coverage : "Entrestate decision spine"}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <EvidenceDrawer
            title={`${isArabic ? "درج الأدلة" : "Evidence Drawer"} • ${String(project.name ?? detail.slug)}`}
            sources={sources}
            exclusions={exclusions}
            assumptions={assumptions}
            confidenceScore={confidenceScore}
            confidenceLevel={confidenceLevel}
            snapshotId={typeof project.score_version === "string" ? project.score_version : "decision-infrastructure"}
            runId={detail.slug}
            snapshotTs={detail.data_as_of}
            locale={locale}
          />

          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 text-sm leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">{copy.nextSteps}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>{copy.stepOne}</li>
              <li>{copy.stepTwo}</li>
              <li>{copy.stepThree}</li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground/70">
              {formatDate(detail.data_as_of, locale, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={prefixLocalePath("/properties", locale)}
                className="rounded-full border border-primary/60 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-primary transition hover:border-primary hover:bg-primary/10"
              >
                {copy.browse}
              </Link>
              <Link
                href={prefixLocalePath(`/properties/${detail.slug}`, locale)}
                className="rounded-full border border-border/60 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition hover:border-primary/40"
              >
                {copy.openProject}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

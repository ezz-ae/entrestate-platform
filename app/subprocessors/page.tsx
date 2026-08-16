import type { Metadata } from "next"
import { PolicyPage, type PolicyDocument } from "@/components/policy-page"
import { getRequestLocale } from "@/i18n/request"
import { getLocaleAlternates } from "@/lib/seo"

function getDocument(locale: "en" | "ar"): PolicyDocument {
  if (locale === "ar") {
    return {
      eyebrow: "المعالِجون من الباطن",
      title: "المعالِجون من الباطن",
      subtitle: "آخر تحديث: أبريل 2026",
      intro:
        "تعرض هذه الصفحة الجهات التشغيلية التي نعتمد عليها لتشغيل Entrestate. يتم تحديثها قبل تفعيل أي مزود جديد حتى تبقى فرق الشراء والامتثال قادرة على مراجعة سطح البيانات الفعلي.",
      sections: [
        {
          title: "الاستضافة والبيانات",
          paragraphs: [
            "نستخدم Vercel لاستضافة التطبيق ومسارات الحافة، وNeon لتشغيل قاعدة البيانات المرتبطة بالحسابات واستخدام المنتج ومواد البحث.",
            "تظل قواعد الوصول والاحتفاظ والتشفير خاضعة لسياسات Entrestate حتى عندما تمر البيانات عبر هؤلاء المزودين.",
          ],
          bullets: [
            "Vercel — الاستضافة والتشغيل",
            "Neon — قاعدة البيانات",
          ],
        },
        {
          title: "الدفع والاتصال",
          paragraphs: [
            "يتم توجيه المدفوعات إلى Stripe أو Tap بحسب المسار التشغيلي المهيأ. كما نستخدم مزودي البريد والمعالجة التشغيلية لإرسال الرسائل الحرجة للمستخدمين.",
          ],
          bullets: [
            "Stripe — المدفوعات الدولية",
            "Tap — المدفوعات المحلية في الخليج",
            "Resend — البريد التشغيلي",
          ],
        },
        {
          title: "تحليلات وتشغيل المنتج",
          paragraphs: [
            "أي طبقة تحليل أو مراقبة يتم تشغيلها فقط بعد موافقة المستخدم عند الحاجة، وبما يتوافق مع إعدادات الموافقة المنشورة في سياسة الكوكيز.",
          ],
          bullets: [
            "Sentry — مراقبة الأخطاء عند التهيئة",
            "PostHog — تحليلات المنتج عند التهيئة",
          ],
        },
      ],
    }
  }

  return {
    eyebrow: "Subprocessors",
    title: "Subprocessors",
    subtitle: "Last updated: April 2026",
    intro:
      "This page lists the operational subprocessors used to run Entrestate. It is intended to give procurement, legal, and security reviewers a public inventory of the live service surface before launch.",
    sections: [
      {
        title: "Hosting and data",
        paragraphs: [
          "Entrestate runs on Vercel for application hosting and edge delivery, and Neon for the database layer that stores account, product-usage, and research data.",
          "Access control, retention, and encryption standards remain governed by Entrestate policies even when infrastructure is provided by these vendors.",
        ],
        bullets: [
          "Vercel — application hosting and delivery",
          "Neon — managed Postgres database",
        ],
      },
      {
        title: "Payments and communications",
        paragraphs: [
          "Payments are routed to Stripe or Tap depending on the configured checkout path. We also use operational mail providers for essential account and billing notices.",
        ],
        bullets: [
          "Stripe — international card payments",
          "Tap — UAE and GCC-localized payments",
          "Resend — transactional email delivery",
        ],
      },
      {
        title: "Observability and analytics",
        paragraphs: [
          "Analytics and monitoring providers are only activated in line with published consent rules. Their purpose is operational reliability and product quality, not broad resale or profile enrichment.",
        ],
        bullets: [
          "Sentry — error monitoring when enabled",
          "PostHog — product analytics when enabled",
        ],
      },
    ],
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: locale === "ar" ? "المعالِجون من الباطن | Entrestate" : "Subprocessors | Entrestate",
    description:
      locale === "ar"
        ? "قائمة عامة بالمزودين التشغيليين الذين يساعدون في تشغيل Entrestate."
        : "Public list of the operational subprocessors that help run Entrestate.",
    alternates: getLocaleAlternates("/subprocessors", locale),
  }
}

export default async function SubprocessorsPage() {
  const locale = await getRequestLocale()
  return <PolicyPage document={getDocument(locale)} />
}

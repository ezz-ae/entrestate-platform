import type { Metadata } from "next"
import { PolicyPage, type PolicyDocument } from "@/components/policy-page"
import { getRequestLocale } from "@/i18n/request"
import { getLocaleAlternates } from "@/lib/seo"

function getDocument(locale: "en" | "ar"): PolicyDocument {
  if (locale === "ar") {
    return {
      eyebrow: "توطين البيانات",
      title: "بيان توطين البيانات",
      subtitle: "آخر تحديث: أبريل 2026",
      intro:
        "توضح هذه الصفحة أين تُعالج بيانات العملاء داخل Entrestate، وكيف يتم التعامل مع أي انتقال عابر للحدود بما يتوافق مع قانون حماية البيانات الشخصية في الإمارات وأطر الحماية الأجنبية ذات الصلة.",
      sections: [
        {
          title: "أين تعيش البيانات",
          paragraphs: [
            "بيانات الحساب والاستخدام والبحث تُخزَّن داخل البنية الأساسية التي تشغّلها Entrestate مع مزودي الاستضافة وقاعدة البيانات المعلنين في صفحة المعالِجين من الباطن.",
            "عندما تتغير المنطقة التشغيلية الفعلية، يتم تحديث هذه الصفحة والوثائق التعاقدية المرتبطة بها.",
          ],
        },
        {
          title: "الانتقالات العابرة للحدود",
          paragraphs: [
            "إذا غادرت البيانات المنطقة الأساسية، تُحمى عبر النقل المشفر، وضوابط الوصول، وبنود تعاقدية مناسبة تشمل ما يلزم لحالات PDPL وGDPR.",
          ],
        },
        {
          title: "الخيارات المؤسسية",
          paragraphs: [
            "يمكن للعقود المؤسسية طلب معالجة أكثر تقييداً بحسب متطلبات الشراء والامتثال، ويتم توثيق ذلك تعاقدياً داخل حزمة الشراء المؤسسية.",
          ],
        },
      ],
    }
  }

  return {
    eyebrow: "Data Residency",
    title: "Data Residency Statement",
    subtitle: "Last updated: April 2026",
    intro:
      "This page explains where customer data is processed in Entrestate and how cross-border handling is managed in line with the UAE PDPL and related foreign data-protection regimes.",
    sections: [
      {
        title: "Where data lives",
        paragraphs: [
          "Account, usage, and research data live inside the infrastructure operated through the subprocessors published on the public subprocessor page.",
          "If the active operating region changes, this page and the associated procurement material are updated accordingly.",
        ],
      },
      {
        title: "Cross-border transfers",
        paragraphs: [
          "Where data leaves its primary operating region, it is protected through encrypted transport, access controls, and contractual safeguards appropriate to PDPL- and GDPR-governed processing.",
        ],
      },
      {
        title: "Enterprise options",
        paragraphs: [
          "Institutional contracts can request tighter processing constraints where commercial terms and infrastructure support them. Those commitments are documented contractually during procurement.",
        ],
      },
    ],
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: locale === "ar" ? "توطين البيانات | Entrestate" : "Data Residency | Entrestate",
    description:
      locale === "ar"
        ? "أين تُعالج بيانات العملاء داخل Entrestate وكيف تتم حماية النقل العابر للحدود."
        : "Where customer data is processed inside Entrestate and how cross-border handling is protected.",
    alternates: getLocaleAlternates("/data-residency", locale),
  }
}

export default async function DataResidencyPage() {
  const locale = await getRequestLocale()
  return <PolicyPage document={getDocument(locale)} />
}

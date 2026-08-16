import type { Metadata } from "next"
import { PolicyPage, type PolicyDocument } from "@/components/policy-page"
import { getRequestLocale } from "@/i18n/request"
import { getLocaleAlternates } from "@/lib/seo"

function getDocument(locale: "en" | "ar"): PolicyDocument {
  if (locale === "ar") {
    return {
      eyebrow: "DPA",
      title: "ملخص اتفاقية معالجة البيانات",
      subtitle: "آخر تحديث: أبريل 2026",
      intro:
        "هذه الصفحة تلخص الهيكل القياسي لاتفاقية معالجة البيانات التي تُراجع مع العملاء المؤسسيين. ليست بديلاً عن المراجعة القانونية، لكنها توضح ما هو متاح على السطح العام قبل مرحلة التعاقد.",
      sections: [
        {
          title: "نطاق المعالجة",
          paragraphs: [
            "تعالج Entrestate البيانات فقط لتقديم الخدمة، وتشغيل الحساب، وتقديم المخرجات والتحليلات المتفق عليها داخل العقد الأساسي.",
          ],
        },
        {
          title: "الفئات والاحتفاظ",
          paragraphs: [
            "تشمل البيانات عادةً بيانات موظفي العميل، وسجلات الاستخدام، والمواد البحثية المرفوعة، ويتم الاحتفاظ بها وفق متطلبات التشغيل والقانون وسياسة الحذف المعتمدة.",
          ],
        },
        {
          title: "الضوابط الفنية والتنظيمية",
          paragraphs: [
            "يتم تغطية الوصول، والتشفير، والاستجابة للحوادث، وسلاسل المراجعة، والإشعارات التشغيلية داخل ملحق الضوابط الفنية والتنظيمية للعقد.",
          ],
        },
      ],
    }
  }

  return {
    eyebrow: "DPA",
    title: "Data Processing Agreement Summary",
    subtitle: "Last updated: April 2026",
    intro:
      "This page summarizes the standard structure of the data processing agreement reviewed with enterprise customers. It is not a substitute for counsel, but it does make the public procurement surface explicit before contract review.",
    sections: [
      {
        title: "Scope of processing",
        paragraphs: [
          "Entrestate processes data only to provide the service, operate the account, and deliver the agreed outputs and analytics under the underlying commercial agreement.",
        ],
      },
      {
        title: "Categories and retention",
        paragraphs: [
          "Typical categories include customer personnel, usage records, and uploaded research material, retained according to operational need, legal obligations, and the product deletion policy.",
        ],
      },
      {
        title: "Technical and organizational measures",
        paragraphs: [
          "Access control, encryption, incident response, audit trails, and operating-notice commitments are covered in the TOMs section of the enterprise contracting pack.",
        ],
      },
    ],
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: locale === "ar" ? "اتفاقية معالجة البيانات | Entrestate" : "Data Processing Agreement | Entrestate",
    description:
      locale === "ar"
        ? "ملخص عام لمسار اتفاقية معالجة البيانات المتاح للعملاء المؤسسيين."
        : "Public summary of the data processing agreement path available to enterprise buyers.",
    alternates: getLocaleAlternates("/dpa", locale),
  }
}

export default async function DpaPage() {
  const locale = await getRequestLocale()
  return <PolicyPage document={getDocument(locale)} />
}

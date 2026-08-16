"use client"

import Link from "next/link"
import { useState } from "react"
import { useLocale } from "next-intl"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const [selectedPlan, setSelectedPlan] = useState<"solo" | "team" | "enterprise">("solo")

  const planCopy = {
    solo: {
      label: isArabic ? "احترافي" : "Pro",
      price: isArabic ? "299 درهم / شهرياً" : "AED 299 / month",
      note: isArabic ? "خطة فردية للبحث والاستخدام المتقدم." : "Single-seat research and advanced decision access.",
      description: isArabic
        ? "أفضل للمحللين والمستثمرين الذين يحتاجون إلى أحكام قابلة للفحص ومذكرات واضحة ومصادر يمكن مراجعتها."
        : "Best for analysts and operators who need inspectable verdicts, memos, and reviewable sources.",
      ctaLabel: isArabic ? "الانتقال إلى الدفع" : "Continue to checkout",
      ctaHref: prefixLocalePath("/checkout?tier=pro", locale),
      helperLabel: isArabic ? "افتح الفوترة" : "Open billing center",
      helperHref: prefixLocalePath("/account/billing", locale),
      features: [
        isArabic ? "الوصول إلى محطة القرار" : "Decision Terminal access",
        isArabic ? "مذكرات وتقارير بحثية" : "Research memos and reports",
        isArabic ? "تغطية أدلة ومصادر أعمق" : "Deeper evidence and source coverage",
        isArabic ? "دفاتر مملوكة للحساب" : "Account-owned notebooks",
        isArabic ? "أولوية أعلى في المعالجة" : "Higher processing priority",
      ],
    },
    team: {
      label: isArabic ? "فريق" : "Team",
      price: isArabic ? "999 درهم / شهرياً" : "AED 999 / month",
      note: isArabic ? "للوساطة، والاستشارات، وفرق التشغيل." : "For brokerage, advisory, and operator teams.",
      description: isArabic
        ? "للفرق التي تحتاج مخرجات جاهزة للعملاء ومسارات عمل مشتركة وهوية تشغيلية أوضح."
        : "For teams that need client-ready outputs, shared workflows, and a clearer operating layer.",
      ctaLabel: isArabic ? "راجع الباقات" : "Review plans",
      ctaHref: prefixLocalePath("/pricing#team", locale),
      helperLabel: isArabic ? "احجز جلسة" : "Book a call",
      helperHref: prefixLocalePath("/contact", locale),
      features: [
        isArabic ? "كل ما في الاحترافي" : "Everything in Pro",
        isArabic ? "مسارات عمل مشتركة" : "Shared workflows",
        isArabic ? "مخرجات جاهزة للعميل" : "Client-ready outputs",
        isArabic ? "أولوية أعلى للدعم" : "Higher support priority",
        isArabic ? "تشغيل أسرع للفرق" : "Faster team operations",
      ],
    },
    enterprise: {
      label: isArabic ? "مؤسسية" : "Institutional",
      price: isArabic ? "عقد مخصص" : "Custom contract",
      note: isArabic ? "للنشر بعلامتك، والواجهات، والحوكمة." : "For white-label delivery, APIs, and governed rollout.",
      description: isArabic
        ? "للشركات التي تريد الوصول إلى طبقة البيانات، التكاملات، والتحكم المؤسسي."
        : "For firms that need platform integration, governed APIs, and white-label deployment.",
      ctaLabel: isArabic ? "تواصل مع المبيعات" : "Contact sales",
      ctaHref: prefixLocalePath("/contact", locale),
      helperLabel: isArabic ? "راجع الشروط" : "Review terms",
      helperHref: prefixLocalePath("/terms", locale),
      features: [
        isArabic ? "White-label كامل" : "Full white-label delivery",
        isArabic ? "وصول API محكوم" : "Governed API access",
        isArabic ? "ضوابط فرق وسجلات تدقيق" : "Team controls and audit logs",
        isArabic ? "حزمة الثقة والامتثال" : "Trust and compliance pack",
        isArabic ? "دعم إطلاق مخصص" : "Rollout support",
      ],
    },
  } as const
  const activePlan = planCopy[selectedPlan]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background animate-in fade-in duration-300">
      <button
        onClick={onClose}
        className="fixed right-6 top-6 z-10 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl">
          <div className="mb-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setSelectedPlan("solo")}
              className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${
                selectedPlan === "solo"
                  ? "border border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isArabic ? "احترافي" : "Pro"}
            </button>
            <button
              onClick={() => setSelectedPlan("team")}
              className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${
                selectedPlan === "team"
                  ? "border border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isArabic ? "فريق" : "Team"}
            </button>
            <button
              onClick={() => setSelectedPlan("enterprise")}
              className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${
                selectedPlan === "enterprise"
                  ? "border border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isArabic ? "مؤسسية" : "Institutional"}
            </button>
          </div>

          <div className="grid gap-6 animate-in slide-in-from-bottom-4 duration-500 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-border bg-card p-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">{activePlan.label}</h3>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {selectedPlan === "enterprise"
                    ? isArabic
                      ? "إطلاق محكوم"
                      : "Governed rollout"
                    : isArabic
                      ? "موصى به"
                      : "Recommended"}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-3xl font-bold">{activePlan.price}</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">{activePlan.note}</p>

              <p className="mb-6 text-sm text-muted-foreground">{activePlan.description}</p>

              <Button asChild className="mb-3 w-full">
                <Link href={activePlan.ctaHref} onClick={onClose}>
                  {activePlan.ctaLabel}
                </Link>
              </Button>
              <Button asChild variant="outline" className="mb-6 w-full">
                <Link href={activePlan.helperHref} onClick={onClose}>
                  {activePlan.helperLabel}
                </Link>
              </Button>

              <ul className="space-y-3 text-sm">
                {activePlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-xs text-muted-foreground">
                {isArabic ? "لديك اشتراك بالفعل؟ افتح " : "Already subscribed? Open "}
                <Link href={prefixLocalePath("/account/billing", locale)} className="text-foreground underline" onClick={onClose}>
                  {isArabic ? "مركز الفوترة" : "billing center"}
                </Link>
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-8">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">
                  {isArabic ? "المسار الصحيح قبل الترقية" : "Choose the right path before you upgrade"}
                </h3>
              </div>

              <p className="mb-6 text-sm text-muted-foreground">
                {isArabic
                  ? "الوصول المجاني يفتح طبقات القراءة العامة. أما الخطط المدفوعة فتضيف دفاتر الحساب، التصدير، الفرق، والاتصال بمنصتك أو بياناتك."
                  : "Free access opens the public evidence surfaces. Paid access adds account-owned notebooks, export depth, team workflows, and platform or data connections."}
              </p>

              <div className="space-y-3">
                {[
                  {
                    title: isArabic ? "ابدأ من صفحة التسعير" : "Start from pricing",
                    body: isArabic ? "راجع الباقات الحية والأسعار بالدرهم قبل أي قرار." : "Review the live plan model and AED pricing before you decide.",
                    href: prefixLocalePath("/pricing", locale),
                  },
                  {
                    title: isArabic ? "أدر الاشتراك من الفوترة" : "Manage subscriptions in billing",
                    body: isArabic ? "حالة الاشتراك وسجل الدفع لا يجب أن يبقيا داخل الواجهة الرئيسية." : "Subscription state and payment history belong in billing, not the main account hub.",
                    href: prefixLocalePath("/account/billing", locale),
                  },
                  {
                    title: isArabic ? "تواصل مع المبيعات للمؤسسة" : "Talk to sales for institutional rollout",
                    body: isArabic ? "للوصول إلى الواجهات، التحكم، أو النشر بعلامتك." : "For APIs, governed controls, or white-label deployment.",
                    href: prefixLocalePath("/contact", locale),
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="block rounded-xl border border-border/70 bg-background/60 p-4 transition-colors hover:border-primary/30 hover:bg-background"
                  >
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">{item.body}</p>
                  </Link>
                ))}
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                {isArabic ? "مواد الثقة والامتثال منشورة ضمن " : "Trust and compliance material is published under "}
                <Link href={prefixLocalePath("/terms", locale)} className="text-foreground underline" onClick={onClose}>
                  {isArabic ? "الشروط" : "terms"}
                </Link>
                {isArabic ? " و" : " and "}
                <Link href={prefixLocalePath("/privacy", locale)} className="text-foreground underline" onClick={onClose}>
                  {isArabic ? "الخصوصية" : "privacy"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

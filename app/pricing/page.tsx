import Link from "next/link"
import { ArrowRight, Building2, Check, ShieldCheck, Wallet } from "lucide-react"
import { JsonLd } from "@/components/JsonLd"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import {
  getLocalizedText,
  getPaidPlan,
  getPricingComparisonRows,
  getPricingTrustLinks,
  pricingFaq,
  pricingPlans,
} from "@/lib/pricing/plans"
import { faqSchema, productSchema } from "@/lib/seo/schema"

function formatAed(value: number | null, locale: AppLocale) {
  if (value === null) return locale === "ar" ? "تسعير مخصص" : "Custom pricing"

  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCadence(value: "monthly" | "annual", locale: AppLocale) {
  if (locale === "ar") return value === "monthly" ? "شهرياً" : "سنوياً"
  return value === "monthly" ? "per month" : "per year"
}

export default async function PricingPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const proPlan = getPaidPlan("pro")
  const teamPlan = getPaidPlan("team")
  const institutionalPlan = getPaidPlan("institutional")
  const comparisonRows = getPricingComparisonRows(locale)
  const trustLinks = getPricingTrustLinks(locale)
  const jsonLdFaq = faqSchema(
    pricingFaq.map((item) => ({
      q: getLocalizedText(item.q, locale),
      a: getLocalizedText(item.a, locale),
    })),
  )
  const productSchemas = [proPlan, teamPlan].map((plan) =>
    productSchema({
      name: getLocalizedText(plan.name, locale),
      description: getLocalizedText(plan.tagline, locale),
      url: `https://www.entrestate.com${prefixLocalePath("/pricing", locale)}#${plan.tier}`,
      price: plan.monthlyAed ?? 0,
      currency: "AED",
    }),
  )

  return (
    <main id="main-content">
      <JsonLd data={jsonLdFaq} />
      {productSchemas.map((item, index) => (
        <JsonLd key={index} data={item} />
      ))}

      <Navbar />
      <div className="mx-auto max-w-[1150px] px-4 pb-24 pt-28 sm:px-6 md:pt-36">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
            {isArabic ? "التسعير" : "Pricing"}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            {isArabic ? "تسعير واضح. بالدرهم. ومسار ترقية واضح." : "Clear pricing. Quoted in AED. One upgrade path."}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {isArabic
              ? "الوصول المجاني يفتح الأسطح الأساسية. أما الخطط المدفوعة فتبقى ضمن نموذج الباقات الحالي: احترافي، فريق، ومؤسسية."
              : "Free access opens the core surfaces. Paid access stays on the live tier model already used by the product: Pro, Team, and Institutional."}
          </p>
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" />
            <span>{isArabic ? "كل الأسعار أدناه بالدرهم الإماراتي" : "All quoted prices below are in AED"}</span>
            <span className="hidden text-border sm:inline">•</span>
            <span>{isArabic ? "تضاف ضريبة القيمة المضافة عند الدفع حيثما تنطبق" : "VAT is added at checkout where applicable"}</span>
          </div>
        </header>

        <section className="mt-12 rounded-[28px] border border-primary/20 bg-primary/5 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
                {isArabic ? "مسار البداية" : "Entry path"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground md:text-3xl">
                {getLocalizedText(pricingPlans.free.name, locale)}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {getLocalizedText(pricingPlans.free.description, locale)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
              <p className="text-3xl font-semibold text-foreground">{formatAed(pricingPlans.free.monthlyAed, locale)}</p>
              <ul className="mt-4 space-y-3">
                {pricingPlans.free.features.map((feature) => (
                  <li key={feature.en} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {getLocalizedText(feature, locale)}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-5 w-full gap-2">
                <CopilotEntryLink>
                  {getLocalizedText(pricingPlans.free.ctaLabel, locale)}
                  <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                </CopilotEntryLink>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[proPlan, teamPlan, institutionalPlan].map((plan) => {
            const price = plan.monthlyAed
            const href = prefixLocalePath(plan.ctaHref, locale)

            return (
              <article
                key={plan.tier}
                id={plan.tier}
                className={`rounded-[28px] border p-6 ${
                  plan.highlight ? "border-primary/30 bg-card shadow-xl shadow-primary/5" : "border-border/60 bg-card/70"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {getLocalizedText(plan.badge, locale)}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-semibold text-foreground">{getLocalizedText(plan.name, locale)}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{getLocalizedText(plan.tagline, locale)}</p>
                <p className="mt-5 text-3xl font-semibold text-foreground">
                  {formatAed(price, locale)}
                  {price !== null ? (
                    <span className="ms-2 text-sm font-medium text-muted-foreground">
                      {formatCadence("monthly", locale)}
                    </span>
                  ) : null}
                </p>
                {plan.annualAed ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isArabic
                      ? `${formatAed(plan.annualAed, locale)} سنوياً`
                      : `${formatAed(plan.annualAed, locale)} per year`}
                  </p>
                ) : null}

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.en} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {getLocalizedText(feature, locale)}
                    </li>
                  ))}
                </ul>

                <Button asChild className="mt-7 w-full gap-2" variant={plan.highlight ? "default" : "outline"}>
                  <Link href={href}>
                    {getLocalizedText(plan.ctaLabel, locale)}
                    <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                  </Link>
                </Button>
              </article>
            )
          })}
        </section>

        <section className="mt-14 rounded-[28px] border border-border/60 bg-card/70 p-6 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
                {isArabic ? "مقارنة مباشرة" : "Direct comparison"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">
                {isArabic ? "ما الذي يتغير بين المستويات؟" : "What changes across tiers?"}
              </h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 md:flex">
              <ShieldCheck className="h-4 w-4" />
              <span>{isArabic ? "منسق مع الحوكمة الحية" : "Aligned to the live entitlement model"}</span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="pb-3 pr-3 font-medium text-muted-foreground">{isArabic ? "الميزة" : "Capability"}</th>
                  <th className="pb-3 pr-3 font-medium text-muted-foreground">{isArabic ? "مجاني" : "Free"}</th>
                  <th className="pb-3 pr-3 font-medium text-muted-foreground">{isArabic ? "احترافي" : "Pro"}</th>
                  <th className="pb-3 pr-3 font-medium text-muted-foreground">{isArabic ? "فريق" : "Team"}</th>
                  <th className="pb-3 font-medium text-muted-foreground">{isArabic ? "مؤسسية" : "Institutional"}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-border/30">
                    <td className="py-3 pr-3 font-medium text-foreground">{row.feature}</td>
                    {row.values.map((value, index) => (
                      <td key={`${row.feature}-${index}`} className="py-3 pr-3 text-muted-foreground">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
              {isArabic ? "الأسئلة الشائعة" : "Frequently asked questions"}
            </p>
            <div className="mt-5 space-y-3">
              {pricingFaq.map((item) => (
                <details key={item.q.en} className="rounded-2xl border border-border/60 bg-card/60 px-5 py-4">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">
                    {getLocalizedText(item.q, locale)}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{getLocalizedText(item.a, locale)}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="rounded-[28px] border border-border/60 bg-card/70 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
              {isArabic ? "إثباتات الحوكمة" : "Governance proofs"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              {isArabic ? "قبل الشراء، راجع البنية والامتثال." : "Before you buy, inspect the public trust surface."}
            </h2>
            <ul className="mt-6 space-y-3">
              {trustLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={prefixLocalePath(item.href, locale)}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-foreground transition hover:border-primary/30 hover:text-primary"
                  >
                    <span>{item.title}</span>
                    <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <Footer />
      </div>
    </main>
  )
}

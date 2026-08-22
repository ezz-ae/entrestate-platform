import Link from "next/link"
import { ArrowRight, Building2, Check, ShieldCheck, Wallet } from "lucide-react"
import { JsonLd } from "@/components/JsonLd"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { getLocalizedText, getPricingTrustLinks, pricingFaq, pricingPlans } from "@/lib/pricing/plans"
import { PRODUCT_CARDS, SEAT, productText } from "@/lib/pricing/products"
import { faqSchema, productSchema } from "@/lib/seo/schema"

/**
 * THE PRICING PAGE SELLS THE PRODUCTS, NOT A SECOND CATALOGUE.
 *
 * This page used to sell Pro / Team / Institutional while
 * entrestate.com/business/pricing sold Lead Machine, the Mega Brokerage
 * Platform and Meta for Realtors — the same company quoting two price lists.
 * The tiers were mapped onto the products (see lib/pricing/products.ts for
 * the mapping and where each number is derived from); the tier STRINGS stay
 * accepted by every piece of money code, and the old #team / #institutional
 * anchors still resolve — links in the wild deep-link to them.
 *
 * What survives of the old catalogue on this page is the one thing the
 * Terminal itself sells: the Pro seat, at the foot.
 */

function formatAed(value: number | null, locale: AppLocale) {
  if (value === null) return locale === "ar" ? "تسعير مخصص" : "Custom pricing"
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value)
}

/** Who-fits-what, in the comparison form the old tier table used. */
function productRows(locale: AppLocale) {
  const ar = locale === "ar"
  return [
    {
      feature: ar ? "لمن هو" : "Who it is for",
      values: ar
        ? ["أي حساب", "شركة وساطة", "شركة تحتاج واجهتها العامة", "وسيط واحد"]
        : ["Any account", "A brokerage", "A company needing its public face", "One agent"],
    },
    {
      feature: ar ? "محطة القرار والبحث" : "Decision Terminal + search",
      values: ar ? ["مضمن", "مضمن", "مضمن", "مضمن"] : ["Included", "Included", "Included", "Included"],
    },
    {
      feature: ar ? "المكتب وإدارة العملاء" : "The desk and the CRM",
      values: ar ? ["—", "مضمن", "مضمن", "حملاتك فقط"] : ["—", "Included", "Included", "Your campaigns only"],
    },
    {
      feature: ar ? "موقع عام على نطاقك" : "Public site on your domain",
      values: ar ? ["—", "صفحات الهبوط", "الموقع كاملاً", "—"] : ["—", "Landing pages", "The whole site", "—"],
    },
    {
      feature: ar ? "الفوترة" : "Billed",
      values: ar
        ? ["مجاني", "شهرياً", "حسب التجهيز", "رموز أثناء التشغيل"]
        : ["Free", "Monthly", "Per setup", "Tokens as you run ads"],
    },
  ]
}

export default async function PricingPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const rows = productRows(locale)
  const trustLinks = getPricingTrustLinks(locale)
  const jsonLdFaq = faqSchema(
    pricingFaq.map((item) => ({
      q: getLocalizedText(item.q, locale),
      a: getLocalizedText(item.a, locale),
    })),
  )
  const productSchemas = [
    {
      name: productText(PRODUCT_CARDS[0].name, locale),
      description: productText(PRODUCT_CARDS[0].line, locale),
      url: `https://www.entrestate.com${prefixLocalePath("/pricing", locale)}#lead-machine`,
      price: pricingPlans.team.monthlyAed ?? 0,
      currency: "AED",
    },
    {
      name: productText(SEAT.name, locale),
      description: productText(SEAT.line, locale),
      url: `https://www.entrestate.com${prefixLocalePath("/pricing", locale)}#pro`,
      price: pricingPlans.pro.monthlyAed ?? 0,
      currency: "AED",
    },
  ].map((p) => productSchema(p))

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
            {isArabic ? "تسعير واضح. بالدرهم." : "Clear pricing. Quoted in AED."}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {isArabic
              ? "الوصول المجاني يفتح بيانات السوق والبحث لأي حساب. المنتجات هي ما يُشترى — والأسعار هنا هي نفسها على entrestate.com."
              : "Free access opens the market data and search on any account. The products are what money buys — and the prices here are the same ones on entrestate.com."}
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
          {PRODUCT_CARDS.map((card) => (
            <article
              key={card.key}
              id={card.key}
              className={`scroll-mt-28 rounded-[28px] border p-6 ${
                card.highlight ? "border-primary/30 bg-card shadow-xl shadow-primary/5" : "border-border/60 bg-card/70"
              }`}
            >
              {/* The old tier anchor, kept alive: links in the wild deep-link
                  to #team and #institutional, and an anchor that stops
                  resolving is a back button nobody pressed. */}
              {card.aliasAnchor ? <span id={card.aliasAnchor} aria-hidden /> : null}
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {productText(card.who, locale)}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-semibold text-foreground">{productText(card.name, locale)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{productText(card.line, locale)}</p>
              <p className="mt-5 text-3xl font-semibold text-foreground">{productText(card.priceLine, locale)}</p>
              {card.annualLine ? (
                <p className="mt-1 text-sm text-muted-foreground">{productText(card.annualLine, locale)}</p>
              ) : null}

              <ul className="mt-6 space-y-3">
                {card.features.map((feature) => (
                  <li key={feature.en} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {productText(feature, locale)}
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-7 w-full gap-2" variant={card.highlight ? "default" : "outline"}>
                <Link href={card.cta.href}>
                  {productText(card.cta.label, locale)}
                  <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                </Link>
              </Button>
            </article>
          ))}
        </section>

        {/* The one thing the Terminal itself sells: a seat. */}
        <section id="pro" className="mt-10 scroll-mt-28 rounded-[28px] border border-border/60 bg-card/70 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
                {isArabic ? "مقعد فردي" : "A single seat"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">{productText(SEAT.name, locale)}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {productText(SEAT.line, locale)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
              <p className="text-3xl font-semibold text-foreground">{productText(SEAT.priceLine, locale)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{productText(SEAT.annualLine, locale)}</p>
              <Button asChild className="mt-5 w-full gap-2" variant="outline">
                <Link href={prefixLocalePath(SEAT.cta.href, locale)}>
                  {productText(SEAT.cta.label, locale)}
                  <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-[28px] border border-border/60 bg-card/70 p-6 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
                {isArabic ? "مقارنة مباشرة" : "Direct comparison"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">
                {isArabic ? "أي واحد يناسبك؟" : "Which one fits you?"}
              </h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 md:flex">
              <ShieldCheck className="h-4 w-4" />
              <span>{isArabic ? "نفس الأسعار على entrestate.com" : "Same prices as entrestate.com"}</span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="pb-3 pr-3 font-medium text-muted-foreground">{isArabic ? "الميزة" : "Capability"}</th>
                  <th className="pb-3 pr-3 font-medium text-muted-foreground">{isArabic ? "مجاني" : "Free"}</th>
                  <th className="pb-3 pr-3 font-medium text-muted-foreground">Lead Machine</th>
                  <th className="pb-3 pr-3 font-medium text-muted-foreground">Mega Brokerage</th>
                  <th className="pb-3 font-medium text-muted-foreground">Meta for Realtors</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
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

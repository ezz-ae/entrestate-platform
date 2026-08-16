import Link from "next/link"
import { ArrowRight, CreditCard, ShieldCheck } from "lucide-react"
import { notFound } from "next/navigation"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { getSessionUser } from "@/lib/auth"
import { getPaidPlan, getLocalizedText, resolvePaidTier, type BillingCadence } from "@/lib/pricing/plans"
import { prefixLocalePath } from "@/i18n/locale"
import { getRequestLocale } from "@/i18n/request"

function formatAed(value: number | null, locale: "en" | "ar") {
  if (value === null) return locale === "ar" ? "تسعير مخصص" : "Custom pricing"

  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value)
}

function cadenceLabel(cadence: BillingCadence, locale: "en" | "ar") {
  if (locale === "ar") return cadence === "annual" ? "سنوي" : "شهري"
  return cadence === "annual" ? "Annual" : "Monthly"
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const params = await searchParams
  const tier = resolvePaidTier(params.tier ?? null)

  if (!tier) notFound()

  const plan = getPaidPlan(tier)
  const user = await getSessionUser()

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 md:pt-36">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
            {isArabic ? "إتمام الشراء" : "Checkout"}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            {isArabic ? `إتمام اشتراك ${getLocalizedText(plan.name, locale)}` : `Complete ${getLocalizedText(plan.name, locale)} checkout`}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {getLocalizedText(plan.tagline, locale)}
          </p>
        </header>

        <section className="mt-10 rounded-[28px] border border-border/60 bg-card/70 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{getLocalizedText(plan.name, locale)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{getLocalizedText(plan.description, locale)}</p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-sm font-medium text-foreground">
              {formatAed(plan.monthlyAed, locale)}
            </div>
          </div>

          {!user?.id || !user.email ? (
            <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <p className="text-sm font-medium text-foreground">
                {isArabic ? "تحتاج إلى حساب نشط قبل ربط الاشتراك بالباقات." : "You need an active account before we can bind billing to a tier."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {isArabic
                  ? "أنشئ حساباً أو سجّل الدخول أولاً، ثم عد إلى صفحة الدفع. يتم استخدام هوية الحساب لربط الاشتراك بحقوق الوصول داخل المنتج."
                  : "Create or sign into your account first, then come back to checkout. The account identity is used to attach the subscription to product entitlements."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={prefixLocalePath(`/signup?next=${encodeURIComponent(prefixLocalePath(`/checkout?tier=${tier}`, locale))}`, locale)}>
                    {isArabic ? "أنشئ حساباً" : "Create account"}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={prefixLocalePath("/pricing", locale)}>{isArabic ? "العودة إلى التسعير" : "Back to pricing"}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {isArabic ? "الاشتراك سيرتبط بهذا الحساب" : "This subscription will be attached to this account"}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(["monthly", "annual"] as BillingCadence[]).map((cadence) => {
                  const price = cadence === "annual" ? plan.annualAed : plan.monthlyAed
                  return (
                    <div key={cadence} className="rounded-2xl border border-border/60 bg-background/70 p-5">
                      <p className="text-sm font-medium text-muted-foreground">{cadenceLabel(cadence, locale)}</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{formatAed(price, locale)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {isArabic
                          ? "بطاقات الإمارات والسعودية تُوجَّه إلى Tap عند التهيئة. باقي المدفوعات تُوجَّه إلى Stripe."
                          : "AE and SA card traffic routes to Tap when configured. Other payment traffic routes to Stripe."}
                      </p>
                      <Button asChild className="mt-5 w-full gap-2">
                        <Link href={`/api/billing/checkout?tier=${tier}&cadence=${cadence}`}>
                          <CreditCard className="h-4 w-4" />
                          {isArabic ? "متابعة الدفع" : "Continue to payment"}
                          <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                        </Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>

        <Footer />
      </div>
    </main>
  )
}

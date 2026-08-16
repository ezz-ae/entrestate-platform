import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2, CreditCard, ExternalLink, History, Zap } from "lucide-react"

import { AccountSectionNav } from "@/components/account/account-section-nav"
import { AccountBillingControls } from "@/components/account-billing-controls"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { getSyncedUser } from "@/lib/auth/sync"
import { listBillingEventsByAccountKey, type BillingActivityEvent } from "@/lib/billing-entitlements"
import { getRequestLocale } from "@/i18n/request"
import { type AppLocale, prefixLocalePath } from "@/i18n/locale"

function formatTierLabel(tier: "free" | "pro" | "team" | "institutional", locale: AppLocale) {
  const labels = {
    free: { en: "Free", ar: "مجاني" },
    pro: { en: "Pro", ar: "احترافي" },
    team: { en: "Team", ar: "فريق" },
    institutional: { en: "Institutional", ar: "مؤسسي" },
  } as const
  return labels[tier][locale]
}

function formatDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function formatStatus(value: string | null | undefined, locale: AppLocale) {
  if (!value) return locale === "ar" ? "غير مرتبط" : "Not linked"

  const normalized = value.replaceAll("_", " ").toLowerCase()
  if (locale === "ar") {
    switch (normalized) {
      case "active":
        return "نشط"
      case "approved":
      case "approval pending":
        return "قيد الاعتماد"
      case "cancelled":
        return "ملغى"
      case "suspended":
        return "معلق"
      default:
        return normalized
    }
  }

  return normalized.replace(/^\w/, (char) => char.toUpperCase())
}

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function describeEvent(event: BillingActivityEvent, locale: AppLocale) {
  const type = event.event_type?.replaceAll("_", " ").toLowerCase() || (locale === "ar" ? "حدث" : "Event")
  return locale === "ar" ? `حدث ${type}` : type
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const user = await getSyncedUser()

  if (!user) {
    redirect(buildLoginHref(locale, "/account/billing"))
  }

  const entitlement = await getCurrentEntitlement(user.id)
  const params = (await searchParams) ?? {}
  const billingState = getSingleQueryValue(params.billing)?.trim() ?? null
  const events = entitlement.accountKey
    ? await listBillingEventsByAccountKey(entitlement.accountKey, { limit: 6, offset: 0 })
    : []

  return (
    <main id="main-content" className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 md:pt-28">
        <header className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {isArabic ? "مركز الفوترة" : "Billing center"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                {isArabic ? "الخطة والاشتراك" : "Plan and subscription"}
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                {isArabic
                  ? "كل ما يتعلق بالخطة والاشتراك وسجل الدفع في مكان واحد بعيداً عن شاشة الحساب الرئيسية."
                  : "Everything related to plan state, subscription controls, and payment history lives here instead of the main account landing page."}
              </p>
            </div>

            <Button asChild variant="outline">
              <Link href={prefixLocalePath("/pricing", locale)}>
                <ExternalLink className="h-4 w-4" />
                {isArabic ? "مراجعة الباقات" : "Review plans"}
              </Link>
            </Button>
          </div>

          <AccountSectionNav
            active="billing"
            locale={locale}
            apiEnabled={entitlement.tier === "institutional"}
          />
        </header>

        {billingState ? (
          <div className="mt-6 flex items-start gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
            <p>
              {billingState === "success"
                ? isArabic
                  ? "تم تحديث حالة الاشتراك بنجاح."
                  : "Your subscription status was updated successfully."
                : isArabic
                  ? "هناك تحديث متعلق بالفوترة. راجع الحالة الحالية أدناه."
                  : "There is a billing-related update. Review the current state below."}
            </p>
          </div>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card px-5 py-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "الخطة الحالية" : "Current plan"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatTierLabel(entitlement.tier, locale)}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card px-5 py-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "الحالة" : "Status"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatStatus(entitlement.status, locale)}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card px-5 py-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "المزود" : "Provider"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground capitalize">
              {entitlement.provider ?? (isArabic ? "غير مرتبط" : "Not linked")}
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {isArabic ? "إدارة الاشتراك" : "Subscription controls"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {isArabic
                    ? "هذا هو المكان المناسب لتحديث الحالة أو تغيير الباقة أو متابعة أي ربط دفع."
                    : "This is the correct place to sync status, change plan, or handle any payment-provider linkage."}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-border/70 bg-background/60 p-5">
              <AccountBillingControls
                tier={entitlement.tier}
                provider={entitlement.provider}
                subscriptionId={entitlement.subscriptionId}
                status={entitlement.status}
              />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {isArabic ? "ملاحظات تشغيلية" : "Operational notes"}
                  </h2>
                </div>
              </div>

              <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>
                  {isArabic
                    ? "الفوترة مفصولة عمداً عن الواجهة الرئيسية للحساب حتى تبقى شاشة الحساب هادئة."
                    : "Billing is intentionally separated from the main account hub so the account landing page stays calm."}
                </li>
                <li>
                  {isArabic
                    ? "إذا كنت تستخدم مزود دفع مباشر، فبعض تغييرات الخطة ما زالت تبدأ من صفحة التسعير أو عبر الدعم."
                    : "If you are on a direct payment provider, some plan changes still start from pricing or support."}
                </li>
                <li>
                  {isArabic
                    ? "سجل الأحداث الكامل متاح في صفحة السجل."
                    : "The full payment and subscription event trail is available in the activity page."}
                </li>
              </ul>

              <Button asChild variant="outline" className="mt-5 w-full">
                <Link href={prefixLocalePath("/account/billing-activity", locale)}>
                  <History className="h-4 w-4" />
                  {isArabic ? "افتح سجل الفوترة" : "Open billing activity"}
                </Link>
              </Button>
            </section>
          </aside>
        </div>

        <section className="mt-6 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {isArabic ? "آخر أحداث الفوترة" : "Recent billing events"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {isArabic
                  ? "معاينة سريعة قبل الدخول إلى السجل الكامل."
                  : "A quick preview before opening the full activity ledger."}
              </p>
            </div>
            <Badge variant="outline">{events.length}</Badge>
          </div>

          {events.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-12 text-center text-sm text-muted-foreground">
              {isArabic ? "لا توجد أحداث فوترة مرتبطة بهذا الحساب بعد." : "No billing events are linked to this account yet."}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {events.map((event) => (
                <article
                  key={event.event_id}
                  className="rounded-3xl border border-border/70 bg-background/60 px-5 py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold capitalize text-foreground">{describeEvent(event, locale)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{event.event_id}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDate(event.received_at, locale)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  )
}

import type { Metadata } from "next"
export const dynamic = "force-dynamic"

import Link from "next/link"
import { ArrowLeft, Globe, KeyRound, ShieldCheck, Zap } from "lucide-react"
import { redirect } from "next/navigation"

import { AccountSectionNav } from "@/components/account/account-section-nav"
import ApiKeyManager from "@/components/account/api-key-manager"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getSyncedUser } from "@/lib/auth/sync"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "API Connections - Entrestate",
  description: "Connect Entrestate market data to your own sites and dashboards.",
}

export default async function ApiKeysPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const user = await getSyncedUser()

  if (!user) redirect(buildLoginHref(locale, "/account/api-keys"))

  const entitlement = await getCurrentEntitlement()
  const activeKeyCount = await prisma.apiKey.count({
    where: { userId: user.id },
  })
  const canCreateKeys = entitlement.tier === "institutional"

  return (
    <main className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 md:pt-28">
        <header className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <Link
            href={prefixLocalePath("/account", locale)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {isArabic ? "العودة إلى الحساب" : "Back to account"}
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Zap className="h-3.5 w-3.5" />
                {canCreateKeys
                  ? isArabic ? "وصول مؤسسي مفعّل" : "Institutional access enabled"
                  : isArabic ? "ميزة مؤسسية" : "Institutional feature"}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                {isArabic ? "اتصالات API" : "API connections"}
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                {isArabic
                  ? "أنشئ وأدر مفاتيح الربط التي تسمح لمواقعك ولوحاتك الخلفية بطلب تغذية Entrestate بشكل آمن."
                  : "Create and manage the keys your sites and backend dashboards use to request Entrestate market feeds securely."}
              </p>
            </div>

            {!canCreateKeys ? (
              <Button asChild variant="outline">
                <Link href={prefixLocalePath("/pricing", locale)}>
                  {isArabic ? "الترقية إلى المؤسسية" : "Upgrade to institutional"}
                </Link>
              </Button>
            ) : null}
          </div>

          <AccountSectionNav
            active="api"
            locale={locale}
            apiEnabled={canCreateKeys}
          />
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "المفاتيح النشطة" : "Active keys"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{activeKeyCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "الباقة" : "Tier"}
            </p>
            <p className="mt-2 text-2xl font-semibold capitalize text-foreground">{entitlement.tier}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "نوع الاستخدام" : "Usage model"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {isArabic ? "خادم إلى خادم" : "Server to server"}
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <ApiKeyManager canCreate={canCreateKeys} />
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Globe className="h-4 w-4 text-primary" />
                {isArabic ? "الاستخدام المتوقع" : "Expected usage"}
              </h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="font-medium text-foreground">{isArabic ? "لوحات داخلية" : "Internal dashboards"}</p>
                  <p className="mt-1 leading-6">
                    {isArabic
                      ? "مرر المفتاح من الخادم الخلفي لعرض تغذية السوق في لوحات التشغيل."
                      : "Pass the key from a backend service to power market-feed views in your operator dashboards."}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="font-medium text-foreground">{isArabic ? "مواقع العملاء" : "Client-facing sites"}</p>
                  <p className="mt-1 leading-6">
                    {isArabic
                      ? "لا تضع المفتاح في الواجهة الأمامية. استخدم وسيط خادم آمن أو وظيفة API."
                      : "Do not expose raw keys in frontend code. Use a secure proxy route or backend function instead."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <KeyRound className="h-4 w-4 text-primary" />
                {isArabic ? "المسارات الحالية" : "Current routes"}
              </h2>
              <div className="mt-4 space-y-3 font-mono text-[11px] text-foreground">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4 break-all">
                  GET /api/v1/market-feed?type=dashboard
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4 break-all">
                  GET /api/v1/market-feed?type=listings
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {isArabic ? "أمان وتشغيل" : "Security and operations"}
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>{isArabic ? "انسخ المفتاح مرة واحدة فقط بعد الإنشاء؛ لن يظهر خاماً مرة ثانية." : "Copy a key immediately after creation; the raw secret is shown only once."}</li>
                <li>{isArabic ? "استخدم التسمية حسب البيئة أو الموقع لتسهيل الإلغاء لاحقاً." : "Name keys by environment or destination so revocation stays clear later."}</li>
                <li>{isArabic ? "ألغ أي مفتاح لم يعد مرتبطاً بخدمة حية." : "Revoke any key that is no longer attached to a live service."}</li>
              </ul>
              {!canCreateKeys ? (
                <Badge variant="outline" className="mt-4">
                  {isArabic ? "الإنشاء متاح للمؤسسية فقط" : "Creation is limited to institutional accounts"}
                </Badge>
              ) : null}
            </section>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  )
}

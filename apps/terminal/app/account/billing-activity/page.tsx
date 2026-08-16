import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, CreditCard, ReceiptText } from "lucide-react"
import { redirect } from "next/navigation"

import { AccountSectionNav } from "@/components/account/account-section-nav"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getSyncedUser } from "@/lib/auth/sync"
import {
  countBillingEventsByAccountKey,
  listBillingEventTypesByAccountKey,
  listBillingEventsByAccountKey,
  type BillingActivityEvent,
} from "@/lib/billing-entitlements"

const PAGE_SIZE = 20

function toSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function formatEventType(eventType: string | null) {
  if (!eventType) return "Unknown event"
  return eventType.replaceAll("_", " ").toLowerCase()
}

function getEventSummary(event: BillingActivityEvent, isArabic: boolean) {
  if (!event.payload || typeof event.payload !== "object") {
    return isArabic ? "لا توجد بيانات إضافية" : "No additional metadata"
  }

  const payload = event.payload as Record<string, unknown>
  const status = typeof payload.subscription_status === "string" ? payload.subscription_status : null
  const tier = typeof payload.tier === "string" ? payload.tier : null
  const action = typeof payload.action === "string" ? payload.action : null

  if (action && status && tier) return `${action} · ${status} · tier ${tier}`
  if (status && tier) return `${isArabic ? "الحالة" : "Status"} ${status} · tier ${tier}`
  if (status) return `${isArabic ? "الحالة" : "Status"} ${status}`
  if (tier) return `Tier ${tier}`
  if (action) return `${isArabic ? "الإجراء" : "Action"} ${action}`

  return isArabic ? "لا توجد بيانات إضافية" : "No additional metadata"
}

function buildActivityHref(page: number, eventType: string | null, locale: "en" | "ar") {
  const params = new URLSearchParams()
  params.set("page", String(page))
  if (eventType) params.set("event_type", eventType)
  return `${prefixLocalePath("/account/billing-activity", locale)}?${params.toString()}`
}

function formatDate(value: string, locale: "en" | "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export default async function BillingActivityPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const user = await getSyncedUser()

  if (!user) redirect(buildLoginHref(locale, "/account/billing-activity"))

  const params = (await searchParams) ?? {}
  const requestedEventType = toSingleQueryValue(params.event_type)?.trim() || null
  const requestedPage = parsePage(toSingleQueryValue(params.page))
  const accountKey = user.id

  const [eventTypes, totalCount] = await Promise.all([
    listBillingEventTypesByAccountKey(accountKey, 50),
    countBillingEventsByAccountKey(accountKey, requestedEventType),
  ])

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)
  const page = Math.min(requestedPage, totalPages)
  const offset = (page - 1) * PAGE_SIZE

  const events = await listBillingEventsByAccountKey(accountKey, {
    limit: PAGE_SIZE,
    offset,
    eventType: requestedEventType,
  })

  const activeFilter = requestedEventType

  return (
    <main className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 md:pt-28">
        <header className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <Link
            href={prefixLocalePath("/account/billing", locale)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {isArabic ? "العودة إلى مركز الفوترة" : "Back to billing center"}
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {isArabic ? "الفوترة" : "Billing"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                {isArabic ? "سجل الفوترة" : "Billing activity"}
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                {isArabic
                  ? "راجع أحداث الاشتراك والمدفوعات وتغييرات الحالة المسجلة لهذا الحساب."
                  : "Review subscription events, payment history, and status changes recorded for this account."}
              </p>
            </div>
            <Badge variant="outline">
              {totalCount} {isArabic ? "حدث" : totalCount === 1 ? "event" : "events"}
            </Badge>
          </div>

          <AccountSectionNav active="billing" locale={locale} />
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "إجمالي الأحداث" : "Total events"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{totalCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "المرشح الحالي" : "Current filter"}
            </p>
            <p className="mt-2 text-2xl font-semibold capitalize text-foreground">
              {activeFilter ? formatEventType(activeFilter) : isArabic ? "الكل" : "All"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "الصفحة" : "Page"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {page} / {totalPages}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={activeFilter ? "outline" : "default"} size="sm" asChild>
              <Link href={buildActivityHref(1, null, locale)}>
                {isArabic ? "كل الأحداث" : "All events"}
              </Link>
            </Button>
            {eventTypes.map((eventType) => (
              <Button
                key={eventType}
                variant={activeFilter === eventType ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={buildActivityHref(1, eventType, locale)}>{formatEventType(eventType)}</Link>
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">
                {isArabic ? "لا توجد أحداث فوترة لهذا المرشح" : "No billing events for this filter"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {isArabic
                  ? "جرّب عرض كل الأحداث أو راجع صفحة التسعير إذا لم يتم ربط اشتراك بعد."
                  : "Try the full event list or review pricing if this account has not been linked to a subscription yet."}
              </p>
            </div>
          ) : (
            events.map((event) => (
              <article
                key={event.event_id}
                className="rounded-3xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <ReceiptText className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-base font-semibold capitalize text-foreground">
                        {formatEventType(event.event_type)}
                      </h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {getEventSummary(event, isArabic)}
                    </p>
                    <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                      <span>{formatDate(event.received_at, locale)}</span>
                      <span>Event ID: {event.event_id}</span>
                      {event.subscription_id ? <span>Subscription ID: {event.subscription_id}</span> : null}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="mt-6 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? (
              <Link href={buildActivityHref(page - 1, activeFilter, locale)}>
                <ChevronLeft className="h-4 w-4" />
                {isArabic ? "السابق" : "Previous"}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                {isArabic ? "السابق" : "Previous"}
              </span>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            {isArabic ? "الصفحة" : "Page"} {page} / {totalPages}
          </p>

          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
            {page < totalPages ? (
              <Link href={buildActivityHref(page + 1, activeFilter, locale)}>
                {isArabic ? "التالي" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1">
                {isArabic ? "التالي" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </section>
      </div>

      <Footer />
    </main>
  )
}

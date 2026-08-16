"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type Props = {
  tier: "free" | "pro" | "team" | "institutional"
  provider: string | null
  subscriptionId: string | null
  status: string | null
}

function tierLabel(value: Props["tier"], locale: AppLocale) {
  if (locale !== "ar") return value
  switch (value) {
    case "free":
      return "الأساسية"
    case "pro":
      return "Pro"
    case "team":
      return "Team"
    case "institutional":
      return "المؤسسية"
    default:
      return value
  }
}

function statusLabel(value: string | null, locale: AppLocale) {
  if (!value) return locale === "ar" ? "غير معروفة" : "unknown"
  const normalized = value.replaceAll("_", " ").toLowerCase()
  if (locale !== "ar") return normalized

  switch (normalized) {
    case "active":
      return "نشطة"
    case "approval pending":
    case "approved":
      return "قيد المراجعة"
    case "suspended":
      return "معلّقة"
    case "cancelled":
      return "ملغاة"
    case "expired":
      return "منتهية"
    default:
      return normalized
  }
}

export function AccountBillingControls({ tier, provider, subscriptionId, status }: Props) {
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statusUpper = status?.toUpperCase() ?? null
  const normalizedProvider = provider?.toLowerCase() ?? null

  const runAction = (url: string, successMessage: string, method: "GET" | "POST" = "POST") => {
    setError(null)
    setFeedback(null)

    startTransition(async () => {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
        })

        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        if (!response.ok) {
          setError(payload.error ?? (isArabic ? "تعذر تنفيذ العملية الآن." : "Billing action failed"))
          return
        }

        setFeedback(successMessage)
        router.refresh()
      } catch {
        setError(isArabic ? "تعذر تنفيذ العملية الآن." : "Billing action failed")
      }
    })
  }

  return (
    <div className="mt-4 space-y-3">
      {subscriptionId && normalizedProvider === "paypal" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              runAction(
                "/api/billing/paypal/subscription",
                isArabic ? "تم تحديث حالة الاشتراك من PayPal." : "Subscription synced with PayPal.",
                "GET",
              )
            }
          >
            {isArabic ? "مزامنة الحالة" : "Sync status"}
          </Button>

          {(statusUpper === "ACTIVE" || statusUpper === "APPROVAL_PENDING" || statusUpper === "APPROVED") && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() =>
                runAction(
                  "/api/billing/paypal/manage/cancel",
                  isArabic ? "تم إيقاف الاشتراك." : "Subscription cancelled.",
                )
              }
            >
              {isArabic ? "إيقاف الاشتراك" : "Cancel subscription"}
            </Button>
          )}

          {statusUpper === "SUSPENDED" && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() =>
                runAction(
                  "/api/billing/paypal/manage/activate",
                  isArabic ? "عاد الاشتراك إلى الحالة النشطة." : "Subscription reactivated.",
                )
              }
            >
              {isArabic ? "إعادة التفعيل" : "Reactivate subscription"}
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild>
            <Link href={prefixLocalePath("/pricing", locale)}>{isArabic ? "غيّر الباقة" : "Change plan"}</Link>
          </Button>
        </div>
      ) : subscriptionId ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={prefixLocalePath("/pricing", locale)}>{isArabic ? "غيّر الباقة" : "Change plan"}</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link href={prefixLocalePath("/pricing", locale)}>{isArabic ? "عرض الباقات" : "View plans"}</Link>
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {isArabic ? "الباقة الحالية:" : "Current tier:"} <span className="font-medium text-foreground">{tierLabel(tier, locale)}</span>
        {" · "}
        {isArabic ? "المعالج:" : "Provider:"} {normalizedProvider ?? (isArabic ? "غير مرتبط" : "none")}
        {" · "}
        {isArabic ? "الحالة:" : "Status:"} {statusLabel(status, locale)}
      </p>

      {subscriptionId && normalizedProvider && normalizedProvider !== "paypal" ? (
        <p className="text-xs text-muted-foreground">
          {isArabic
            ? "هذا الاشتراك مرتبط بمزود دفع مباشر. تعديل الخطة يتم حالياً من صفحة التسعير أو عبر الدعم."
            : "This subscription is linked to a direct payment provider. Plan changes currently flow through pricing or support."}
        </p>
      ) : null}

      {feedback ? <p className="text-xs text-emerald-600">{feedback}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { buildLoginHref } from "@/lib/auth/navigation"

export function AccountIdentity() {
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const { data: session, isPending } = authClient.useSession()
  const copy = {
    signInTitle: isArabic ? "سجّل الدخول لإدارة حسابك" : "Sign in to manage your account",
    signInDescription: isArabic
      ? "هنا تجد ملف الجهة، الصلاحيات، وإعدادات الاشتراك."
      : "Your organization profile and access controls live here.",
    signInLink: isArabic ? "اذهب إلى تسجيل الدخول" : "Go to sign in",
    signedInAs: isArabic ? "الدخول باسم" : "Signed in as",
    profile: isArabic ? "إعدادات الملف" : "Profile settings",
    notebooks: isArabic ? "دفاتر البحث" : "Research notebooks",
    signOut: isArabic ? "تسجيل الخروج" : "Sign out",
  }

  if (isPending) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        {isArabic ? "جارٍ التحقق من الجلسة الحالية..." : "Checking your account session…"}
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {copy.signInTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {copy.signInDescription}
          </p>
        </div>
        <Link href={buildLoginHref(locale, "/account")} className="text-sm text-accent hover:underline font-medium">
          {copy.signInLink}
        </Link>
      </div>
    )
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push(prefixLocalePath("/", locale))
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          {`${copy.signedInAs} ${session.user.name || session.user.email}`}
        </p>
        <p className="text-xs text-muted-foreground">{session.user.email}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" className="border-border">
          <Link href={prefixLocalePath("/account/profile", locale)}>{copy.profile}</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link href={prefixLocalePath("/account/book", locale)}>{copy.notebooks}</Link>
        </Button>
        <Button variant="outline" onClick={handleSignOut} className="border-border">
          {copy.signOut}
        </Button>
      </div>
    </div>
  )
}

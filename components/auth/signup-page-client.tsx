"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { resolvePostLoginHref } from "@/lib/auth/navigation"

const COPY = {
  en: {
    heroTitle: "A clearer way to enter the market.",
    heroBody: "Open your account, read the market with evidence, compare options, and move when the picture is ready.",
    statOneTitle: "Free",
    statOneLabel: "To explore",
    statTwoTitle: "Verified",
    statTwoLabel: "Advisors",
    statThreeTitle: "Signed",
    statThreeLabel: "Reports",
    title: "Request access",
    subtitle: "Create your Entrestate account",
    google: "Continue with Google",
    googleLoading: "Connecting to Google...",
    divider: "or",
    name: "Full name",
    namePlaceholder: "Your full name",
    email: "Work email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "Min. 8 characters",
    submit: "Create account",
    submitting: "Creating account...",
    pending: "Checking session status…",
    success: "Check your email to verify your account, then sign in.",
    termsLead: "By signing up, you agree to our",
    terms: "Terms",
    privacy: "Privacy Policy",
    already: "Already have an account?",
    signIn: "Sign in",
    invalidOrigin: (origin: string) =>
      `Auth domain is not trusted. Add ${origin} to Neon Auth trusted origins (with and without www), then retry.`,
    genericError: "Unable to create account. Please try again.",
    timeout: "Registration timed out. Check Neon Auth settings and try again.",
    googleTimeout: "Google sign-in timed out. Check Neon Auth settings and try again.",
  },
  ar: {
    heroTitle: "استثمر بناءً على الحقائق، لا التخمينات.",
    heroBody: "أنشئ حسابك، راقب تحركات السوق، قارن بين الخيارات، واتخذ قراراتك بناءً على بيانات دقيقة ومدعومة بالأدلة.",
    statOneTitle: "مجاني",
    statOneLabel: "للاستكشاف",
    statTwoTitle: "خبراء",
    statTwoLabel: "معتمدون",
    statThreeTitle: "تقارير",
    statThreeLabel: "احترافية",
    title: "طلب الوصول",
    subtitle: "أنشئ حسابك على Entrestate وابدأ الآن",
    google: "المتابعة عبر Google",
    googleLoading: "جارٍ الاتصال بـ Google...",
    divider: "أو",
    name: "الاسم بالكامل",
    namePlaceholder: "اكتب اسمك بالكامل",
    email: "البريد الإلكتروني المهني",
    emailPlaceholder: "you@company.com",
    password: "كلمة المرور",
    passwordPlaceholder: "8 أحرف كحد أدنى",
    submit: "إنشاء حساب جديد",
    submitting: "جارٍ إنشاء الحساب...",
    pending: "جارٍ التحقق من الجلسة...",
    success: "تم إرسال رابط التأكيد إلى بريدك الإلكتروني، يرجى تفعيله لتتمكن من الدخول.",
    termsLead: "بالتسجيل، أنت توافق على",
    terms: "شروط الاستخدام",
    privacy: "سياسة الخصوصية",
    already: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
    invalidOrigin: (origin: string) =>
      `هذا الدومين غير موثوق. يرجى إضافة ${origin} إلى قائمة Neon Auth ثم المحاولة مجدداً.`,
    genericError: "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة لاحقاً.",
    timeout: "انتهت المهلة المحددة للتسجيل. يرجى مراجعة الإعدادات والمحاولة مجدداً.",
    googleTimeout: "انتهت مهلة تسجيل الدخول عبر Google. يرجى المحاولة مجدداً.",
  },
} as const

export function SignUpPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const { data: session, isPending } = authClient.useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isAwaitingSession, setIsAwaitingSession] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const homeHref = prefixLocalePath("/", locale)
  const targetHref = resolvePostLoginHref(locale, searchParams?.get("next"), "/me")
  const loginHref = searchParams?.get("next")
    ? prefixLocalePath(`/login?next=${encodeURIComponent(searchParams.get("next") ?? "")}`, locale)
    : prefixLocalePath("/login", locale)
  const termsHref = prefixLocalePath("/terms", locale)
  const privacyHref = prefixLocalePath("/privacy", locale)

  const toFriendlyAuthError = (message?: string | null) => {
    const normalized = (message ?? "").toLowerCase()
    if (normalized.includes("invalid origin")) {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : locale === "ar" ? "هذا الدومين" : "this site origin"
      return copy.invalidOrigin(currentOrigin)
    }
    return message || copy.genericError
  }

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, timeoutMs)
    })

    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle)
    }
  }

  useEffect(() => {
    if (session?.user) {
      router.replace(targetHref)
    }
  }, [session, router, targetHref])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setIsAwaitingSession(false)
    setIsLoading(true)

    try {
      const { data, error } = await withTimeout(authClient.signUp.email({ email, password, name }), 15000, copy.timeout)

      if (error) {
        setFormError(toFriendlyAuthError(error.message))
        return
      }

      if (data?.token) {
        setIsAwaitingSession(true)
        return
      }

      setSuccessMessage(copy.success)
    } catch (err) {
      setFormError(toFriendlyAuthError(err instanceof Error ? err.message : null))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setFormError(null)
    setSuccessMessage(null)
    setIsGoogleLoading(true)

    try {
      const { error } = await withTimeout(
        authClient.signIn.social({
          provider: "google",
          callbackURL: targetHref,
        }),
        15000,
        copy.googleTimeout,
      )

      if (error) {
        setFormError(toFriendlyAuthError(error.message))
      }
    } catch (err) {
      setFormError(toFriendlyAuthError(err instanceof Error ? err.message : null))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="relative hidden flex-col justify-between bg-primary p-12 lg:flex lg:w-1/2">
        <Link href={homeHref} className="flex items-center gap-2">
          <div className="flex gap-0.5" aria-hidden="true">
            <div className="h-3 w-3 rounded-sm bg-primary-foreground" />
            <div className="h-3 w-3 rounded-sm bg-primary-foreground/60" />
            <div className="h-3 w-3 rounded-sm bg-accent" />
          </div>
          <span className="text-lg font-medium tracking-tight text-primary-foreground">entrestate</span>
        </Link>

        <div className="max-w-md">
          <h2 className="mb-4 font-serif text-3xl leading-tight text-primary-foreground">{copy.heroTitle}</h2>
          <p className="leading-relaxed text-primary-foreground/60">{copy.heroBody}</p>
        </div>

        <div className="flex gap-12">
          <div>
            <p className="font-serif text-3xl text-primary-foreground">{copy.statOneTitle}</p>
            <p className="mt-1 text-sm text-primary-foreground/60">{copy.statOneLabel}</p>
          </div>
          <div>
            <p className="font-serif text-3xl text-primary-foreground">{copy.statTwoTitle}</p>
            <p className="mt-1 text-sm text-primary-foreground/60">{copy.statTwoLabel}</p>
          </div>
          <div>
            <p className="font-serif text-3xl text-primary-foreground">{copy.statThreeTitle}</p>
            <p className="mt-1 text-sm text-primary-foreground/60">{copy.statThreeLabel}</p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href={homeHref} className="flex items-center justify-center gap-2">
              <div className="flex gap-0.5" aria-hidden="true">
                <div className="h-3 w-3 rounded-sm bg-foreground" />
                <div className="h-3 w-3 rounded-sm bg-foreground/60" />
                <div className="h-3 w-3 rounded-sm bg-accent" />
              </div>
              <span className="text-lg font-medium tracking-tight text-foreground">entrestate</span>
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card p-8">
            <div className="mb-8">
              <h1 className="font-serif text-2xl text-foreground">{copy.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="mb-4 w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading || isAwaitingSession}
            >
              {isGoogleLoading ? copy.googleLoading : copy.google}
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{copy.divider}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                  {copy.name}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.namePlaceholder}
                  required
                  className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-foreground transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                  {copy.email}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={copy.emailPlaceholder}
                  required
                  className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-foreground transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                  {copy.password}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={copy.passwordPlaceholder}
                    required
                    minLength={8}
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 pr-11 text-foreground transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 w-full bg-primary py-2.5 text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || isGoogleLoading || isAwaitingSession}
              >
                {isLoading || isAwaitingSession ? copy.submitting : copy.submit}
              </Button>
              {((isPending && !session?.user) || isAwaitingSession) ? <p className="text-xs text-muted-foreground">{copy.pending}</p> : null}
              {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-300">{successMessage}</p> : null}
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              {copy.termsLead}{" "}
              <Link href={termsHref} className="text-accent hover:underline">
                {copy.terms}
              </Link>
              {locale === "ar" ? " و" : " and "}
              <Link href={privacyHref} className="text-accent hover:underline">
                {copy.privacy}
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {copy.already}{" "}
            <Link href={loginHref} className="font-medium text-accent hover:underline">
              {copy.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

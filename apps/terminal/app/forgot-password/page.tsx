"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { GridBackground } from "@/components/grid-background"
import { ArrowLeft, Mail, CheckCircle2, KeyRound } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { authClient } from "@/lib/auth/client"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

const COPY = {
  en: {
    securityTitle: "Secure account recovery",
    securityBody: "Your verification code expires quickly and can only be used once.",
    securityOne: "Encrypted delivery",
    securityTwo: "Single-use verification codes",
    securityThree: "SOC 2 Type II security controls",
    encryption: "Encryption",
    uptime: "Uptime",
    support: "Support",
    back: "Back to sign in",
    requestTitle: "Reset your password",
    requestBody: "Enter your email and we will send a verification code.",
    email: "Email address",
    emailPlaceholder: "you@company.com",
    send: "Send verification code",
    sending: "Sending code...",
    resetTitle: "Enter verification code",
    resetBody: (email: string) => `We sent a code to ${email}.`,
    code: "Verification code",
    codePlaceholder: "Enter the 6-digit code",
    newPassword: "New password",
    newPasswordPlaceholder: "Enter a new password",
    update: "Update password",
    updating: "Updating password...",
    useDifferentEmail: "Use a different email address",
    successTitle: "Password updated",
    successBody: "You can now sign in with the new password.",
    needHelp: "Need help?",
    contact: "Contact support",
    sendError: "Unable to send the verification code.",
    resetError: "Unable to reset password. Please try again.",
  },
  ar: {
    securityTitle: "استعادة آمنة للحساب",
    securityBody: "رمز التحقق قصير المدة ويُستخدم مرة واحدة فقط حتى تبقى العملية آمنة وسريعة.",
    securityOne: "إرسال مشفّر وآمن",
    securityTwo: "رموز تحقق لمرة واحدة",
    securityThree: "ضوابط أمنية بمعيار SOC 2 Type II",
    encryption: "تشفير",
    uptime: "جاهزية",
    support: "دعم",
    back: "العودة إلى الدخول",
    requestTitle: "استعد كلمة المرور",
    requestBody: "اكتب بريدك الإلكتروني وسنرسل لك رمز تحقق لتأكيد الهوية.",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@company.com",
    send: "إرسال رمز التحقق",
    sending: "جارٍ إرسال الرمز...",
    resetTitle: "أدخل رمز التحقق",
    resetBody: (email: string) => `أرسلنا الرمز إلى ${email}.`,
    code: "رمز التحقق",
    codePlaceholder: "اكتب الرمز من 6 خانات",
    newPassword: "كلمة المرور الجديدة",
    newPasswordPlaceholder: "اكتب كلمة مرور جديدة",
    update: "تحديث كلمة المرور",
    updating: "جارٍ تحديث كلمة المرور...",
    useDifferentEmail: "استخدم بريدًا مختلفًا",
    successTitle: "تم تحديث كلمة المرور",
    successBody: "يمكنك الآن الدخول بكلمة المرور الجديدة.",
    needHelp: "تحتاج مساعدة؟",
    contact: "تواصل مع الدعم",
    sendError: "تعذر إرسال رمز التحقق الآن.",
    resetError: "تعذر تحديث كلمة المرور الآن. حاول مرة أخرى.",
  },
} as const

export default function ForgotPasswordPage() {
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"request" | "reset" | "success">("request")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const homeHref = prefixLocalePath("/", locale)
  const loginHref = prefixLocalePath("/login", locale)
  const contactHref = prefixLocalePath("/contact", locale)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const { error } = await authClient.forgetPassword.emailOtp({ email })
    setIsLoading(false)

    if (error) {
      setErrorMessage(error.message || copy.sendError)
      return
    }

    setStep("reset")
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password: newPassword,
    })
    setIsLoading(false)

    if (error) {
      setErrorMessage(error.message || copy.resetError)
      return
    }

    setStep("success")
  }

  return (
    <div className="relative min-h-screen flex bg-background overflow-hidden">
      <GridBackground />

      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(34, 94, 223, 0.08) 0%, transparent 70%)" }}
      />

      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
        <Link href={homeHref} className="flex items-center justify-start">
          <Image src="/entrestate-logo.svg" alt="Entrestate" width={138} height={32} priority />
        </Link>

        <div className="max-w-md">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <KeyRound className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-semibold text-foreground mb-4">{copy.securityTitle}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">{copy.securityBody}</p>
          </div>

          <div className="space-y-4">
            {[copy.securityOne, copy.securityTwo, copy.securityThree].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-12">
          <div>
            <p className="text-3xl font-semibold text-foreground">256-bit</p>
            <p className="text-sm text-muted-foreground mt-1">{copy.encryption}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-foreground">99.99%</p>
            <p className="text-sm text-muted-foreground mt-1">{copy.uptime}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-foreground">24/7</p>
            <p className="text-sm text-muted-foreground mt-1">{copy.support}</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href={homeHref} className="flex items-center justify-center">
              <Image src="/entrestate-logo.svg" alt="Entrestate" width={138} height={32} priority />
            </Link>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl p-8">
            <AnimatePresence mode="wait">
              {step === "request" && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={loginHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    {copy.back}
                  </Link>

                  <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-foreground">{copy.requestTitle}</h1>
                    <p className="text-muted-foreground mt-2 text-sm">{copy.requestBody}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        {copy.email}
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={copy.emailPlaceholder}
                          required
                          className="w-full px-4 py-2.5 pl-11 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 mt-2" disabled={isLoading}>
                      {isLoading ? copy.sending : copy.send}
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === "reset" && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={loginHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    {copy.back}
                  </Link>

                  <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-foreground">{copy.resetTitle}</h1>
                    <p className="text-muted-foreground mt-2 text-sm">{copy.resetBody(email)}</p>
                  </div>

                  <form onSubmit={handleReset} className="space-y-4">
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">
                        {copy.code}
                      </label>
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder={copy.codePlaceholder}
                        required
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                        {copy.newPassword}
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={copy.newPasswordPlaceholder}
                        required
                        minLength={8}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>

                    {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 mt-2" disabled={isLoading}>
                      {isLoading ? copy.updating : copy.update}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setOtp("")
                        setNewPassword("")
                        setStep("request")
                      }}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copy.useDifferentEmail}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </motion.div>
                  </div>

                  <h1 className="text-2xl font-semibold text-foreground mb-2">{copy.successTitle}</h1>
                  <p className="text-muted-foreground text-sm mb-6">{copy.successBody}</p>

                  <Link href={loginHref}>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 bg-transparent">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {copy.back}
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {copy.needHelp}{" "}
            <Link href={contactHref} className="text-primary hover:underline font-medium">
              {copy.contact}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

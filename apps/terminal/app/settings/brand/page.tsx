"use client"

import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Palette, Image, BadgeCheck, Save, Loader2, Check, Lock } from "lucide-react"
import { type AppLocale } from "@/i18n/locale"

type TierName = "free" | "pro" | "team" | "institutional"

function tierLabel(tier: TierName, locale: AppLocale) {
  if (locale !== "ar") return tier === "institutional" ? "Institutional" : tier === "team" ? "Team" : tier === "pro" ? "Pro" : "Free"
  return tier === "institutional" ? "مؤسسية" : tier === "team" ? "فريق" : tier === "pro" ? "احترافية" : "مجانية"
}

const COPY = {
  en: {
    eyebrow: "Settings - Brand",
    title: "Brand controls",
    subtitle: "Control how reports, decks, and embedded widgets present your organization.",
    lockTitle: "Team or Institutional tier required",
    lockBody: "Upgrade to customize brand controls on artifacts.",
    identity: "Company identity",
    companyName: "Company name",
    companyPlaceholder: "Your company name",
    logoSoon: "Logo updates are handled through support after brand review.",
    colors: "Color system",
    accent: "Accent color",
    preview: "Preview",
    badge: "Verification badge",
    badgeBody: "This badge appears on generated artifacts and embedded widgets.",
    lockedBranding: '"Powered by Entrestate" branding is permanent on Free and Pro tiers.',
    customBranding: 'Custom branding replaces default "Powered by Entrestate" on all outputs.',
    saving: "Saving...",
    saved: "Saved",
    save: "Save brand",
  },
  ar: {
    eyebrow: "الإعدادات — الهوية",
    title: "هوية المخرجات",
    subtitle: "ما يظهر على التقارير والملفات المولدة والودجات المدمجة باسم جهتك.",
    lockTitle: "تحتاج إلى باقة فريق أو مؤسسية",
    lockBody: "رقِّ باقتك للتحكم في هوية المخرجات والشارة الظاهرة على الملفات.",
    identity: "هوية الجهة",
    companyName: "اسم الجهة",
    companyPlaceholder: "اسم الشركة أو الفريق",
    logoSoon: "تحديثات الشعار تُدار عبر الدعم بعد مراجعة الهوية.",
    colors: "الألوان",
    accent: "لون التمييز",
    preview: "معاينة",
    badge: "شارة الاعتماد",
    badgeBody: "تظهر هذه الشارة على الملفات المولدة والودجات المدمجة.",
    lockedBranding: 'عبارة "Powered by Entrestate" تبقى ثابتة في باقتي مجانية واحترافية.',
    customBranding: 'يمكنك استبدال العبارة الافتراضية بهوية الجهة على جميع المخرجات.',
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ",
    save: "حفظ الهوية",
  },
} as const

export default function BrandSettingsPage() {
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const [companyName, setCompanyName] = useState("")
  const [accentColor, setAccentColor] = useState("#2f5aa6")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tier, setTier] = useState<TierName>("free")

  useEffect(() => {
    Promise.allSettled([fetch("/api/profile"), fetch("/api/account/entitlement")])
      .then(async ([profileResult, entitlementResult]) => {
        if (profileResult.status === "fulfilled") {
          const res = profileResult.value
          const data = res.ok ? await res.json() : null
          if (data?.inferredSignals?.comprehensiveProfile?.branding) {
            const branding = data.inferredSignals.comprehensiveProfile.branding
            setCompanyName(branding.companyName ?? "")
            setAccentColor(branding.accentColor ?? "#2f5aa6")
          }
        }

        if (entitlementResult.status === "fulfilled") {
          const res = entitlementResult.value
          const data = res.ok ? await res.json() : null
          const nextTier = data?.tier
          if (nextTier === "free" || nextTier === "pro" || nextTier === "team" || nextTier === "institutional") {
            setTier(nextTier)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const isLocked = tier === "free" || tier === "pro"

  async function saveBrand() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/profile")
      const current = res.ok ? await res.json() : {}
      const signals = current.inferredSignals ?? {}
      const comprehensive = signals.comprehensiveProfile ?? {}

      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inferredSignals: {
            ...signals,
            comprehensiveProfile: {
              ...comprehensive,
              branding: { companyName, accentColor },
            },
          },
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.eyebrow}</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground">{copy.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{copy.subtitle}</p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="relative">
              {isLocked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
                  <div className="text-center max-w-xs">
                    <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">{copy.lockTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">{copy.lockBody}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Image className="h-5 w-5 text-accent" />
                    <h2 className="text-lg font-semibold text-foreground">{copy.identity}</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.companyName}</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={copy.companyPlaceholder}
                        disabled={isLocked}
                        className="mt-2 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
                      />
                    </div>
                    <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center">
                      <Image className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{copy.logoSoon}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5 text-accent" />
                    <h2 className="text-lg font-semibold text-foreground">{copy.colors}</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.accent}</label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          disabled={isLocked}
                          className="h-10 w-10 rounded-lg border border-border/60 cursor-pointer disabled:opacity-50"
                        />
                        <input
                          type="text"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          disabled={isLocked}
                          className="flex-1 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary/50 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{copy.preview}</p>
                      <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-2">
                        <div className="h-2 rounded-full" style={{ backgroundColor: accentColor, width: "60%" }} />
                        <div className="h-2 rounded-full bg-muted" style={{ width: "80%" }} />
                        <div className="h-2 rounded-full bg-muted" style={{ width: "40%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BadgeCheck className="h-5 w-5 text-accent" />
                    <h2 className="text-lg font-semibold text-foreground">{copy.badge}</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{tierLabel(tier, locale)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{copy.badgeBody}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                      <p className="text-xs text-muted-foreground">{isLocked ? copy.lockedBranding : copy.customBranding}</p>
                    </div>
                  </div>
                </div>
              </div>

              {!isLocked && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveBrand}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium transition hover:bg-foreground/90 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> {copy.saving}
                      </>
                    ) : saved ? (
                      <>
                        <Check className="h-4 w-4" /> {copy.saved}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> {copy.save}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  consentCookieName,
  consentStorageKey,
  defaultConsentState,
  type ConsentCategory,
  type ConsentState,
} from "@/lib/consent"

function readConsent() {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(consentStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    } satisfies ConsentState
  } catch {
    return null
  }
}

function writeConsent(consent: ConsentState) {
  window.localStorage.setItem(consentStorageKey, JSON.stringify(consent))

  const maxAge = 60 * 60 * 24 * 365
  const encoded = encodeURIComponent(JSON.stringify(consent))
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${consentCookieName}=${encoded}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
  window.dispatchEvent(new CustomEvent("entrestate:consent", { detail: consent }))
}

export function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [consent, setConsent] = useState<ConsentState>(defaultConsentState)

  useEffect(() => {
    if (!readConsent()) {
      setOpen(true)
      return
    }

    setConsent(readConsent() ?? defaultConsentState)
  }, [])

  if (!open) return null

  const updateToggle = (key: ConsentCategory, value: boolean) => {
    setConsent((current) => ({
      ...current,
      [key]: key === "essential" ? true : value,
    }))
  }

  const acceptAll = () => {
    writeConsent({
      essential: true,
      analytics: true,
      marketing: true,
    })
    setOpen(false)
  }

  const rejectNonEssential = () => {
    writeConsent(defaultConsentState)
    setOpen(false)
  }

  const savePreferences = () => {
    writeConsent({
      ...consent,
      essential: true,
    })
    setOpen(false)
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-border/70 bg-background/95 p-5 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Cookie preferences</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Entrestate uses essential cookies for sessions and security. Analytics and marketing cookies are optional
            and stay off until you opt in. Details are published on{" "}
            <Link href="/cookies" className="text-foreground underline underline-offset-4">
              the cookie policy
            </Link>
            .
          </p>
        </div>

        {showPreferences ? (
          <div className="grid gap-3 rounded-xl border border-border/60 bg-card/60 p-4">
            {([
              ["essential", "Essential", "Required for auth, locale, and security."],
              ["analytics", "Analytics", "Helps us measure reliability and product quality."],
              ["marketing", "Marketing", "Used only for optional campaign attribution."],
            ] as const).map(([key, label, description]) => (
              <label key={key} className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-medium text-foreground">{label}</span>
                  <span className="block text-sm text-muted-foreground">{description}</span>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={key === "essential" ? true : consent[key]}
                  disabled={key === "essential"}
                  onChange={(event) => updateToggle(key, event.currentTarget.checked)}
                />
              </label>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={acceptAll}>
            Accept all
          </Button>
          <Button size="sm" variant="outline" onClick={rejectNonEssential}>
            Reject non-essential
          </Button>
          {showPreferences ? (
            <Button size="sm" variant="ghost" onClick={savePreferences}>
              Save preferences
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setShowPreferences(true)}>
              Manage preferences
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

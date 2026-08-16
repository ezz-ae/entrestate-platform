export type ConsentCategory = "essential" | "analytics" | "marketing"
export type ConsentState = Record<ConsentCategory, boolean>

export const consentStorageKey = "entrestate-consent-v1"
export const consentCookieName = "entrestate-consent"

export const defaultConsentState: ConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
}

export function getConsentState(): ConsentState {
  if (typeof window === "undefined") return defaultConsentState

  try {
    const raw = window.localStorage.getItem(consentStorageKey)
    if (!raw) return defaultConsentState
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    }
  } catch {
    return defaultConsentState
  }
}

export function onConsentChange(handler: (consent: ConsentState) => void) {
  if (typeof window === "undefined") return () => {}

  const listener = (event: Event) => {
    handler((event as CustomEvent<ConsentState>).detail)
  }

  window.addEventListener("entrestate:consent", listener)
  return () => window.removeEventListener("entrestate:consent", listener)
}

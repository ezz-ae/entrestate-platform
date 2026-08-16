type OverlayState = {
  root: HTMLDivElement
  close: () => void
}

type DistributionTier = "free" | "pro" | "enterprise"

type WidgetAttributes = {
  interaction: "overlay" | "redirect"
  leadMagnet: boolean
  leadWebhook: string | null
  tier: DistributionTier
  accent: string | null
  badgeText: string | null
  logoUrl: string | null
  upgradeUrl: string | null
  widgetId: string | null
  widgetType: string | null
}

type InitOptions = {
  apiBase?: string
}

const DEFAULT_API_BASE = ""
const DEFAULT_ACCENT = "#0f172a"
const DEFAULT_BADGE = "Powered by Entrestate"
const ATTRIBUTION_ENDPOINT = "/api/attribution"
const SESSION_KEY = "entrestate:widget-session-id"
const VIEW_DEDUP_PREFIX = "entrestate:widget-view:"
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000

function normalizeTier(value: string | null): DistributionTier {
  if (value === "pro" || value === "enterprise") return value
  return "free"
}

function sanitizeAccent(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(trimmed)) return trimmed
  return null
}

function resolveUrl(apiBase: string, path: string) {
  if (!apiBase) return path
  try {
    return new URL(path, apiBase).toString()
  } catch {
    return path
  }
}

function readAttributes(container: HTMLElement): WidgetAttributes {
  const interactionRaw = container.getAttribute("data-interaction")?.toLowerCase().trim() ?? "overlay"
  return {
    interaction: interactionRaw === "redirect" ? "redirect" : "overlay",
    leadMagnet: container.getAttribute("data-lead-magnet") === "true",
    leadWebhook: container.getAttribute("data-lead-webhook"),
    tier: normalizeTier(container.getAttribute("data-tier")),
    accent: sanitizeAccent(container.getAttribute("data-accent")),
    badgeText: container.getAttribute("data-badge"),
    logoUrl: container.getAttribute("data-logo"),
    upgradeUrl: container.getAttribute("data-upgrade-url"),
    widgetId: container.getAttribute("data-widget-id") ?? container.getAttribute("data-entrestate-widget"),
    widgetType: container.getAttribute("data-widget-type"),
  }
}

function buildChatTarget(widgetId: string | null) {
  if (!widgetId) return "/chat?ref=widget"
  return `/chat?ref=widget&wid=${encodeURIComponent(widgetId)}`
}

function openFallbackTab(apiBase: string, widgetId: string | null) {
  const target = resolveUrl(apiBase, buildChatTarget(widgetId))
  window.open(target, "_blank", "noopener,noreferrer")
}

function getSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `widget-${Date.now()}-${Math.random().toString(16).slice(2)}`
    window.sessionStorage.setItem(SESSION_KEY, generated)
    return generated
  } catch {
    return `widget-${Date.now()}`
  }
}

function shouldTrackView(widgetId: string, sessionId: string) {
  try {
    const storageKey = `${VIEW_DEDUP_PREFIX}${widgetId}:${sessionId}`
    const lastSeen = window.sessionStorage.getItem(storageKey)
    if (lastSeen) {
      const elapsed = Date.now() - Number(lastSeen)
      if (Number.isFinite(elapsed) && elapsed < VIEW_DEDUP_WINDOW_MS) {
        return false
      }
    }
    window.sessionStorage.setItem(storageKey, String(Date.now()))
    return true
  } catch {
    return true
  }
}

function emitAttribution(
  apiBase: string,
  payload: Record<string, unknown>,
) {
  const url = resolveUrl(apiBase, ATTRIBUTION_ENDPOINT)
  const body = JSON.stringify(payload)

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" })
      navigator.sendBeacon(url, blob)
      return
    }
  } catch {}

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined)
}

function trackWidgetView(apiBase: string, attrs: WidgetAttributes) {
  const widgetId = attrs.widgetId
  if (!widgetId) return
  const sessionId = getSessionId()
  if (!shouldTrackView(widgetId, sessionId)) return

  emitAttribution(apiBase, {
    event_type: "widget_view",
    widget_id: widgetId,
    embed_type: attrs.widgetType ?? undefined,
    source_domain: window.location.hostname,
    source_page_url: window.location.href,
    session_id: sessionId,
  })
}

function trackWidgetClick(apiBase: string, attrs: WidgetAttributes) {
  const widgetId = attrs.widgetId
  if (!widgetId) return

  emitAttribution(apiBase, {
    event_type: "widget_click",
    widget_id: widgetId,
    embed_type: attrs.widgetType ?? undefined,
    source_domain: window.location.hostname,
    source_page_url: window.location.href,
    session_id: getSessionId(),
    metadata: {
      click_target: buildChatTarget(widgetId),
    },
  })
}

function createOverlay(title: string, body: string): OverlayState {
  const backdrop = document.createElement("div")
  backdrop.setAttribute("data-entrestate-overlay", "true")
  backdrop.style.position = "fixed"
  backdrop.style.inset = "0"
  backdrop.style.background = "rgba(2, 6, 23, 0.55)"
  backdrop.style.zIndex = "2147483646"
  backdrop.style.display = "flex"
  backdrop.style.alignItems = "center"
  backdrop.style.justifyContent = "center"
  backdrop.style.padding = "16px"

  const panel = document.createElement("div")
  panel.style.maxWidth = "640px"
  panel.style.width = "100%"
  panel.style.background = "#ffffff"
  panel.style.borderRadius = "12px"
  panel.style.border = "1px solid #e2e8f0"
  panel.style.padding = "16px"
  panel.style.boxShadow = "0 20px 50px rgba(2, 6, 23, 0.25)"

  const heading = document.createElement("h3")
  heading.textContent = title
  heading.style.margin = "0"
  heading.style.font = "600 18px/1.4 Inter, Arial, sans-serif"
  heading.style.color = "#0f172a"

  const text = document.createElement("p")
  text.textContent = body
  text.style.margin = "10px 0 0"
  text.style.font = "400 14px/1.5 Inter, Arial, sans-serif"
  text.style.color = "#334155"

  const closeButton = document.createElement("button")
  closeButton.type = "button"
  closeButton.textContent = "Close"
  closeButton.style.marginTop = "14px"
  closeButton.style.border = "1px solid #cbd5e1"
  closeButton.style.borderRadius = "8px"
  closeButton.style.background = "#ffffff"
  closeButton.style.padding = "8px 12px"
  closeButton.style.cursor = "pointer"

  panel.append(heading, text, closeButton)
  backdrop.append(panel)

  const close = () => {
    backdrop.remove()
  }

  closeButton.addEventListener("click", close)
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close()
  })

  document.body.appendChild(backdrop)

  return { root: backdrop, close }
}

async function submitDualCapture(apiBase: string, webhook: string | null, email: string, widgetId: string | null) {
  const query = widgetId
    ? `?tier=free&source=widget&wid=${encodeURIComponent(widgetId)}`
    : "?tier=free&source=widget"
  const signupUrl = `${apiBase}/api/signup${query}`
  const body = JSON.stringify({ email })

  const tasks: Promise<unknown>[] = [
    fetch(signupUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }),
  ]

  if (webhook) {
    tasks.push(
      fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        mode: "cors",
        keepalive: true,
      }),
    )
  }

  await Promise.allSettled(tasks)
}

function resolveBranding(attrs: WidgetAttributes) {
  if (attrs.tier === "free") {
    return {
      accent: DEFAULT_ACCENT,
      badgeText: DEFAULT_BADGE,
      logoUrl: null,
    }
  }

  return {
    accent: attrs.accent ?? DEFAULT_ACCENT,
    badgeText: attrs.badgeText,
    logoUrl: attrs.logoUrl,
  }
}

function resolveUpgradeUrl(apiBase: string, custom: string | null) {
  if (custom) return custom
  if (apiBase) return resolveUrl(apiBase, "/pricing")
  return "/pricing"
}

function createMountRoot(container: HTMLElement) {
  if (container.attachShadow) {
    const shadowRoot = container.shadowRoot ?? container.attachShadow({ mode: "open" })
    shadowRoot.replaceChildren()
    const root = document.createElement("div")
    shadowRoot.appendChild(root)
    return root
  }

  container.replaceChildren()
  return container
}

function createMetricRow(label: string, value: string) {
  const row = document.createElement("div")
  row.style.display = "flex"
  row.style.justifyContent = "space-between"
  row.style.fontSize = "12px"
  row.style.color = "#0f172a"

  const labelEl = document.createElement("span")
  labelEl.textContent = label
  labelEl.style.color = "#64748b"

  const valueEl = document.createElement("span")
  valueEl.textContent = value
  valueEl.style.fontWeight = "600"

  row.append(labelEl, valueEl)
  return row
}

function mountWidget(container: HTMLElement, options: InitOptions) {
  const apiBase = options.apiBase ?? DEFAULT_API_BASE
  const attrs = readAttributes(container)
  const branding = resolveBranding(attrs)
  const upgradeUrl = resolveUpgradeUrl(apiBase, attrs.upgradeUrl)
  const widgetId = attrs.widgetId

  const root = createMountRoot(container)
  const wrapper = document.createElement("div")
  wrapper.style.fontFamily = "Inter, Arial, sans-serif"
  wrapper.style.border = "1px solid #e2e8f0"
  wrapper.style.borderRadius = "12px"
  wrapper.style.padding = "12px"
  wrapper.style.background = "#ffffff"
  wrapper.style.boxShadow = "0 14px 30px rgba(15, 23, 42, 0.08)"
  wrapper.style.display = "flex"
  wrapper.style.flexDirection = "column"
  wrapper.style.gap = "12px"

  const header = document.createElement("div")
  header.style.display = "flex"
  header.style.flexDirection = "column"
  header.style.gap = "6px"

  const title = document.createElement("div")
  title.textContent = "Market evidence widget"
  title.style.fontSize = "14px"
  title.style.fontWeight = "600"
  title.style.color = "#0f172a"

  const subtitle = document.createElement("div")
  subtitle.textContent = "Decision-grade signals with verified benchmarks."
  subtitle.style.fontSize = "12px"
  subtitle.style.color = "#475569"

  if (branding.logoUrl) {
    const logo = document.createElement("img")
    logo.src = branding.logoUrl
    logo.alt = "Brand logo"
    logo.style.height = "20px"
    header.append(logo)
  }

  header.append(title, subtitle)

  const action = document.createElement("button")
  action.type = "button"
  action.textContent = "Open evidence drawer"
  action.style.border = "0"
  action.style.borderRadius = "8px"
  action.style.background = branding.accent
  action.style.color = "#ffffff"
  action.style.padding = "9px 12px"
  action.style.cursor = "pointer"

  action.addEventListener("click", () => {
    trackWidgetClick(apiBase, attrs)
    if (attrs.interaction === "overlay") {
      try {
        createOverlay("Evidence Drawer", "You are viewing evidence without leaving the broker page.")
        window.dispatchEvent(new CustomEvent("open_evidence_drawer"))
        return
      } catch {
        openFallbackTab(apiBase, widgetId)
        return
      }
    }
    openFallbackTab(apiBase, widgetId)
  })

  const metrics = document.createElement("div")
  metrics.style.display = "grid"
  metrics.style.gap = "6px"
  metrics.style.padding = "10px"
  metrics.style.border = "1px solid #e2e8f0"
  metrics.style.borderRadius = "10px"
  metrics.style.background = "#f8fafc"
  metrics.append(
    createMetricRow("Market score", "82"),
    createMetricRow("Yield band", "2.6%"),
    createMetricRow("Timing label", "BUY"),
  )

  wrapper.append(header, metrics, action)

  if (attrs.leadMagnet) {
    const form = document.createElement("form")
    form.style.marginTop = "12px"
    form.style.display = "flex"
    form.style.gap = "8px"

    const input = document.createElement("input")
    input.type = "email"
    input.required = true
    input.placeholder = "you@company.com"
    input.style.flex = "1"
    input.style.border = "1px solid #cbd5e1"
    input.style.borderRadius = "8px"
    input.style.padding = "8px"

    const submit = document.createElement("button")
    submit.type = "submit"
    submit.textContent = "Get report"
    submit.style.border = "1px solid #cbd5e1"
    submit.style.borderRadius = "8px"
    submit.style.background = "#f8fafc"
    submit.style.padding = "8px 10px"
    submit.style.cursor = "pointer"

    form.addEventListener("submit", async (event) => {
      event.preventDefault()
      if (!input.value) return
      submit.disabled = true
      await submitDualCapture(apiBase, attrs.leadWebhook, input.value, widgetId)
      submit.disabled = false
      createOverlay("Request received", "We sent your details for broker follow-up and Entrestate access.")
    })

    form.append(input, submit)
    wrapper.append(form)
  }

  if (attrs.tier === "free") {
    const locked = document.createElement("div")
    locked.style.display = "grid"
    locked.style.gap = "6px"
    locked.style.padding = "10px"
    locked.style.borderRadius = "10px"
    locked.style.border = "1px dashed #cbd5f5"
    locked.style.background = "#f1f5f9"
    locked.style.filter = "blur(4px)"
    locked.style.opacity = "0.75"
    locked.style.pointerEvents = "none"
    locked.append(
      createMetricRow("Price confidence", "HIGH"),
      createMetricRow("Developer score", "88"),
      createMetricRow("Evidence depth", "L4"),
    )

    const upgrade = document.createElement("button")
    upgrade.type = "button"
    upgrade.textContent = "Unlock full dataset"
    upgrade.style.border = "1px solid #cbd5e1"
    upgrade.style.borderRadius = "8px"
    upgrade.style.padding = "8px 10px"
    upgrade.style.cursor = "pointer"
    upgrade.style.background = "#ffffff"
    upgrade.style.color = "#0f172a"
    upgrade.addEventListener("click", () => window.open(upgradeUrl, "_blank", "noopener,noreferrer"))

    wrapper.append(locked, upgrade)
  }

  const badgeText = branding.badgeText
  if (badgeText) {
    const badge = document.createElement("div")
    badge.textContent = badgeText
    badge.style.fontSize = "11px"
    badge.style.fontWeight = "600"
    badge.style.textTransform = "uppercase"
    badge.style.letterSpacing = "0.08em"
    badge.style.color = "#64748b"
    badge.style.setProperty("display", "block", "important")
    badge.style.setProperty("visibility", "visible", "important")
    badge.style.setProperty("opacity", "1", "important")
    wrapper.append(badge)
  }

  root.appendChild(wrapper)

  if (typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          trackWidgetView(apiBase, attrs)
          observer.disconnect()
          break
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(container)
  } else {
    trackWidgetView(apiBase, attrs)
  }
}

export function initEntrestateWidgets(options: InitOptions = {}) {
  const containers = Array.from(document.querySelectorAll<HTMLElement>("[data-entrestate-widget]"))
  containers.forEach((container) => mountWidget(container, options))
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initEntrestateWidgets())
  } else {
    initEntrestateWidgets()
  }
}

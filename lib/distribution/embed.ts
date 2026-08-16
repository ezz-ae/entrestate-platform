export type DistributionTier = "free" | "pro" | "enterprise"

export type EmbedBranding = {
  primaryColor?: string
  logoUrl?: string
  badgeText?: string
}

export type EmbedConfig = {
  widgetId: string
  tableHash: string
  widgetType?: "market_card" | "area_table" | "score_badge" | "market_pulse"
  tier?: DistributionTier
  branding?: EmbedBranding
}

const defaultBadge = "Powered by Entrestate"
const leadMagnetWidgets = new Set(["market_card", "area_table"])

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function generateEmbedSnippet(config: EmbedConfig): string {
  const tier = config.tier ?? "free"
  const branding = config.branding ?? {}
  const badgeText = tier === "free" ? defaultBadge : branding.badgeText
  const primaryColor = tier === "free" ? "#0f172a" : branding.primaryColor ?? "#0f172a"
  const logo = tier === "free" ? undefined : branding.logoUrl
  const leadMagnet = leadMagnetWidgets.has(config.widgetId) ? "true" : "false"

  const badgeMarkup = badgeText
    ? `<div style="font: 12px/1.4 Arial, sans-serif; color: #334155; margin-top: 8px;">${escapeHtml(badgeText)}</div>`
    : ""

  const logoMarkup = logo
    ? `<img src="${escapeHtml(logo)}" alt="Brand logo" style="height: 24px; margin-bottom: 8px;" />`
    : ""

  const dataAttributes = [
    `data-entrestate-widget="${escapeHtml(config.widgetId)}"`,
    `data-widget-id="${escapeHtml(config.widgetId)}"`,
    `data-widget-type="${escapeHtml(config.widgetType ?? "market_card")}"`,
    `data-table-hash="${escapeHtml(config.tableHash)}"`,
    `data-interaction="overlay"`,
    `data-lead-magnet="${leadMagnet}"`,
    `data-tier="${tier}"`,
    primaryColor && tier !== "free" ? `data-accent="${escapeHtml(primaryColor)}"` : "",
    badgeText ? `data-badge="${escapeHtml(badgeText)}"` : "",
    logo ? `data-logo="${escapeHtml(logo)}"` : "",
  ]
    .filter(Boolean)
    .join(" ")

  return `<!-- Entrestate Widget Embed -->
<div ${dataAttributes} style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;">
  ${logoMarkup}
  <div style="font: 14px/1.4 Arial, sans-serif; color: #0f172a; margin-bottom: 8px;">Live Entrestate Intelligence</div>
  <div style="height: 120px; background: linear-gradient(135deg, ${primaryColor}22, #f8fafc); border-radius: 8px;"></div>
  ${badgeMarkup}
</div>
<!-- /Entrestate Widget Embed -->`
}

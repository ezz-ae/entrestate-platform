import "server-only"
import type { ConnectorType } from "@prisma/client"

/**
 * Central registry of every external system Entrestate can connect to.
 *
 * Three families — gated by tier:
 *   - portal   : property listing portals (Bayut, Property Finder, Dubizzle)
 *   - crm      : sales CRMs (HubSpot, Pipedrive, Bitrix24)
 *   - feed     : custom inbound webhooks / outbound exports / SFTP drops
 *
 * Each entry here renders a connector card on /me/connections. The user supplies
 * credentials, we store them encrypted in `connector_credentials.config`,
 * and a worker picks them up to ingest.
 */

export type ConnectorFamily = "portal" | "crm" | "feed"

export interface ConnectorAuthField {
  key: string
  label: string
  type: "text" | "password" | "url" | "email" | "select"
  placeholder?: string
  required?: boolean
  helpText?: string
  options?: { value: string; label: string }[]
}

export interface ConnectorDefinition {
  id: string
  name: string
  family: ConnectorFamily
  /** Maps to the Prisma ConnectorType enum value. */
  prismaType: ConnectorType
  /** Lowest tier that can use this connector. */
  minTier: "free" | "pro" | "team" | "institutional"
  description: string
  /** Logo path under /public — drop logos in /public/connectors/ */
  logoPath: string
  /** Auth fields rendered in the setup form. */
  authFields: ConnectorAuthField[]
  /** Human-readable list of what this connector pulls / pushes. */
  capabilities: string[]
  /** Optional doc link. */
  docsUrl?: string
}

export const CONNECTORS: ConnectorDefinition[] = [
  // ────────────────────────────── PORTALS ──────────────────────────────
  {
    id: "bayut",
    name: "Bayut",
    family: "portal",
    prismaType: "listings",
    minTier: "pro",
    description: "Pull your live listings from Bayut and run Entrestate's evidence-graded scoring against each one nightly.",
    logoPath: "/connectors/bayut.svg",
    authFields: [
      { key: "agent_id", label: "Bayut Agent ID", type: "text", required: true, placeholder: "AGT-12345" },
      { key: "api_key", label: "Bayut API key", type: "password", required: true, helpText: "Found in Bayut Pro → Settings → API." },
    ],
    capabilities: ["Pull listings nightly", "Sync price changes", "Auto-score against L1–L5 evidence stack", "Yield & verdict per listing"],
    docsUrl: "https://entrestate.com/docs/connectors/bayut",
  },
  {
    id: "property-finder",
    name: "Property Finder",
    family: "portal",
    prismaType: "listings",
    minTier: "pro",
    description: "Mirror every Property Finder listing into your Entrestate workspace with evidence-graded scoring.",
    logoPath: "/connectors/property-finder.svg",
    authFields: [
      { key: "broker_id", label: "Broker ID", type: "text", required: true },
      { key: "api_token", label: "API token", type: "password", required: true },
    ],
    capabilities: ["Listings pull", "Inquiry sync", "Per-listing verdict", "Comparable property recommendations"],
  },
  {
    id: "dubizzle",
    name: "Dubizzle Property",
    family: "portal",
    prismaType: "listings",
    minTier: "pro",
    description: "Ingest your Dubizzle Property inventory.",
    logoPath: "/connectors/dubizzle.svg",
    authFields: [
      { key: "account_email", label: "Account email", type: "email", required: true },
      { key: "api_key", label: "API key", type: "password", required: true },
    ],
    capabilities: ["Listings pull", "Lead routing"],
  },

  // ──────────────────────────────── CRM ────────────────────────────────
  {
    id: "hubspot",
    name: "HubSpot",
    family: "crm",
    prismaType: "crm",
    minTier: "team",
    description: "Push verdicts, area pulse and your own scored listings into HubSpot deals — and pull contacts back to enrich Entrestate.",
    logoPath: "/connectors/hubspot.svg",
    authFields: [
      { key: "private_app_token", label: "Private app token", type: "password", required: true, helpText: "HubSpot → Settings → Integrations → Private apps." },
      { key: "portal_id", label: "Portal ID", type: "text", required: true },
    ],
    capabilities: ["Two-way contact sync", "Push verdicts to deal record", "Pull pipeline metrics", "Enrich Entrestate accounts with company data"],
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    family: "crm",
    prismaType: "crm",
    minTier: "team",
    description: "Sync deals, contacts, activities — and pin Entrestate verdicts to every deal.",
    logoPath: "/connectors/pipedrive.svg",
    authFields: [
      { key: "api_token", label: "API token", type: "password", required: true },
      { key: "company_domain", label: "Company subdomain", type: "text", required: true, placeholder: "yourco" },
    ],
    capabilities: ["Deal sync", "Activity sync", "Pin verdicts to deals"],
  },
  {
    id: "bitrix24",
    name: "Bitrix24",
    family: "crm",
    prismaType: "crm",
    minTier: "team",
    description: "Two-way sync with Bitrix24 — popular among UAE/CIS brokerages.",
    logoPath: "/connectors/bitrix24.svg",
    authFields: [
      { key: "webhook_url", label: "Inbound webhook URL", type: "url", required: true },
      { key: "outbound_token", label: "Outbound token", type: "password", required: true },
    ],
    capabilities: ["Lead sync", "Deal sync", "Listing pinning"],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    family: "crm",
    prismaType: "crm",
    minTier: "institutional",
    description: "Enterprise CRM — OAuth + per-team object mapping.",
    logoPath: "/connectors/salesforce.svg",
    authFields: [
      { key: "instance_url", label: "Instance URL", type: "url", required: true },
      { key: "client_id", label: "Connected App client ID", type: "text", required: true },
      { key: "client_secret", label: "Connected App secret", type: "password", required: true },
    ],
    capabilities: ["OAuth", "Custom object mapping", "Real-time push", "Bidirectional sync"],
  },

  // ──────────────────────────────── FEEDS ────────────────────────────────
  {
    id: "webhook-inbound",
    name: "Inbound webhook",
    family: "feed",
    prismaType: "market_intel",
    minTier: "team",
    description: "Receive listings as JSON. We give you a signed URL; your stack POSTs to it whenever a listing changes.",
    logoPath: "/connectors/webhook.svg",
    authFields: [],   // generated server-side after activation
    capabilities: ["JSON ingestion", "Schema auto-discovery", "Replay last 24h"],
  },
  {
    id: "webhook-outbound",
    name: "Outbound webhook",
    family: "feed",
    prismaType: "market_intel",
    minTier: "team",
    description: "We POST verdicts and scoring updates to your endpoint as soon as they change.",
    logoPath: "/connectors/webhook.svg",
    authFields: [
      { key: "endpoint_url", label: "Endpoint URL", type: "url", required: true },
      { key: "secret", label: "HMAC signing secret", type: "password", required: true },
    ],
    capabilities: ["Verdict change events", "Listing score events", "HMAC-signed payloads"],
  },
  {
    id: "sftp-drop",
    name: "SFTP drop",
    family: "feed",
    prismaType: "market_intel",
    minTier: "institutional",
    description: "Drop a CSV / Parquet file on our SFTP and we ingest it on a schedule.",
    logoPath: "/connectors/sftp.svg",
    authFields: [
      { key: "ssh_public_key", label: "SSH public key", type: "text", required: true, placeholder: "ssh-ed25519 AAAA…" },
    ],
    capabilities: ["Daily / hourly schedules", "CSV + Parquet", "PGP-encrypted payloads"],
  },
]

export function listConnectors(opts?: { family?: ConnectorFamily; minTier?: ConnectorDefinition["minTier"] }): ConnectorDefinition[] {
  return CONNECTORS.filter((c) => {
    if (opts?.family && c.family !== opts.family) return false
    if (opts?.minTier && c.minTier !== opts.minTier) return false
    return true
  })
}

export function getConnector(id: string): ConnectorDefinition | null {
  return CONNECTORS.find((c) => c.id === id) ?? null
}

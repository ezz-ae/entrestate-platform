import crypto from "node:crypto"
import type { TableSpec } from "../tablespec"
import { sealImmutable } from "../governance"
import { generateEmbedSnippet } from "../distribution"
import { buildEvidenceDrawer, type EvidenceOptions } from "./evidence"
import { buildPdfBase64 } from "./pdf"
import type {
  Branding,
  DecisionArtifactBase,
  DecisionArtifactFormat,
  DecisionArtifactType,
  DecisionObject,
  SealedDecisionArtifact,
} from "./types"

export type ArtifactOptions = EvidenceOptions & {
  branding?: Branding
  title?: string
}

const ensureBranding = (branding?: Branding): Branding => {
  if (!branding) return { tier: "free", badgeText: "Powered by Entrestate" }
  if (branding.tier === "free" || !branding.tier) {
    return {
      ...branding,
      tier: "free",
      badgeText: "Powered by Entrestate",
    }
  }
  return branding
}

const createArtifactBase = (
  type: DecisionArtifactType,
  format: DecisionArtifactBase["format"],
  contentType: string,
  content: string,
  tableHash: string,
  spec: TableSpec,
  options: ArtifactOptions,
  status: DecisionArtifactBase["status"],
): SealedDecisionArtifact => {
  const branding = ensureBranding(options.branding)
  const evidence = buildEvidenceDrawer(spec, tableHash, options)
  const base: DecisionArtifactBase = {
    id: crypto.randomUUID(),
    type,
    format,
    contentType,
    content,
    createdAt: new Date().toISOString(),
    timeTableHash: tableHash,
    evidence,
    branding,
    status,
  }
  return sealImmutable(base)
}

export function generatePdfReport(spec: TableSpec, tableHash: string, options: ArtifactOptions = {}) {
  const title = options.title ?? "Underwriting Report"
  const lines = [
    title,
    `Table Hash: ${tableHash}`,
    `Row Grain: ${spec.row_grain}`,
    `Signals: ${spec.signals.join(", ")}`,
    `Filters: ${spec.filters.map((filter) => `${filter.field} ${filter.op}`).join("; ") || "None"}`,
  ]
  const content = buildPdfBase64(lines)
  return createArtifactBase(
    "underwriting_report",
    "pdf",
    "application/pdf",
    content,
    tableHash,
    spec,
    options,
    "ready",
  )
}

export function generatePptxDeck(spec: TableSpec, tableHash: string, options: ArtifactOptions = {}) {
  const content = Buffer.from(
    `Entrestate PPTX placeholder for ${spec.intent} (${tableHash})`,
    "utf8",
  ).toString("base64")
  return createArtifactBase(
    "pptx_deck",
    "pptx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    content,
    tableHash,
    spec,
    options,
    "placeholder",
  )
}

export function generateHtmlWidget(spec: TableSpec, tableHash: string, options: ArtifactOptions = {}) {
  const content = generateEmbedSnippet({
    widgetId: `widget-${tableHash.slice(0, 8)}`,
    tableHash,
    tier: options.branding?.tier ?? "free",
    branding: options.branding,
  })
  return createArtifactBase(
    "widget",
    "html",
    "text/html",
    Buffer.from(content, "utf8").toString("base64"),
    tableHash,
    spec,
    options,
    "ready",
  )
}

export function generateContractDraft(spec: TableSpec, tableHash: string, options: ArtifactOptions = {}) {
  const content = [
    "SPA Contract Draft",
    "",
    `Table Hash: ${tableHash}`,
    `Intent: ${spec.intent}`,
    "",
    "[Buyer Name] agrees to purchase [Property] under the terms described.",
    "",
    "Assumptions:",
    "- Title deed clearance",
    "- Payment schedule as agreed",
  ].join("\n")
  return createArtifactBase(
    "contract_draft",
    "txt",
    "text/plain",
    Buffer.from(content, "utf8").toString("base64"),
    tableHash,
    spec,
    options,
    "ready",
  )
}

export function generateTextArtifact(
  type: DecisionArtifactType,
  spec: TableSpec,
  tableHash: string,
  text: string,
  options: ArtifactOptions = {},
  status: DecisionArtifactBase["status"] = "ready",
  format: DecisionArtifactFormat = "txt",
) {
  const contentType = format === "html" ? "text/html" : "text/plain"
  const content = Buffer.from(text, "utf8").toString("base64")
  return createArtifactBase(type, format, contentType, content, tableHash, spec, options, status)
}

export function buildDecisionObject(
  spec: TableSpec,
  tableHash: string,
  artifact: SealedDecisionArtifact,
): DecisionObject {
  return {
    artifact,
    tableSpec: spec,
  }
}

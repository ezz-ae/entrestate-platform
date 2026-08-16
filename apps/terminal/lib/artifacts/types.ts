import type { TableSpec, TableSpecFilter, TableSpecScope, TableSpecTimeRange } from "../tablespec"
import type { ImmutableRecord } from "../governance"

export type EvidenceDrawer = {
  tableHash: string
  sources: string[]
  filters: TableSpecFilter[]
  assumptions: string[]
  signals: string[]
  scope: TableSpecScope
  timeRange: TableSpecTimeRange
}

export type Branding = {
  primaryColor?: string
  logoUrl?: string
  badgeText?: string
  tier?: "free" | "pro" | "enterprise"
}

export type DecisionArtifactType =
  | "investor_memo"
  | "underwriting_report"
  | "comparison_note"
  | "contract_draft"
  | "widget"
  | "pptx_deck"
  | "social_post"
  | "offer_letter"
  | "investment_plan"
  | "brochure"

export type DecisionArtifactFormat = "pdf" | "pptx" | "html" | "txt"

export type DecisionArtifactBase = {
  id: string
  type: DecisionArtifactType
  format: DecisionArtifactFormat
  contentType: string
  content: string
  createdAt: string
  timeTableHash: string
  evidence: EvidenceDrawer
  branding: Branding
  status: "ready" | "placeholder"
}

export type SealedDecisionArtifact = ImmutableRecord<DecisionArtifactBase>

export type DecisionObject = {
  artifact: SealedDecisionArtifact
  tableSpec: TableSpec
}

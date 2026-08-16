export type RiskAppetite = "conservative" | "balanced" | "growth" | "opportunistic"
export type HorizonBand = "ready" | "6-12mo" | "1-2yr" | "2-4yr" | "4yr+"

export type ComprehensiveProfileCapabilityKey =
  | "reportExtraction"
  | "apiFeeding"
  | "clientMemory"
  | "socialNetworkReport"
  | "clientSpecificReport"
  | "highLevelInsights"

export type ComprehensiveProfileIntegrationKey =
  | "chatgpt"
  | "gemini"
  | "googleDrive"
  | "customGpts"
  | "notebookLM"

export type ComprehensiveProfileOutputKey =
  | "json"
  | "pdf"
  | "brandedFiles"

export type ComprehensiveProfileReportAudience = "client" | "social" | "investor" | "executive"

export type ComprehensiveProfileMemoryEntry = {
  id: string
  clientName: string
  contextNotes: string
  tags: string[]
}

export type ComprehensiveProfileReportTemplate = {
  id: string
  name: string
  audience: ComprehensiveProfileReportAudience
  outline: string
}

export type ComprehensiveProfileBranding = {
  companyName: string
  accentColor: string
}

export type ComprehensiveProfile = {
  assistantScope: "team"
  preferredClientTypes: string[]
  clientMemoryNotes: string
  memoryEntries: ComprehensiveProfileMemoryEntry[]
  reportTemplates: ComprehensiveProfileReportTemplate[]
  branding: ComprehensiveProfileBranding
  capabilities: Record<ComprehensiveProfileCapabilityKey, boolean>
  integrations: Record<ComprehensiveProfileIntegrationKey, boolean>
  outputs: Record<ComprehensiveProfileOutputKey, boolean>
}

export type UserProfile = {
  userId: string
  riskBias: number // Default market weight (0.65)
  horizon?: string // "Ready", "1-2yr", etc.
  yieldVsSafety: number // 0.5 default
  preferredMarkets: string[]
  inferredSignals?: {
    comprehensiveProfile?: ComprehensiveProfile
    [key: string]: unknown
  } | null
  updatedAt?: string
}

export type BehavioralSignal = {
  type: "lens_selected" | "suggestion_ignored" | "signal_toggled"
  lens?: "chat" | "search" | "map"
  signal?: "yield" | "risk" | "liquidity" | "price"
  timestamp?: string
}

export type ProfileAdjustment = {
  field: keyof UserProfile
  from: number | string | undefined
  to: number | string | undefined
  reason: string
}

export type ProfileInferenceResult = {
  profile: UserProfile
  adjustments: ProfileAdjustment[]
}

import type {
  ComprehensiveProfile,
  ComprehensiveProfileBranding,
  ComprehensiveProfileMemoryEntry,
  ComprehensiveProfileReportAudience,
  ComprehensiveProfileReportTemplate,
} from "@/lib/profile/types"

export const DEFAULT_COMPREHENSIVE_PROFILE: ComprehensiveProfile = {
  assistantScope: "team",
  preferredClientTypes: [],
  clientMemoryNotes: "",
  memoryEntries: [],
  reportTemplates: [],
  branding: {
    companyName: "",
    accentColor: "#2563eb",
  },
  capabilities: {
    reportExtraction: true,
    apiFeeding: true,
    clientMemory: true,
    socialNetworkReport: false,
    clientSpecificReport: true,
    highLevelInsights: true,
  },
  integrations: {
    chatgpt: false,
    gemini: false,
    googleDrive: false,
    customGpts: false,
    notebookLM: false,
  },
  outputs: {
    json: true,
    pdf: true,
    brandedFiles: true,
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
}

const normalizeAudience = (value: unknown): ComprehensiveProfileReportAudience => {
  if (value === "social" || value === "investor" || value === "executive") {
    return value
  }
  return "client"
}

const normalizeMemoryEntries = (value: unknown): ComprehensiveProfileMemoryEntry[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (!isRecord(entry)) {
        return null
      }

      const clientName = typeof entry.clientName === "string" ? entry.clientName.trim() : ""
      const contextNotes = typeof entry.contextNotes === "string" ? entry.contextNotes : ""
      const tags = normalizeStringArray(entry.tags)

      if (!clientName) {
        return null
      }

      return {
        id: typeof entry.id === "string" && entry.id.trim() ? entry.id : crypto.randomUUID(),
        clientName,
        contextNotes,
        tags,
      }
    })
    .filter((entry): entry is ComprehensiveProfileMemoryEntry => Boolean(entry))
}

const normalizeReportTemplates = (value: unknown): ComprehensiveProfileReportTemplate[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (!isRecord(entry)) {
        return null
      }

      const name = typeof entry.name === "string" ? entry.name.trim() : ""
      const outline = typeof entry.outline === "string" ? entry.outline : ""

      if (!name) {
        return null
      }

      return {
        id: typeof entry.id === "string" && entry.id.trim() ? entry.id : crypto.randomUUID(),
        name,
        audience: normalizeAudience(entry.audience),
        outline,
      }
    })
    .filter((entry): entry is ComprehensiveProfileReportTemplate => Boolean(entry))
}

const normalizeBranding = (value: unknown): ComprehensiveProfileBranding => {
  if (!isRecord(value)) {
    return DEFAULT_COMPREHENSIVE_PROFILE.branding
  }

  return {
    companyName: typeof value.companyName === "string" ? value.companyName : "",
    accentColor:
      typeof value.accentColor === "string" && value.accentColor.trim()
        ? value.accentColor
        : DEFAULT_COMPREHENSIVE_PROFILE.branding.accentColor,
  }
}

const getNestedBoolean = (
  source: Record<string, unknown>,
  sectionKey: string,
  key: string,
  defaultValue: boolean,
): boolean => {
  const section = source[sectionKey]
  if (!isRecord(section)) {
    return defaultValue
  }
  const value = section[key]
  return typeof value === "boolean" ? value : defaultValue
}

export function getComprehensiveProfileFromSignals(inferredSignals: unknown): ComprehensiveProfile {
  if (!isRecord(inferredSignals) || !isRecord(inferredSignals.comprehensiveProfile)) {
    return DEFAULT_COMPREHENSIVE_PROFILE
  }

  const source = inferredSignals.comprehensiveProfile

  return {
    assistantScope: "team",
    preferredClientTypes: normalizeStringArray(source.preferredClientTypes),
    clientMemoryNotes: typeof source.clientMemoryNotes === "string" ? source.clientMemoryNotes : "",
    memoryEntries: normalizeMemoryEntries(source.memoryEntries),
    reportTemplates: normalizeReportTemplates(source.reportTemplates),
    branding: normalizeBranding(source.branding),
    capabilities: {
      reportExtraction: getNestedBoolean(
        source,
        "capabilities",
        "reportExtraction",
        DEFAULT_COMPREHENSIVE_PROFILE.capabilities.reportExtraction,
      ),
      apiFeeding: getNestedBoolean(
        source,
        "capabilities",
        "apiFeeding",
        DEFAULT_COMPREHENSIVE_PROFILE.capabilities.apiFeeding,
      ),
      clientMemory: getNestedBoolean(
        source,
        "capabilities",
        "clientMemory",
        DEFAULT_COMPREHENSIVE_PROFILE.capabilities.clientMemory,
      ),
      socialNetworkReport: getNestedBoolean(
        source,
        "capabilities",
        "socialNetworkReport",
        DEFAULT_COMPREHENSIVE_PROFILE.capabilities.socialNetworkReport,
      ),
      clientSpecificReport: getNestedBoolean(
        source,
        "capabilities",
        "clientSpecificReport",
        DEFAULT_COMPREHENSIVE_PROFILE.capabilities.clientSpecificReport,
      ),
      highLevelInsights: getNestedBoolean(
        source,
        "capabilities",
        "highLevelInsights",
        DEFAULT_COMPREHENSIVE_PROFILE.capabilities.highLevelInsights,
      ),
    },
    integrations: {
      chatgpt: getNestedBoolean(
        source,
        "integrations",
        "chatgpt",
        DEFAULT_COMPREHENSIVE_PROFILE.integrations.chatgpt,
      ),
      gemini: getNestedBoolean(
        source,
        "integrations",
        "gemini",
        DEFAULT_COMPREHENSIVE_PROFILE.integrations.gemini,
      ),
      googleDrive: getNestedBoolean(
        source,
        "integrations",
        "googleDrive",
        DEFAULT_COMPREHENSIVE_PROFILE.integrations.googleDrive,
      ),
      customGpts: getNestedBoolean(
        source,
        "integrations",
        "customGpts",
        DEFAULT_COMPREHENSIVE_PROFILE.integrations.customGpts,
      ),
      notebookLM: getNestedBoolean(
        source,
        "integrations",
        "notebookLM",
        DEFAULT_COMPREHENSIVE_PROFILE.integrations.notebookLM,
      ),
    },
    outputs: {
      json: getNestedBoolean(
        source,
        "outputs",
        "json",
        DEFAULT_COMPREHENSIVE_PROFILE.outputs.json,
      ),
      pdf: getNestedBoolean(
        source,
        "outputs",
        "pdf",
        DEFAULT_COMPREHENSIVE_PROFILE.outputs.pdf,
      ),
      brandedFiles: getNestedBoolean(
        source,
        "outputs",
        "brandedFiles",
        DEFAULT_COMPREHENSIVE_PROFILE.outputs.brandedFiles,
      ),
    },
  }
}

export function withComprehensiveProfile(
  inferredSignals: unknown,
  comprehensiveProfile: ComprehensiveProfile,
): Record<string, unknown> {
  const existing = isRecord(inferredSignals) ? inferredSignals : {}
  return {
    ...existing,
    comprehensiveProfile,
  }
}

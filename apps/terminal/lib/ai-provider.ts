import "server-only"
import { createGateway } from "@ai-sdk/gateway"
import { createOpenAI } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"

function getTrimmedEnv(name: string) {
  const value = process.env[name]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

export function ensureGeminiApiKeyEnv() {
  const geminiKey =
    getTrimmedEnv("GEMINI_KEY")
    ?? getTrimmedEnv("GEMINI_API_KEY")
    ?? getTrimmedEnv("GOOGLE_GENERATIVE_AI_API_KEY")
  if (geminiKey && !getTrimmedEnv("GOOGLE_GENERATIVE_AI_API_KEY")) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = geminiKey
  }
  if (geminiKey && !getTrimmedEnv("GEMINI_KEY")) {
    process.env.GEMINI_KEY = geminiKey
  }
  return geminiKey
}

export function normalizeGeminiModel(modelId: string | undefined, fallback: string) {
  const normalized = modelId?.trim()
  if (!normalized) return fallback
  const lower = normalized.toLowerCase()
  if (lower.startsWith("google/")) return lower.slice("google/".length)
  if (lower.startsWith("gemini-")) return lower
  return fallback
}

export function hasAnyAiProviderKey() {
  return Boolean(getTrimmedEnv("AI_GATEWAY_API_KEY") || getTrimmedEnv("OPENAI_API_KEY") || ensureGeminiApiKeyEnv())
}

export function resolveGatewayOrGeminiModel(options: { gatewayModel: string; geminiModel: string }) {
  const gatewayApiKey = getTrimmedEnv("AI_GATEWAY_API_KEY")
  if (gatewayApiKey) {
    const gateway = createGateway({ apiKey: gatewayApiKey })
    return {
      model: gateway(options.gatewayModel),
      provider: "gateway" as const,
    }
  }

  const geminiKey = ensureGeminiApiKeyEnv()
  if (geminiKey) {
    // Prefer Pro models for Copilot if available, otherwise Flash
    const preferredModel = normalizeGeminiModel(options.geminiModel, "gemini-2.5-flash")
    return {
      model: google(preferredModel),
      provider: "gemini" as const,
    }
  }

  return null
}

export function resolveCopilotModel() {
  const provider = (process.env.COPILOT_PROVIDER ?? "").trim().toLowerCase()
  const gatewayApiKey = getTrimmedEnv("AI_GATEWAY_API_KEY")
  const geminiKey = ensureGeminiApiKeyEnv()
  const openAiApiKey = getTrimmedEnv("OPENAI_API_KEY")

  if (provider === "gateway") {
    if (!gatewayApiKey) return null
    const gateway = createGateway({ apiKey: gatewayApiKey })
    return gateway(process.env.COPILOT_MODEL || "google/gemini-2.5-flash")
  }

  if (provider === "gemini") {
    if (!geminiKey) return null
    const model = process.env.COPILOT_GEMINI_MODEL ?? process.env.GEMINI_MODEL ?? process.env.COPILOT_MODEL
    return google(normalizeGeminiModel(model, "gemini-2.5-flash"))
  }

  if (provider === "openai") {
    if (!openAiApiKey) return null
    const openAi = createOpenAI({ apiKey: openAiApiKey })
    return openAi(process.env.COPILOT_OPENAI_MODEL || "gpt-4o-mini")
  }

  if (geminiKey) {
    const model = process.env.COPILOT_GEMINI_MODEL ?? process.env.GEMINI_MODEL ?? process.env.COPILOT_MODEL
    return google(normalizeGeminiModel(model, "gemini-2.5-flash"))
  }

  if (gatewayApiKey) {
    const gateway = createGateway({ apiKey: gatewayApiKey })
    return gateway(process.env.COPILOT_MODEL || "google/gemini-2.5-flash")
  }

  if (openAiApiKey) {
    const openAi = createOpenAI({ apiKey: openAiApiKey })
    return openAi(process.env.COPILOT_OPENAI_MODEL || "gpt-4o-mini")
  }

  return null
}

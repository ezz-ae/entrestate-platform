import { generateText } from "ai"

export type LlmProvider = "koboldai" | "ai-sdk"

export type DataScientistLlmInput = {
  prompt: string
  system?: string
  maxTokens?: number
  model?: string
}

const DEFAULT_MODEL = process.env.DATA_SCIENTIST_LLM_MODEL || "openai/gpt-4o-mini"
const DEFAULT_CHAT_PATH = "/api/chat"

const resolveKoboldUrl = () => {
  if (process.env.KOBOLDAI_CHAT_URL) return process.env.KOBOLDAI_CHAT_URL
  if (!process.env.KOBOLDAI_BASE_URL) return null
  try {
    return new URL(DEFAULT_CHAT_PATH, process.env.KOBOLDAI_BASE_URL).toString()
  } catch {
    return null
  }
}

const buildHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const apiKey = process.env.KOBOLDAI_API_KEY
  if (!apiKey) return headers

  const headerName = process.env.KOBOLDAI_AUTH_HEADER || "Authorization"
  const rawPrefix = process.env.KOBOLDAI_AUTH_PREFIX || "Bearer"
  const prefix = rawPrefix.length > 0 ? (rawPrefix.endsWith(" ") ? rawPrefix : `${rawPrefix} `) : ""
  headers[headerName] = `${prefix}${apiKey}`
  return headers
}

const extractText = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null
  const data = payload as Record<string, unknown>

  const direct =
    data.text ||
    data.response ||
    data.content ||
    (data.message as { content?: string } | undefined)?.content ||
    (data.choices as Array<{ message?: { content?: string }; text?: string }> | undefined)?.[0]?.message?.content ||
    (data.choices as Array<{ text?: string }> | undefined)?.[0]?.text ||
    (data.results as Array<{ text?: string }> | undefined)?.[0]?.text

  return typeof direct === "string" ? direct : null
}

async function generateWithKobold(input: DataScientistLlmInput): Promise<string> {
  const url = resolveKoboldUrl()
  if (!url) throw new Error("koboldai_not_configured")

  const system = input.system?.trim()
  const messages = system
    ? [
        { role: "system", content: system },
        { role: "user", content: input.prompt },
      ]
    : [{ role: "user", content: input.prompt }]

  const body = {
    messages,
    prompt: input.prompt,
    model: input.model || process.env.KOBOLDAI_MODEL,
    max_tokens: input.maxTokens,
  }

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`koboldai_http_${response.status}`)
  }

  const data = await response.json()
  const text = extractText(data)
  if (!text) throw new Error("koboldai_empty_response")
  return text
}

export async function generateDataScientistText(
  input: DataScientistLlmInput,
): Promise<{ text: string; provider: LlmProvider }> {
  const koboldUrl = resolveKoboldUrl()
  if (koboldUrl) {
    try {
      const text = await generateWithKobold(input)
      return { text, provider: "koboldai" }
    } catch (error) {
      console.warn("KoboldAI fallback:", error)
    }
  }

  const { text } = await generateText({
    model: input.model ?? DEFAULT_MODEL,
    prompt: input.prompt,
    system: input.system,
    maxTokens: input.maxTokens,
  })

  return { text, provider: "ai-sdk" }
}

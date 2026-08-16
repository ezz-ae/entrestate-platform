import crypto from "node:crypto"

export const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
  return `{${entries.join(",")}}`
}

export function hashObject(value: unknown): string {
  const payload = stableStringify(value)
  return crypto.createHash("sha256").update(payload).digest("hex")
}

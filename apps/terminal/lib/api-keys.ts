import "server-only"

import crypto from "node:crypto"

export function hashApiKey(rawKey: string) {
  return crypto.createHash("sha256").update(rawKey).digest("hex")
}

export function buildApiKeyPrefix(rawKey: string) {
  return `${rawKey.slice(0, 12)}...`
}

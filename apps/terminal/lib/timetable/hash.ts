import { createHash } from "crypto"

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function computeStableHash(payload: any): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex")
}

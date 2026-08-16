import crypto from "node:crypto"
import type { GovernanceRole } from "./rbac"

export type SessionPayload = {
  sub: string
  role: GovernanceRole
  exp: number
  teamId?: string
}

const encode = (payload: SessionPayload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url")

const decode = (input: string): SessionPayload | null => {
  try {
    const parsed = JSON.parse(Buffer.from(input, "base64url").toString("utf8")) as SessionPayload
    if (!parsed.sub || !parsed.role || !parsed.exp) return null
    return parsed
  } catch {
    return null
  }
}

const sign = (payload: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(payload).digest("base64url")

export function signSession(payload: SessionPayload, secret = process.env.ENTRESTATE_SESSION_SECRET || "dev-secret") {
  const encoded = encode(payload)
  const signature = sign(encoded, secret)
  return `${encoded}.${signature}`
}

export function verifySession(token: string, secret = process.env.ENTRESTATE_SESSION_SECRET || "dev-secret") {
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null
  const expected = sign(encoded, secret)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (signatureBuffer.length !== expectedBuffer.length) return null
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null

  const payload = decode(encoded)
  if (!payload) return null
  if (Date.now() / 1000 > payload.exp) return null
  return payload
}

import "server-only"
import { createNeonAuth } from "@neondatabase/auth/next/server"
import { getSharedAuthCookieDomain } from "@/lib/auth/cookie-domain"

const baseUrl = process.env.NEON_AUTH_BASE_URL
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
const cookieDomain = getSharedAuthCookieDomain()
const adminEmails = (process.env.NEON_AUTH_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
const adminModeRequested = process.env.NEXT_PUBLIC_ADMIN_MODE === "true"
const adminModeEnabled = adminModeRequested && process.env.NODE_ENV !== "production"
let adminModeWarned = false

export const authEnabled = Boolean(baseUrl && cookieSecret)
const invalidSecret = authEnabled && cookieSecret && cookieSecret.length < 32

if (invalidSecret) {
  console.warn("Neon Auth disabled: NEON_AUTH_COOKIE_SECRET must be at least 32 characters.")
}

if (adminModeRequested && !adminModeEnabled) {
  console.warn("Admin mode ignored in production. Disable NEXT_PUBLIC_ADMIN_MODE for production.")
}

export const auth = authEnabled && !invalidSecret
  ? createNeonAuth({
      baseUrl: baseUrl!,
      cookies: {
        secret: cookieSecret!,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    })
  : null

export function getAuth() {
  return auth
}

async function getSessionData() {
  if (!auth) return null
  try {
    const { data } = await auth.getSession()
    return data ?? null
  } catch (error) {
    // Silently handle "Cookies can only be modified in a Server Action or Route Handler"
    // which happens when auth library tries to refresh session during page render
    if (String(error).includes("Cookies can only be modified")) {
      return null
    }
    throw error
  }
}

export async function getSessionUser() {
  const session = await getSessionData()
  return session?.user ?? null
}

export async function getSessionUserId(): Promise<string> {
  const user = await getSessionUser()
  return user?.id ?? "system"
}

export async function requireSessionUserId(): Promise<string | null> {
  const user = await getSessionUser()
  return user?.id ?? null
}

export async function isAdminUser(): Promise<boolean> {
  if (adminModeEnabled) {
    if (!adminModeWarned) {
      console.warn("Admin mode bypass is enabled for this environment.")
      adminModeWarned = true
    }
    return true
  }

  const user = await getSessionUser()
  if (!user) return false

  if (user.role === "admin") return true

  if (adminEmails.length && user.email) {
    return adminEmails.includes(user.email.toLowerCase())
  }

  return false
}

import "server-only"
import { createHash } from "node:crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const DEFAULT_FREE_WINDOW_LIMIT = 20
const DEFAULT_FREE_COOLDOWN_HOURS = 2

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const FREE_COPILOT_WINDOW_LIMIT = parsePositiveInteger(
  process.env.FREE_COPILOT_WINDOW_LIMIT,
  DEFAULT_FREE_WINDOW_LIMIT,
)
export const FREE_COPILOT_COOLDOWN_HOURS = parsePositiveInteger(
  process.env.FREE_COPILOT_COOLDOWN_HOURS,
  DEFAULT_FREE_COOLDOWN_HOURS,
)

// Backward compatibility for existing imports.
export const FREE_COPILOT_DAILY_LIMIT = FREE_COPILOT_WINDOW_LIMIT

export type CopilotDailyUsage = {
  accountKey: string
  date: string
  used: number
  limit: number | null
  remaining: number | null
  blocked: boolean
  resetAt: string | null
  cooldownUntil: string | null
  cooldownSecondsRemaining: number | null
}

type FreeUsageWindowRow = {
  window_started_at: Date | string
  messages_count: number
  cooldown_until: Date | string | null
}

type CopilotTier = "free" | "pro" | "team" | "institutional"

let ensureUsageTablesPromise: Promise<void> | null = null

function isRetryableUsageError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
  return error.code === "P2028" || error.code === "P2034"
}

function applyLimit(used: number, limit: number | null): CopilotDailyUsage["remaining"] {
  if (limit === null) return null
  return Math.max(limit - used, 0)
}

function getWindowDurationMs() {
  return FREE_COPILOT_COOLDOWN_HOURS * 60 * 60 * 1000
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildUnlimitedUsage(accountKey: string): CopilotDailyUsage {
  return {
    accountKey,
    date: new Date().toISOString().slice(0, 10),
    used: 0,
    limit: null,
    remaining: null,
    blocked: false,
    resetAt: null,
    cooldownUntil: null,
    cooldownSecondsRemaining: null,
  }
}

function buildFreeUsage(
  accountKey: string,
  now: Date,
  values: {
    used: number
    blocked: boolean
    resetAt: Date | null
    cooldownUntil: Date | null
  },
): CopilotDailyUsage {
  const limit = FREE_COPILOT_WINDOW_LIMIT
  const clampedUsed = Math.max(0, Math.min(values.used, limit))
  const cooldownSecondsRemaining =
    values.blocked && values.cooldownUntil
      ? Math.max(Math.ceil((values.cooldownUntil.getTime() - now.getTime()) / 1000), 0)
      : null

  return {
    accountKey,
    date: now.toISOString().slice(0, 10),
    used: clampedUsed,
    limit,
    remaining: values.blocked ? 0 : applyLimit(clampedUsed, limit),
    blocked: values.blocked,
    resetAt: values.resetAt ? values.resetAt.toISOString() : null,
    cooldownUntil: values.cooldownUntil ? values.cooldownUntil.toISOString() : null,
    cooldownSecondsRemaining,
  }
}

function resolveFreeUsageFromRow(accountKey: string, row: FreeUsageWindowRow | null, now: Date): CopilotDailyUsage {
  if (!row) {
    return buildFreeUsage(accountKey, now, {
      used: 0,
      blocked: false,
      resetAt: null,
      cooldownUntil: null,
    })
  }

  const windowDurationMs = getWindowDurationMs()
  const windowStartedAt = toDate(row.window_started_at) ?? now
  const cooldownUntil = toDate(row.cooldown_until)
  const windowEndsAt = new Date(windowStartedAt.getTime() + windowDurationMs)
  const messagesUsed = Number.isFinite(row.messages_count) ? row.messages_count : 0

  if (cooldownUntil && cooldownUntil.getTime() > now.getTime()) {
    return buildFreeUsage(accountKey, now, {
      used: FREE_COPILOT_WINDOW_LIMIT,
      blocked: true,
      resetAt: cooldownUntil,
      cooldownUntil,
    })
  }

  if (cooldownUntil || windowEndsAt.getTime() <= now.getTime()) {
    return buildFreeUsage(accountKey, now, {
      used: 0,
      blocked: false,
      resetAt: null,
      cooldownUntil: null,
    })
  }

  return buildFreeUsage(accountKey, now, {
    used: messagesUsed,
    blocked: false,
    resetAt: windowEndsAt,
    cooldownUntil: null,
  })
}

export function getCopilotDailyLimit(tier: CopilotTier) {
  void tier
  return null
}

export function getCopilotCooldownHours(tier: CopilotTier) {
  void tier
  return null
}

export function getAnonymousCopilotAccountKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  const ip = forwardedFor || realIp || "unknown"

  if (ip !== "unknown") {
    return `anon:ip:${ip}`
  }

  const userAgent = request.headers.get("user-agent")?.trim() || "unknown"
  const language = request.headers.get("accept-language")?.split(",")[0]?.trim() || "unknown"
  const host = request.headers.get("host")?.trim() || "unknown"
  const fingerprint = createHash("sha256")
    .update(`${userAgent}|${language}|${host}`)
    .digest("hex")
    .slice(0, 24)

  return `anon:fingerprint:${fingerprint}`
}

async function ensureUsageTables() {
  if (!ensureUsageTablesPromise) {
    ensureUsageTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS copilot_usage_windows (
          account_key TEXT PRIMARY KEY,
          window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          messages_count INTEGER NOT NULL DEFAULT 0,
          cooldown_until TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CHECK (messages_count >= 0)
        )
      `)
    })()
  }

  await ensureUsageTablesPromise
}

export async function getCopilotDailyUsage(accountKey: string, tier: CopilotTier) {
  const normalizedKey = accountKey.trim()
  if (tier !== "free") {
    return buildUnlimitedUsage(normalizedKey)
  }

  const now = new Date()
  try {
    await ensureUsageTables()
    const rows = await prisma.$queryRaw<FreeUsageWindowRow[]>(Prisma.sql`
      SELECT window_started_at, messages_count, cooldown_until
      FROM copilot_usage_windows
      WHERE account_key = ${normalizedKey}
      LIMIT 1
    `)

    return resolveFreeUsageFromRow(normalizedKey, rows[0] ?? null, now)
  } catch (error) {
    console.error("Copilot usage lookup failed; returning free usage fallback.", { error, accountKey: normalizedKey })
    return buildFreeUsage(normalizedKey, now, {
      used: 0,
      blocked: false,
      resetAt: null,
      cooldownUntil: null,
    })
  }
}

export async function consumeCopilotUsage(accountKey: string, tier: CopilotTier): Promise<{ allowed: boolean; usage: CopilotDailyUsage }> {
  const normalizedKey = accountKey.trim()
  if (tier !== "free") {
    return {
      allowed: true,
      usage: buildUnlimitedUsage(normalizedKey),
    }
  }

  await ensureUsageTables()
  const now = new Date()
  const windowDurationMs = getWindowDurationMs()

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<FreeUsageWindowRow[]>(Prisma.sql`
      SELECT window_started_at, messages_count, cooldown_until
      FROM copilot_usage_windows
      WHERE account_key = ${normalizedKey}
      LIMIT 1
    `)
    const row = rows[0] ?? null
    const currentUsage = resolveFreeUsageFromRow(normalizedKey, row, now)

    if (currentUsage.blocked) {
      return { allowed: false, usage: currentUsage }
    }

    let windowStartedAt = toDate(row?.window_started_at) ?? now
    let messagesCount = row?.messages_count ?? 0
    const cooldownUntil = toDate(row?.cooldown_until)
    const windowEndsAt = new Date(windowStartedAt.getTime() + windowDurationMs)
    const shouldReset = !row || Boolean(cooldownUntil) || windowEndsAt.getTime() <= now.getTime()

    if (shouldReset) {
      windowStartedAt = now
      messagesCount = 0
    }

    const nextCount = messagesCount + 1
    const hitLimit = nextCount >= FREE_COPILOT_WINDOW_LIMIT
    const nextCooldownUntil = hitLimit ? new Date(now.getTime() + windowDurationMs) : null

    await tx.$executeRawUnsafe(
      `
        INSERT INTO copilot_usage_windows (account_key, window_started_at, messages_count, cooldown_until, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (account_key)
        DO UPDATE SET
          window_started_at = EXCLUDED.window_started_at,
          messages_count = EXCLUDED.messages_count,
          cooldown_until = EXCLUDED.cooldown_until,
          updated_at = NOW()
      `,
      normalizedKey,
      windowStartedAt,
      nextCount,
      nextCooldownUntil,
    )

    return {
      allowed: true,
      usage: buildFreeUsage(normalizedKey, now, {
        used: nextCount,
        blocked: hitLimit,
        resetAt: nextCooldownUntil,
        cooldownUntil: nextCooldownUntil,
      }),
    }
  })
}

export async function safeConsumeCopilotUsage(
  accountKey: string,
  tier: CopilotTier,
): Promise<{ allowed: boolean; usage: CopilotDailyUsage }> {
  try {
    return await consumeCopilotUsage(accountKey, tier)
  } catch (error) {
    const retryable = isRetryableUsageError(error)
    console.error("Copilot usage tracking failed; using non-blocking fallback.", {
      accountKey,
      tier,
      retryable,
      error,
    })

    try {
      const usage = await getCopilotDailyUsage(accountKey, tier)
      return {
        allowed: true,
        usage,
      }
    } catch (fallbackError) {
      console.error("Copilot usage fallback read failed; allowing request with default usage.", {
        accountKey,
        tier,
        fallbackError,
      })

      return {
        allowed: true,
        usage:
          tier === "free"
            ? buildFreeUsage(accountKey, new Date(), {
                used: 0,
                blocked: false,
                resetAt: null,
                cooldownUntil: null,
              })
            : buildUnlimitedUsage(accountKey),
      }
    }
  }
}

export async function incrementCopilotDailyUsage(accountKey: string, tier: CopilotTier) {
  const { usage } = await consumeCopilotUsage(accountKey, tier)
  return {
    ...usage,
  } satisfies CopilotDailyUsage
}

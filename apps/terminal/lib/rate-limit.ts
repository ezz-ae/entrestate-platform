import { Redis } from "@upstash/redis"

type RateLimitConfig = {
  limit: number
  windowMs: number
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

const STORE_KEY = "__entrestate_rate_limit_store__"

const store: Map<string, RateLimitEntry> =
  (globalThis as typeof globalThis & { [STORE_KEY]?: Map<string, RateLimitEntry> })[STORE_KEY] ??
  new Map<string, RateLimitEntry>()

if (!(globalThis as typeof globalThis & { [STORE_KEY]?: Map<string, RateLimitEntry> })[STORE_KEY]) {
  ;(globalThis as typeof globalThis & { [STORE_KEY]?: Map<string, RateLimitEntry> })[STORE_KEY] = store
}

const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
const redis = hasRedis ? Redis.fromEnv() : null

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const [first] = forwarded.split(",").map((part) => part.trim())
    if (first) return first
  }
  return request.headers.get("x-real-ip") ?? "unknown"
}

export function buildRateLimitKey(request: Request, scope: string): string {
  return `${scope}:${getRequestIp(request)}`
}

function rateLimitInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + config.windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: Math.max(0, config.limit - 1), resetAt }
  }

  const nextCount = existing.count + 1
  existing.count = nextCount
  store.set(key, existing)

  const allowed = nextCount <= config.limit
  return {
    allowed,
    remaining: Math.max(0, config.limit - nextCount),
    resetAt: existing.resetAt,
  }
}

export async function rateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  if (!redis) {
    return rateLimitInMemory(key, config)
  }

  try {
    const now = Date.now()
    const windowBucket = Math.floor(now / config.windowMs)
    const windowKey = `${key}:${windowBucket}`
    const count = await redis.incr(windowKey)
    if (count === 1) {
      await redis.expire(windowKey, Math.ceil(config.windowMs / 1000))
    }
    const resetAt = (windowBucket + 1) * config.windowMs
    return {
      allowed: count <= config.limit,
      remaining: Math.max(0, config.limit - count),
      resetAt,
    }
  } catch {
    return rateLimitInMemory(key, config)
  }
}

import { prisma } from "@/lib/prisma"
import { UserProfile, BehavioralSignal } from "./types"

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // @ts-ignore
  const profile = await prisma.userProfile.findUnique({
    where: { userId }
  })
  return profile as UserProfile | null
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { userId: string }): Promise<UserProfile> {
  // @ts-ignore
  const updated = await prisma.userProfile.upsert({
    where: { userId: profile.userId },
    update: profile,
    create: {
      userId: profile.userId,
      riskBias: profile.riskBias ?? 0.65,
      horizon: profile.horizon,
      yieldVsSafety: profile.yieldVsSafety ?? 0.5,
      preferredMarkets: profile.preferredMarkets ?? []
    }
  })
  return updated as UserProfile
}

export async function recordBehavioralSignal(userId: string, signal: BehavioralSignal) {
  try {
    const profile = await getUserProfile(userId)
    if (!profile) return

    const signals = (profile.inferredSignals as Record<string, unknown>) ?? {}
    const behaviorLog = Array.isArray(signals.behaviorLog) ? signals.behaviorLog : []

    // Keep last 100 signals
    behaviorLog.push({
      ...signal,
      timestamp: signal.timestamp ?? new Date().toISOString(),
    })
    if (behaviorLog.length > 100) behaviorLog.splice(0, behaviorLog.length - 100)

    // Aggregate counts
    const signalCounts = (signals.signalCounts as Record<string, number>) ?? {}
    const key = `${signal.type}:${signal.lens ?? signal.signal ?? "unknown"}`
    signalCounts[key] = (signalCounts[key] ?? 0) + 1

    await upsertUserProfile({
      userId,
      inferredSignals: {
        ...signals,
        behaviorLog,
        signalCounts,
        lastSignalAt: new Date().toISOString(),
      },
    })
  } catch {
    // Non-blocking — don't fail the request
  }
}

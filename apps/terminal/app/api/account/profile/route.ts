import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSyncedUser } from "@/lib/auth/sync"
import { getRequestId } from "@/lib/api-errors"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import {
  DEFAULT_COMPREHENSIVE_PROFILE,
  getComprehensiveProfileFromSignals,
  withComprehensiveProfile,
} from "@/lib/profile/comprehensive"

const profileUpdateSchema = z.object({
  riskBias: z.number().min(0).max(1).optional(),
  yieldVsSafety: z.number().min(0).max(1).optional(),
  horizon: z.string().optional(),
  preferredMarkets: z.array(z.string()).optional(),
  comprehensiveProfile: z
    .object({
      assistantScope: z.literal("team").optional(),
      preferredClientTypes: z.array(z.string()).optional(),
      clientMemoryNotes: z.string().optional(),
      memoryEntries: z
        .array(
          z.object({
            id: z.string().optional(),
            clientName: z.string().trim().min(1),
            contextNotes: z.string().optional(),
            tags: z.array(z.string()).optional(),
          }),
        )
        .optional(),
      reportTemplates: z
        .array(
          z.object({
            id: z.string().optional(),
            name: z.string().trim().min(1),
            audience: z.enum(["client", "social", "investor", "executive"]).optional(),
            outline: z.string().optional(),
          }),
        )
        .optional(),
      branding: z
        .object({
          companyName: z.string().optional(),
          accentColor: z.string().optional(),
        })
        .optional(),
      capabilities: z
        .object({
          reportExtraction: z.boolean().optional(),
          apiFeeding: z.boolean().optional(),
          clientMemory: z.boolean().optional(),
          socialNetworkReport: z.boolean().optional(),
          clientSpecificReport: z.boolean().optional(),
          highLevelInsights: z.boolean().optional(),
        })
        .optional(),
      integrations: z
        .object({
          chatgpt: z.boolean().optional(),
          gemini: z.boolean().optional(),
          googleDrive: z.boolean().optional(),
          customGpts: z.boolean().optional(),
          notebookLM: z.boolean().optional(),
        })
        .optional(),
      outputs: z
        .object({
          json: z.boolean().optional(),
          pdf: z.boolean().optional(),
          brandedFiles: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
})

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found", requestId }, { status: 404 })
    }

    const comprehensiveProfile = getComprehensiveProfileFromSignals(profile.inferredSignals)

    return NextResponse.json({ profile: { ...profile, comprehensiveProfile }, requestId })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch profile", requestId }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
  }

  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier !== "institutional") {
    return NextResponse.json({ error: "Institutional tier required", requestId }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = profileUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile payload", requestId }, { status: 400 })
    }

    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { inferredSignals: true },
    })

    const existingComprehensive = getComprehensiveProfileFromSignals(existingProfile?.inferredSignals)

    const mergedComprehensive = parsed.data.comprehensiveProfile
      ? {
          assistantScope: "team" as const,
          preferredClientTypes:
            parsed.data.comprehensiveProfile.preferredClientTypes ?? existingComprehensive.preferredClientTypes,
          clientMemoryNotes:
            parsed.data.comprehensiveProfile.clientMemoryNotes ?? existingComprehensive.clientMemoryNotes,
          memoryEntries:
            parsed.data.comprehensiveProfile.memoryEntries ?? existingComprehensive.memoryEntries,
          reportTemplates:
            parsed.data.comprehensiveProfile.reportTemplates ?? existingComprehensive.reportTemplates,
          branding: {
            ...existingComprehensive.branding,
            ...parsed.data.comprehensiveProfile.branding,
          },
          capabilities: {
            ...existingComprehensive.capabilities,
            ...parsed.data.comprehensiveProfile.capabilities,
          },
          integrations: {
            ...existingComprehensive.integrations,
            ...parsed.data.comprehensiveProfile.integrations,
          },
          outputs: {
            ...existingComprehensive.outputs,
            ...parsed.data.comprehensiveProfile.outputs,
          },
        }
      : existingComprehensive

    const inferredSignals = withComprehensiveProfile(
      existingProfile?.inferredSignals,
      mergedComprehensive || DEFAULT_COMPREHENSIVE_PROFILE,
    )

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        riskBias: parsed.data.riskBias,
        yieldVsSafety: parsed.data.yieldVsSafety,
        horizon: parsed.data.horizon,
        preferredMarkets: parsed.data.preferredMarkets,
        inferredSignals,
      },
      create: {
        userId: user.id,
        riskBias: parsed.data.riskBias ?? 0.65,
        yieldVsSafety: parsed.data.yieldVsSafety ?? 0.5,
        horizon: parsed.data.horizon,
        preferredMarkets: parsed.data.preferredMarkets ?? [],
        inferredSignals,
      },
    })

    return NextResponse.json({ profile: updatedProfile, requestId })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile", requestId }, { status: 500 })
  }
}

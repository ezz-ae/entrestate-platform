import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getSyncedUser } from "@/lib/auth/sync"

export async function ensureUserWorkspaceTeam() {
  const user = await getSyncedUser()
  if (!user) {
    throw new Error("Sign in required")
  }

  if (user.profile?.teamId) {
    return { user, teamId: user.profile.teamId }
  }

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  })

  if (membership?.teamId) {
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { teamId: membership.teamId },
      create: {
        userId: user.id,
        teamId: membership.teamId,
        riskBias: 0.65,
        yieldVsSafety: 0.5,
        horizon: "Ready",
      },
    })
    return { user, teamId: membership.teamId }
  }

  const baseName = user.name?.trim() || user.email?.split("@")[0]?.trim() || "Entrestate"
  const team = await prisma.team.create({
    data: {
      name: `${baseName} Workspace`,
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
  })

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: { teamId: team.id },
    create: {
      userId: user.id,
      teamId: team.id,
      riskBias: 0.65,
      yieldVsSafety: 0.5,
      horizon: "Ready",
    },
  })

  return { user, teamId: team.id }
}

export async function listUserConnectorCredentials() {
  const { teamId } = await ensureUserWorkspaceTeam()
  return prisma.connectorCredential.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getUserConnectorCredential(connectorId: string) {
  const { teamId } = await ensureUserWorkspaceTeam()
  return prisma.connectorCredential.findFirst({
    where: { teamId, connectorId },
    orderBy: { createdAt: "desc" },
  })
}

export async function upsertUserConnectorCredential(connectorId: string, config: Record<string, unknown>) {
  const { teamId } = await ensureUserWorkspaceTeam()
  const jsonConfig = config as Prisma.InputJsonValue
  const existing = await prisma.connectorCredential.findFirst({
    where: { teamId, connectorId },
    orderBy: { createdAt: "desc" },
  })

  if (existing) {
    return prisma.connectorCredential.update({
      where: { id: existing.id },
      data: {
        status: "active",
        config: jsonConfig,
      },
    })
  }

  return prisma.connectorCredential.create({
    data: {
      teamId,
      connectorId,
      status: "active",
      config: jsonConfig,
    },
  })
}

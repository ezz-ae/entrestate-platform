import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSyncedUser } from "@/lib/auth/sync"
import { getRequestId } from "@/lib/api-errors"
import crypto from "node:crypto"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { buildApiKeyPrefix, hashApiKey } from "@/lib/api-keys"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    }
  })

  return NextResponse.json({ keys, requestId })
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })

  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier !== "institutional") {
    return NextResponse.json({ error: "Institutional tier required", requestId }, { status: 403 })
  }

  try {
    const { name, scopes } = await request.json()
    if (!name) return NextResponse.json({ error: "Name is required", requestId }, { status: 400 })

    const rawKey = `ent_live_${crypto.randomBytes(32).toString("hex")}`
    const prefix = buildApiKeyPrefix(rawKey)
    const hashedKey = hashApiKey(rawKey)

    const newKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name,
        key: hashedKey,
        prefix,
        scopes: Array.isArray(scopes) ? scopes : ["read:market", "read:listings"],
      }
    })

    return NextResponse.json({
      key: {
        id: newKey.id,
        name: newKey.name,
        prefix: newKey.prefix,
        scopes: newKey.scopes,
        createdAt: newKey.createdAt,
        expiresAt: newKey.expiresAt,
        rawKey,
      },
      requestId,
    })
  } catch (error) {
    console.error("Failed to create API key:", error)
    return NextResponse.json({ error: "Failed to create API key", requestId }, { status: 500 })
  }
}

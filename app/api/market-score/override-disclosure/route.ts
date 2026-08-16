import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/auth"

const querySchema = z.object({
  asset_id: z.string().min(1),
  override_type: z.string().min(1),
  profile: z.string().min(1),
})

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    if (!(await isAdminUser())) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.parse({
      asset_id: searchParams.get("asset_id"),
      override_type: searchParams.get("override_type"),
      profile: searchParams.get("profile"),
    })

    const rows = await prisma.$queryRaw<{ disclosure: unknown }[]>`
      SELECT generate_override_disclosure(${parsed.asset_id}, ${parsed.override_type}, ${parsed.profile}) AS disclosure
    `
    return NextResponse.json({ disclosure: rows[0]?.disclosure })
  } catch (error) {
    console.error("Market score disclosure error:", error)
    return NextResponse.json({ error: "Failed to load disclosure." }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/auth"
import { disclosureSchema } from "@/lib/agent-runtime/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    if (!(await isAdminUser())) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 })
    }

    const body = await request.json()
    const parsed = disclosureSchema.parse(body)

    const rows = await prisma.$queryRaw<{ disclosure: unknown }[]>`
      SELECT generate_override_disclosure(${parsed.asset_id}, ${parsed.override_type}, ${parsed.profile}) AS disclosure
    `

    return NextResponse.json({ disclosure: rows[0]?.disclosure ?? null })
  } catch (error) {
    console.error("Agent runtime disclosure error:", error)
    return NextResponse.json({ error: "Failed to load disclosure." }, { status: 500 })
  }
}

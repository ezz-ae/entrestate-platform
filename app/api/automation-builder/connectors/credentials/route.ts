import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getRequestContext } from "@/automation-builder/lib/request-context"
import { saveCredential, listCredentials } from "@/automation-builder/lib/store"
import { ConnectorCredentialSchema } from "@/automation-builder/lib/agent-types"

export async function GET(request: Request) {
  const { teamId } = getRequestContext(request)
  return NextResponse.json({ credentials: listCredentials(teamId) })
}

export async function POST(request: Request) {
  const { teamId } = getRequestContext(request)
  const body = await request.json()
  const parsed = ConnectorCredentialSchema.omit({ id: true, teamId: true, createdAt: true }).safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credential payload" }, { status: 400 })
  }

  const credential = saveCredential(teamId, {
    ...parsed.data,
    id: `cred_${nanoid(8)}`,
    teamId,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ credential }, { status: 201 })
}

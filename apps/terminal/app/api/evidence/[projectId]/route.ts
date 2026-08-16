import { NextResponse } from "next/server"
import { getEvidenceByKey } from "@/lib/evidence/data"

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } },
) {
  const { projectId } = params
  const evidence = getEvidenceByKey(projectId)

  if (!evidence) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 })
  }

  return NextResponse.json(evidence)
}

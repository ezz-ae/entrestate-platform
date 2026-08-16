import { NextResponse } from "next/server"
import { getTemplate } from "@/automation-builder/lib/store"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const template = getTemplate(params.id)
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }
  return NextResponse.json({ template })
}

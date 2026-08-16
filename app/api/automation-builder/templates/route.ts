import { NextResponse } from "next/server"
import { listTemplates } from "@/automation-builder/lib/store"

export async function GET() {
  return NextResponse.json({ templates: listTemplates() })
}

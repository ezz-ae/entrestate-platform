import { NextResponse } from "next/server"
import { hasAnyAiProviderKey } from "@/lib/ai-provider"

export async function GET() {
  return NextResponse.json({
    configured: hasAnyAiProviderKey(),
  })
}

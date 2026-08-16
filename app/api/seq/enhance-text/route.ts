import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { resolveGatewayOrGeminiModel } from "@/lib/ai-provider"

export const dynamic = "force-dynamic"

interface EnhanceResponse {
  enhancedPrompt: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    const resolved = resolveGatewayOrGeminiModel({
      gatewayModel: process.env.MEDIA_TEXT_MODEL || "google/gemini-2.5-flash",
      geminiModel: process.env.MEDIA_TEXT_MODEL || "gemini-2.5-flash",
    })

    if (!resolved) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Configuration error",
          details: "No AI provider key configured. Add GEMINI_KEY or AI_GATEWAY_API_KEY.",
        },
        { status: 500 },
      )
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json<ErrorResponse>({ error: "Prompt is required" }, { status: 400 })
    }

    const model = resolved.model

    const systemPrompt = `
      You are an expert prompt writer specializing in image and video generation.
      
      Task: Enhance the user's prompt to make it more detailed and effective for storyboard generation.
      
      Guidelines:
      1. Add specific visual details (lighting, camera angles, composition)
      2. Include style references (cinematic, anime, photorealistic, etc.)
      3. Clarify the number of panels and their sequence if not specified
      4. Add emotional and atmospheric descriptors
      5. Keep the enhanced prompt concise but comprehensive (under 200 words)
      6. Maintain the user's original intent and story
      
      Return ONLY the enhanced prompt text, no explanations or metadata.
    `

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: `Enhance this storyboard prompt:\n\n${prompt}`,
    })

    return NextResponse.json<EnhanceResponse>({
      enhancedPrompt: result.text.trim(),
    })
  } catch (error) {
    console.error("Enhance text error:", error)
    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to enhance prompt",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

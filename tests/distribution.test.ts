import { describe, expect, it } from "vitest"
import { generateEmbedSnippet } from "@/lib/distribution"

describe("Distribution", () => {
  it("enforces Powered by Entrestate branding on free tier", () => {
    const snippet = generateEmbedSnippet({
      widgetId: "widget-123",
      tableHash: "hash-123",
      tier: "free",
    })

    expect(snippet).toContain("Powered by Entrestate")
  })
})

import { describe, expect, it } from "vitest"
import { generateHtmlWidget, generatePdfReport } from "@/lib/artifacts"
import { tableSpecTemplates } from "@/lib/tablespec"

describe("Artifact generator", () => {
  it("builds a sealed PDF report with evidence", () => {
    const spec = tableSpecTemplates.underwrite_development_site
    const report = generatePdfReport(spec, "hash-123")

    expect(report.contentType).toBe("application/pdf")
    expect(report.immutable).toBe(true)
    expect(report.evidence.tableHash).toBe("hash-123")
    expect(report.content.length).toBeGreaterThan(20)
  })

  it("enforces Powered by Entrestate for widgets on free tier", () => {
    const spec = tableSpecTemplates.compare_area_yields
    const widget = generateHtmlWidget(spec, "hash-456", { branding: { tier: "free" } })
    const html = Buffer.from(widget.content, "base64").toString("utf8")
    expect(html).toContain("Powered by Entrestate")
  })
})

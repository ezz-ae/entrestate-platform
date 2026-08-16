import { describe, expect, it } from "vitest"
import { automationTemplates } from "@/automation-builder/lib/templates"
import { buildDraftFromTemplate } from "@/automation-builder/lib/draft"
import { AutomationDefinitionSchema } from "@/automation-builder/lib/automation-types"
import { executeAutomationRun } from "@/automation-builder/lib/execution/engine"

const hasNeonConnection = Boolean(
  process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_DATABASE_URL_UNPOOLED,
)
const itWithNeon = hasNeonConnection ? it : it.skip

describe("Automation builder scaffolding", () => {
  it("validates automation definitions against schema", () => {
    const template = automationTemplates[0]
    const draft = buildDraftFromTemplate(template)
    const definition = {
      ...draft,
      id: "automation_test",
      teamId: "team_test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }

    const parsed = AutomationDefinitionSchema.safeParse(definition)
    expect(parsed.success).toBe(true)
  })

  it("instantiates templates with input fields", () => {
    const draft = buildDraftFromTemplate(automationTemplates[1])
    expect(draft.inputs.fields.length).toBeGreaterThan(0)
    expect(draft.outputs.channels.length).toBeGreaterThan(0)
  })

  itWithNeon("runs execution with required inputs", async () => {
    const draft = buildDraftFromTemplate(automationTemplates[0])
    const definition = {
      ...draft,
      id: "automation_test_run",
      teamId: "team_test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      connectors: {
        listings: false,
        projects: false,
        marketIntel: false,
        crm: false,
      },
    }

    const run = await executeAutomationRun(definition, {
      inputs: {
        full_name: "Sara",
        phone: "+971555000111",
        budget_range: "2000000",
        preferred_area: "Dubai Hills",
        timeline: "0-3 months",
      },
    })

    expect(run.outputs.whatsapp).toBeTruthy()
    expect(run.summary).toContain("Budget")
  })
})

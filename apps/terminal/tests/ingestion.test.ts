import { describe, expect, it } from "vitest"
import {
  createInMemoryRepository,
  ingestDldTransactions,
  sampleDldTransactions,
} from "@/lib/ingestion"

describe("Ingestion", () => {
  it("stores canonical entities and snapshots", async () => {
    const repository = createInMemoryRepository()
    const run = await ingestDldTransactions(sampleDldTransactions, repository)
    const state = repository.getState()

    expect(run.status).toBe("completed")
    expect(state.entities.length).toBe(sampleDldTransactions.length)
    expect(state.snapshots.length).toBe(sampleDldTransactions.length)
    expect(state.entities[0].id).toContain("transaction_")
  })
})

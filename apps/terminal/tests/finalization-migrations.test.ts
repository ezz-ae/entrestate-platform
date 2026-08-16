import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const migrationPath = path.join(
  process.cwd(),
  "prisma",
  "sql",
  "2026-03-08_intelligence_distribution_finalize.sql",
)

describe("finalization SQL migrations", () => {
  it("contains the required intelligence and distribution objects", () => {
    const sql = fs.readFileSync(migrationPath, "utf8")

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS investor_profiles")
    expect(sql).toContain("CREATE OR REPLACE VIEW investor_profiles_v1")
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS tier_gate_events")
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS notebook_provenance_log")
    expect(sql).toContain("CREATE OR REPLACE VIEW notebook_provenance")
    expect(sql).toContain("CREATE OR REPLACE VIEW latest_provenance")
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS attribution_events")
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS widgets")
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS unit_samples")
    expect(sql).toContain("CREATE INDEX IF NOT EXISTS idx_unit_samples_project")
    expect(sql).toContain("unit_sample")
    expect(sql).toContain("unit_coverage_pct")
  })
})

import "server-only"
import { Prisma, dbQuery } from "@/lib/db"

export interface ResolutionProposal {
  projectId: string
  freetext: string
  candidateDeveloperId: string
  candidateName: string
  confidence: number
  matchedField: "name" | "alias"
}

type OrphanProject = {
  id: string
  freetext: string
}

type MatchRow = {
  id: string
  matched: string
  sim: number
  field: "name" | "alias"
}

const AUTO_MERGE_THRESHOLD = 0.92
const REVIEW_THRESHOLD = 0.75

async function run(query: Prisma.Sql) {
  await dbQuery(query)
}

export async function ensureExtensions() {
  await run(Prisma.sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
  await run(
    Prisma.sql`CREATE INDEX IF NOT EXISTS idx_developers_name_trgm ON developers USING gin (name gin_trgm_ops)`,
  )
  await run(
    Prisma.sql`CREATE INDEX IF NOT EXISTS idx_developer_aliases_trgm ON developer_aliases USING gin (alias gin_trgm_ops)`,
  )
  await run(Prisma.sql`
    CREATE TABLE IF NOT EXISTS dev_resolution_proposals (
      project_id uuid PRIMARY KEY,
      candidate_id uuid NOT NULL,
      confidence numeric NOT NULL,
      matched_field text NOT NULL,
      created_at timestamptz DEFAULT now(),
      decided_at timestamptz,
      decision text CHECK (decision IN ('accept','reject'))
    )
  `)
}

export async function generateProposals(): Promise<{ autoMerged: number; staged: number; orphans: number }> {
  await ensureExtensions()

  const orphans = await dbQuery<OrphanProject>(Prisma.sql`
    SELECT id, COALESCE(developer_freetext, '') AS freetext
    FROM projects
    WHERE deleted_at IS NULL
      AND developer_id IS NULL
      AND is_test = false
  `)

  let autoMerged = 0
  let staged = 0

  for (const orphan of orphans) {
    if (!orphan.freetext || orphan.freetext.length < 3) continue

    const matches = await dbQuery<MatchRow>(Prisma.sql`
      WITH name_match AS (
        SELECT id, name AS matched, similarity(name, ${orphan.freetext}) AS sim, 'name' AS field
        FROM developers
        WHERE deleted_at IS NULL
      ),
      alias_match AS (
        SELECT da.developer_id AS id, da.alias AS matched, similarity(da.alias, ${orphan.freetext}) AS sim, 'alias' AS field
        FROM developer_aliases da
      )
      SELECT *
      FROM (
        SELECT * FROM name_match
        UNION ALL
        SELECT * FROM alias_match
      ) m
      ORDER BY sim DESC
      LIMIT 1
    `)

    const top = matches[0]
    if (!top || typeof top.sim !== "number" || top.sim < REVIEW_THRESHOLD) continue

    if (top.sim >= AUTO_MERGE_THRESHOLD) {
      await run(Prisma.sql`
        UPDATE projects
        SET developer_id = ${top.id},
            developer_resolved_at = now(),
            developer_resolution_method = 'trigram_auto'
        WHERE id = ${orphan.id}
      `)
      autoMerged += 1
      continue
    }

    await run(Prisma.sql`
      INSERT INTO dev_resolution_proposals (project_id, candidate_id, confidence, matched_field)
      VALUES (${orphan.id}, ${top.id}, ${top.sim}, ${top.field})
      ON CONFLICT (project_id) DO UPDATE
        SET candidate_id = EXCLUDED.candidate_id,
            confidence = EXCLUDED.confidence,
            matched_field = EXCLUDED.matched_field
    `)
    staged += 1
  }

  return { autoMerged, staged, orphans: orphans.length }
}

import { Prisma } from "@prisma/client"
import type { CanonicalEntity, CanonicalSnapshot, IngestionRun } from "./types"

export type IngestionRepository = {
  ensureSchema(): Promise<void>
  upsertEntities(entities: CanonicalEntity[]): Promise<void>
  insertSnapshots(snapshots: CanonicalSnapshot[]): Promise<void>
  recordRun(run: IngestionRun): Promise<void>
}

export type InMemoryIngestionRepository = IngestionRepository & {
  getState(): {
    entities: CanonicalEntity[]
    snapshots: CanonicalSnapshot[]
    runs: IngestionRun[]
  }
}

type DbClient = {
  $executeRaw<T = unknown>(query: Prisma.Sql): Promise<T>
  $executeRawUnsafe<T = unknown>(query: string): Promise<T>
}

export function createInMemoryRepository(): InMemoryIngestionRepository {
  const entities: CanonicalEntity[] = []
  const snapshots: CanonicalSnapshot[] = []
  const runs: IngestionRun[] = []

  return {
    async ensureSchema() {
      return
    },
    async upsertEntities(records) {
      records.forEach((record) => {
        const index = entities.findIndex((item) => item.id === record.id)
        if (index >= 0) entities[index] = record
        else entities.push(record)
      })
    },
    async insertSnapshots(records) {
      snapshots.push(...records)
    },
    async recordRun(run) {
      runs.push(run)
    },
    getState() {
      return { entities, snapshots, runs }
    },
  }
}

export function createPrismaIngestionRepository(db: DbClient): IngestionRepository {
  return {
    async ensureSchema() {
      await db.$executeRawUnsafe(
        "CREATE TABLE IF NOT EXISTS canonical_entities (id TEXT PRIMARY KEY, entity_type TEXT, source TEXT, source_id TEXT, name TEXT, city TEXT, area TEXT, attributes JSONB, created_at TIMESTAMP DEFAULT NOW())",
      )
      await db.$executeRawUnsafe(
        "CREATE TABLE IF NOT EXISTS canonical_snapshots (id TEXT PRIMARY KEY, entity_id TEXT, version TEXT, as_of TIMESTAMP, payload JSONB, source TEXT, created_at TIMESTAMP DEFAULT NOW())",
      )
      await db.$executeRawUnsafe(
        "CREATE TABLE IF NOT EXISTS ingestion_runs (id TEXT PRIMARY KEY, source TEXT, started_at TIMESTAMP, completed_at TIMESTAMP, status TEXT, row_count INT)",
      )
    },
    async upsertEntities(records) {
      for (const record of records) {
        await db.$executeRaw(
          Prisma.sql`INSERT INTO canonical_entities (id, entity_type, source, source_id, name, city, area, attributes)
          VALUES (${record.id}, ${record.entityType}, ${record.source}, ${record.sourceId}, ${record.name ?? null}, ${
            record.city ?? null
          }, ${record.area ?? null}, ${JSON.stringify(record.attributes)})
          ON CONFLICT (id) DO UPDATE SET
            entity_type = EXCLUDED.entity_type,
            source = EXCLUDED.source,
            source_id = EXCLUDED.source_id,
            name = EXCLUDED.name,
            city = EXCLUDED.city,
            area = EXCLUDED.area,
            attributes = EXCLUDED.attributes`,
        )
      }
    },
    async insertSnapshots(records) {
      for (const record of records) {
        await db.$executeRaw(
          Prisma.sql`INSERT INTO canonical_snapshots (id, entity_id, version, as_of, payload, source)
          VALUES (${record.id}, ${record.entityId}, ${record.version}, ${record.asOf}, ${
            JSON.stringify(record.payload)
          }, ${record.source})`,
        )
      }
    },
    async recordRun(run) {
      await db.$executeRaw(
        Prisma.sql`INSERT INTO ingestion_runs (id, source, started_at, completed_at, status, row_count)
        VALUES (${run.id}, ${run.source}, ${run.startedAt}, ${run.completedAt ?? null}, ${run.status}, ${
          run.rowCount
        })
        ON CONFLICT (id) DO UPDATE SET
          completed_at = EXCLUDED.completed_at,
          status = EXCLUDED.status,
          row_count = EXCLUDED.row_count`,
      )
    },
  }
}

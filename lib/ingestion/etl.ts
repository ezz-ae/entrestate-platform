import crypto from "node:crypto"
import { hashObject } from "../governance"
import type {
  CanonicalEntity,
  CanonicalSnapshot,
  DeveloperPipeline,
  DldTransaction,
  IngestionRun,
  Listing,
  RiskMetric,
} from "./types"
import type { IngestionRepository } from "./repository"

const createStableId = (entityType: CanonicalEntity["entityType"], source: string, sourceId: string) => {
  const hash = hashObject({ entityType, source, sourceId })
  return `${entityType}_${hash.slice(0, 16)}`
}

const createSnapshotId = (entityId: string, version: string, asOf: string) => {
  const hash = hashObject({ entityId, version, asOf })
  return `snap_${hash.slice(0, 16)}`
}

const createRun = (source: string): IngestionRun => ({
  id: `run_${crypto.randomUUID()}`,
  source,
  startedAt: new Date().toISOString(),
  status: "started",
  rowCount: 0,
})

const finalizeRun = (run: IngestionRun, rowCount: number): IngestionRun => ({
  ...run,
  completedAt: new Date().toISOString(),
  status: "completed",
  rowCount,
})

const createSnapshot = (entityId: string, payload: Record<string, unknown>, source: string, asOf: string) => {
  const version = "v1"
  return {
    id: createSnapshotId(entityId, version, asOf),
    entityId,
    version,
    asOf,
    payload,
    source,
  } satisfies CanonicalSnapshot
}

const mapTransaction = (record: DldTransaction): CanonicalEntity => ({
  id: createStableId("transaction", "dld", record.transactionId),
  entityType: "transaction",
  source: "dld",
  sourceId: record.transactionId,
  name: record.project,
  city: record.city,
  area: record.area,
  attributes: {
    assetId: record.assetId,
    developer: record.developer,
    priceAed: record.priceAed,
    unitPriceAed: record.unitPriceAed,
    transactedAt: record.transactedAt,
    beds: record.beds,
  },
})

const mapListing = (record: Listing): CanonicalEntity => ({
  id: createStableId("listing", "listings", record.listingId),
  entityType: "listing",
  source: "listings",
  sourceId: record.listingId,
  name: record.project,
  city: record.city,
  area: record.area,
  attributes: {
    assetId: record.assetId,
    developer: record.developer,
    priceAed: record.priceAed,
    yieldPct: record.yieldPct,
    statusBand: record.statusBand,
    listedAt: record.listedAt,
  },
})

const mapPipeline = (record: DeveloperPipeline): CanonicalEntity => ({
  id: createStableId("pipeline", "pipelines", record.pipelineId),
  entityType: "pipeline",
  source: "pipelines",
  sourceId: record.pipelineId,
  name: record.project,
  city: record.city,
  area: record.area,
  attributes: {
    developer: record.developer,
    gfaSqm: record.gfaSqm,
    handoverDate: record.handoverDate,
    statusBand: record.statusBand,
  },
})

const mapRiskMetric = (record: RiskMetric): CanonicalEntity => ({
  id: createStableId("risk_metric", "risk", record.metricId),
  entityType: "risk_metric",
  source: "risk",
  sourceId: record.metricId,
  name: record.area,
  city: record.city,
  area: record.area,
  attributes: {
    riskBand: record.riskBand,
    liquidityBand: record.liquidityBand,
    capturedAt: record.capturedAt,
  },
})

export async function ingestDldTransactions(records: DldTransaction[], repository: IngestionRepository) {
  const run = createRun("dld")
  await repository.ensureSchema()
  await repository.recordRun(run)

  const entities = records.map(mapTransaction)
  const snapshots = entities.map((entity, index) =>
    createSnapshot(entity.id, entity.attributes, run.source, records[index].transactedAt),
  )

  await repository.upsertEntities(entities)
  await repository.insertSnapshots(snapshots)

  const completed = finalizeRun(run, records.length)
  await repository.recordRun(completed)
  return completed
}

export async function ingestListings(records: Listing[], repository: IngestionRepository) {
  const run = createRun("listings")
  await repository.ensureSchema()
  await repository.recordRun(run)

  const entities = records.map(mapListing)
  const snapshots = entities.map((entity, index) =>
    createSnapshot(entity.id, entity.attributes, run.source, records[index].listedAt),
  )

  await repository.upsertEntities(entities)
  await repository.insertSnapshots(snapshots)

  const completed = finalizeRun(run, records.length)
  await repository.recordRun(completed)
  return completed
}

export async function ingestDeveloperPipelines(records: DeveloperPipeline[], repository: IngestionRepository) {
  const run = createRun("pipelines")
  await repository.ensureSchema()
  await repository.recordRun(run)

  const entities = records.map(mapPipeline)
  const snapshots = entities.map((entity, index) =>
    createSnapshot(entity.id, entity.attributes, run.source, records[index].handoverDate ?? run.startedAt),
  )

  await repository.upsertEntities(entities)
  await repository.insertSnapshots(snapshots)

  const completed = finalizeRun(run, records.length)
  await repository.recordRun(completed)
  return completed
}

export async function ingestRiskMetrics(records: RiskMetric[], repository: IngestionRepository) {
  const run = createRun("risk")
  await repository.ensureSchema()
  await repository.recordRun(run)

  const entities = records.map(mapRiskMetric)
  const snapshots = entities.map((entity, index) =>
    createSnapshot(entity.id, entity.attributes, run.source, records[index].capturedAt),
  )

  await repository.upsertEntities(entities)
  await repository.insertSnapshots(snapshots)

  const completed = finalizeRun(run, records.length)
  await repository.recordRun(completed)
  return completed
}

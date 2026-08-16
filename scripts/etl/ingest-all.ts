import { prisma } from "@/lib/prisma"
import {
  createPrismaIngestionRepository,
  ingestDeveloperPipelines,
  ingestDldTransactions,
  ingestListings,
  ingestRiskMetrics,
  sampleDeveloperPipelines,
  sampleDldTransactions,
  sampleListings,
  sampleRiskMetrics,
} from "@/lib/ingestion"

async function main() {
  const repository = createPrismaIngestionRepository(prisma)
  await ingestDldTransactions(sampleDldTransactions, repository)
  await ingestListings(sampleListings, repository)
  await ingestDeveloperPipelines(sampleDeveloperPipelines, repository)
  await ingestRiskMetrics(sampleRiskMetrics, repository)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

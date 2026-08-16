import { prisma } from "@/lib/prisma"
import { createPrismaIngestionRepository, ingestRiskMetrics, sampleRiskMetrics } from "@/lib/ingestion"

async function main() {
  const repository = createPrismaIngestionRepository(prisma)
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

import { prisma } from "@/lib/prisma"
import {
  createPrismaIngestionRepository,
  ingestDeveloperPipelines,
  sampleDeveloperPipelines,
} from "@/lib/ingestion"

async function main() {
  const repository = createPrismaIngestionRepository(prisma)
  await ingestDeveloperPipelines(sampleDeveloperPipelines, repository)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

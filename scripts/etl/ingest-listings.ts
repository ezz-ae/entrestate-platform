import { prisma } from "@/lib/prisma"
import { createPrismaIngestionRepository, ingestListings, sampleListings } from "@/lib/ingestion"

async function main() {
  const repository = createPrismaIngestionRepository(prisma)
  await ingestListings(sampleListings, repository)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

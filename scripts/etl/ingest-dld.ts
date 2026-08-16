import { prisma } from "@/lib/prisma"
import { createPrismaIngestionRepository, ingestDldTransactions, sampleDldTransactions } from "@/lib/ingestion"

async function main() {
  const repository = createPrismaIngestionRepository(prisma)
  await ingestDldTransactions(sampleDldTransactions, repository)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import "server-only"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "./server"

/**
 * Ensures that the Neon Auth session user exists in our local Prisma database
 * along with their strategic user profile.
 */
export async function getSyncedUser() {
  const neonUser = await getSessionUser()
  if (!neonUser) return null

  try {
    // Check if we already have this user
    let dbUser = await prisma.user.findUnique({
      where: { id: neonUser.id },
      include: { profile: true },
    })

    if (!dbUser) {
      // Create the user and their strategic profile on first sync
      dbUser = await prisma.user.create({
        data: {
          id: neonUser.id,
          email: neonUser.email,
          name: neonUser.name,
          profile: {
            create: {
              riskBias: 0.65,
              yieldVsSafety: 0.5,
              horizon: "Ready",
            },
          },
        },
        include: { profile: true },
      })
    }

    return dbUser
  } catch (error) {
    console.error("User session sync failed:", error)
    return null
  }
}

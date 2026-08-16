"use client"

import { createAuthClient } from "@neondatabase/auth/next"

export const authClient = createAuthClient()

export function useIsAdmin() {
  const session = authClient.useSession()
  const adminModeEnabled =
    process.env.NEXT_PUBLIC_ADMIN_MODE === "true" && process.env.NODE_ENV !== "production"
  const isAdmin = adminModeEnabled || session.data?.user?.role === "admin"
  return { ...session, isAdmin }
}

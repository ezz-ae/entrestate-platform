import type { Metadata } from "next"
import { redirect } from "next/navigation"

import ProfileSettingsPage from "@/app/settings/profile/page"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getSyncedUser } from "@/lib/auth/sync"
import { getRequestLocale } from "@/i18n/request"

export const metadata: Metadata = {
  title: "Profile Settings - Entrestate",
  description: "Manage your decision profile, market preferences, and weighting defaults.",
}

export default async function AccountProfilePage() {
  const locale = await getRequestLocale()
  const user = await getSyncedUser()
  if (!user) {
    redirect(buildLoginHref(locale, "/account/profile"))
  }

  return <ProfileSettingsPage />
}

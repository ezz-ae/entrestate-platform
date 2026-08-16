import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { defaultLocale, localeCookieName, normalizeLocale, type AppLocale } from "@/i18n/locale"

export async function getRequestLocale(): Promise<AppLocale> {
  const headerStore = await headers()
  const cookieStore = await cookies()

  return normalizeLocale(
    headerStore.get("x-entrestate-locale") ?? cookieStore.get(localeCookieName)?.value ?? defaultLocale,
  )
}

export async function getLocaleMessages(locale: AppLocale) {
  switch (locale) {
    case "ar":
      return (await import("@/messages/ar.json")).default
    case "en":
    default:
      return (await import("@/messages/en.json")).default
  }
}

export default getRequestConfig(async () => {
  const locale = await getRequestLocale()

  return {
    locale,
    messages: await getLocaleMessages(locale),
  }
})

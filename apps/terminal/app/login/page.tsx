import { redirect } from "next/navigation"
import { LoginPageClient } from "@/components/auth/login-page-client"
import { resolvePostLoginHref } from "@/lib/auth/navigation"
import { getSessionUser } from "@/lib/auth/server"
import { getRequestLocale } from "@/i18n/request"

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = await getRequestLocale()
  const params = (await searchParams) ?? {}
  const sessionUser = await getSessionUser()

  if (sessionUser) {
    redirect(resolvePostLoginHref(locale, firstParam(params.next), "/me"))
  }

  return <LoginPageClient />
}

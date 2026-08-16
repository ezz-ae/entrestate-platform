import { redirect } from "next/navigation"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export default async function PartnersPage() {
  const locale = await getRequestLocale()
  redirect(prefixLocalePath("/docs/partners-apis", locale))
}

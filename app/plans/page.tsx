import { redirect } from "next/navigation"
import { prefixLocalePath } from "@/i18n/locale"
import { getRequestLocale } from "@/i18n/request"

export default async function PlansPage() {
  const locale = await getRequestLocale()
  redirect(prefixLocalePath("/pricing", locale))
}

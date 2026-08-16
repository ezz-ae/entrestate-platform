import { redirect } from "next/navigation"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export default async function AutomationRuntimePage() {
  const locale = await getRequestLocale()
  redirect(prefixLocalePath("/agent-runtime", locale))
}

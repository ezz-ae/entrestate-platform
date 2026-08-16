import { redirect } from "next/navigation"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export default async function AiPage() {
  const locale = await getRequestLocale()
  redirect(prefixLocalePath("/workspace/data-scientist", locale))
}

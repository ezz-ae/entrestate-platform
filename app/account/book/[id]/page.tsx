import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { NotebookDetailView } from "@/app/notebook/[id]/page"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getSyncedUser } from "@/lib/auth/sync"
import { getRequestLocale } from "@/i18n/request"

export const metadata: Metadata = {
  title: "Research Notebook - Entrestate",
  description: "Review generated notebook pages, refresh outputs, and ask follow-up questions inside your account workspace.",
}

export default async function AccountBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const locale = await getRequestLocale()
  const user = await getSyncedUser()
  const resolvedParams = await params

  if (!user) {
    redirect(buildLoginHref(locale, `/account/book/${resolvedParams.id}`))
  }

  return <NotebookDetailView basePath="/account/book" accountMode />
}

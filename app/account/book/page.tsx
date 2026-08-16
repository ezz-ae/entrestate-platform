import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { NotebookLibraryView } from "@/app/notebook/page"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getSyncedUser } from "@/lib/auth/sync"
import { getRequestLocale } from "@/i18n/request"

export const metadata: Metadata = {
  title: "Research Notebooks - Entrestate",
  description: "Create and manage working research notebooks for areas, projects, clients, and portfolios.",
}

export default async function AccountBookPage() {
  const locale = await getRequestLocale()
  const user = await getSyncedUser()
  if (!user) {
    redirect(buildLoginHref(locale, "/account/book"))
  }

  return <NotebookLibraryView basePath="/account/book" accountMode />
}

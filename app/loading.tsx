"use client"

import { useTranslations } from "next-intl"

export default function Loading() {
  const t = useTranslations("system")

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24" aria-busy="true">
      <section
        aria-hidden="true"
        className="mx-auto flex max-w-md flex-col items-center text-center"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="mt-6 text-lg font-semibold text-foreground">{t("loadingTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("loadingBody")}</p>
      </section>
    </main>
  )
}

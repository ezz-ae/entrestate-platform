"use client"

import { useTranslations } from "next-intl"

export default function Loading() {
  const t = useTranslations("system")

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground">{t("loadingShort")}</p>
      </div>
    </div>
  )
}

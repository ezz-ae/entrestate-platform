"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { prefixLocalePath } from "@/i18n/locale"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const locale = useLocale()
  const t = useTranslations("system")

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden bg-background">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-destructive/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <section className="relative mx-auto w-full max-w-md">

        {/* Card */}
        <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/10 p-10 text-center">

          {/* Icon */}
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/8 border border-destructive/15">
            <AlertTriangle className="h-7 w-7 text-destructive/70" strokeWidth={1.5} />
          </div>

          {/* Wordmark */}
          <p className="mb-3 text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/40">
            Entrestate
          </p>

          <h1 className="text-xl font-semibold text-foreground mb-3 leading-snug">
            {t("errorTitle")}
          </h1>
          <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-xs mx-auto">
            {t("errorBody")}
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
            >
              <RefreshCcw className="w-4 h-4" />
              {t("retry")}
            </button>
            <Link
              href={prefixLocalePath("/", locale as "en" | "ar")}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              <Home className="w-4 h-4" />
              {t("backHome")}
            </Link>
          </div>

          {/* Digest */}
          {error?.digest ? (
            <p className="mt-7 text-[11px] font-mono text-muted-foreground/30 bg-muted/30 rounded-lg px-3 py-2 inline-block">
              {t("reference")}: {error.digest}
            </p>
          ) : null}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-muted-foreground/40">
          If this keeps happening, contact{" "}
          <a href="mailto:support@entrestate.com" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
            support@entrestate.com
          </a>
        </p>
      </section>
    </main>
  )
}

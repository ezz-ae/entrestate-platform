"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"
import { ArrowRight, TerminalSquare } from "lucide-react"
import { type AppLocale } from "@/i18n/locale"
import { authClient } from "@/lib/auth/client"
import { buildCopilotEntryHref } from "@/lib/copilot/navigation"
import { useRuntimeShell } from "@/hooks/use-runtime-shell"
import { cn } from "@/lib/utils"

type TerminalPromptTeaserProps = {
  className?: string
  compact?: boolean
  title?: string
  description?: string
  caption?: string
  buttonLabel?: string
  examples?: string[]
}

const DEFAULT_EXAMPLES = {
  en: [
    "Best yield under AED 1.5M in JVC",
    "Grade A projects with STRONG_BUY",
    "Imtiaz track record in Dubai Land",
  ],
  ar: [
    "أفضل عائد تحت AED 1.5M في JVC",
    "مشاريع بدرجة A مع STRONG_BUY",
    "سجل Imtiaz في دبي لاند",
  ],
} as const

export function TerminalPromptTeaser({
  className,
  compact = false,
  title,
  description,
  caption,
  buttonLabel,
  examples,
}: TerminalPromptTeaserProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const runtimeShell = useRuntimeShell()
  const { data: session } = authClient.useSession()
  const isArabic = locale === "ar"
  const copy = {
    title: title ?? (isArabic ? "ابدأ بالسؤال قبل أن تبدأ بالجولة." : "Start with the question before the workflow."),
    description:
      description
      ?? (isArabic
        ? "المحطة هي أسرع طريق إلى بيانات السوق والنتائج والأدلة. اكتب ما تبحث عنه، ثم ادخل مباشرة إلى المسار الحي."
        : "The terminal is the fastest path into market data, verdicts, and evidence. Type what you need, then move straight into the live surface."),
    caption:
      caption
      ?? (isArabic
        ? "مدعوم بسجل معاملات DLD والمخزون المُقيَّم الحي."
        : "Backed by the DLD transaction registry and live scored inventory."),
    inputLabel: isArabic ? "اسأل المحطة" : "Ask the terminal",
    inputPlaceholder: isArabic ? "اكتب سؤالاً أو اختر مثالاً أدناه" : "Type a question or pick an example below",
    buttonLabel: buttonLabel ?? (isArabic ? "افتح المحطة" : "Open Terminal"),
  }

  const demoExamples = useMemo(() => {
    if (examples && examples.length > 0) return examples
    return [...DEFAULT_EXAMPLES[locale]]
  }, [examples, locale])
  const inputId = useId()

  const [query, setQuery] = useState("")
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    if (query.trim().length > 0 || demoExamples.length <= 1) return undefined
    const interval = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % demoExamples.length)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [demoExamples, query])

  function openTerminal(nextQuery: string) {
    const normalized = nextQuery.trim()
    const href = buildCopilotEntryHref({
      authenticated: Boolean(session?.user),
      locale,
      pathname,
      search: searchParams?.toString() ?? "",
      prompt: normalized.length > 0 ? normalized : null,
      preferShell:
        runtimeShell === "mobile"
        || (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches),
    })
    router.push(href)
  }

  return (
    <section
      className={cn(
        "rounded-[28px] border border-border/70 bg-card/70 p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.65)] backdrop-blur-sm",
        compact ? "p-4" : "p-6",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-4", compact ? "gap-3" : "gap-5")}>
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <TerminalSquare className="h-3.5 w-3.5" />
            {copy.inputLabel}
          </div>
          <h3 className={cn("mt-3 font-semibold tracking-tight text-foreground", compact ? "text-lg" : "text-2xl")}>
            {copy.title}
          </h3>
          {!compact ? (
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              {copy.description}
            </p>
          ) : null}
        </div>

        <form
          className="rounded-2xl border border-border/60 bg-background/70 p-3"
          onSubmit={(event) => {
            event.preventDefault()
            openTerminal(query || demoExamples[placeholderIndex] || "")
          }}
        >
          <label className="sr-only" htmlFor={inputId}>
            {copy.inputLabel}
          </label>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              id={inputId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={query.trim().length > 0 ? copy.inputPlaceholder : demoExamples[placeholderIndex] || copy.inputPlaceholder}
              className="h-12 flex-1 rounded-xl border border-transparent bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {copy.buttonLabel}
              <ArrowRight className={cn("h-4 w-4", isArabic && "rotate-180")} />
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          {demoExamples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => openTerminal(example)}
              className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground/70">{copy.caption}</p>
      </div>
    </section>
  )
}

"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Zap } from "lucide-react"
import { useLocale } from "next-intl"
import { formatAed } from "@/lib/format/currency"

const CHANNELS = ["phone", "email", "whatsapp", "relay"] as const

type ApiResult = Record<string, unknown> | null

type SearchResult = {
  id: string
  name: string
  area?: string | null
  price?: number | null
  queueDepth?: number | null
}

type TransitionRow = {
  from: string
  to: string
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(typeof payload?.error === "string" ? payload.error : "Request failed")
  }
  return (await response.json()) as T
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(typeof payload?.error === "string" ? payload.error : "Request failed")
  }
  return (await response.json()) as T
}

function JsonBlock({ value }: { value: unknown }) {
  const content = useMemo(() => JSON.stringify(value, null, 2), [value])
  return (
    <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-foreground/80">
      {content}
    </pre>
  )
}

function StepCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  )
}

export function TransactionDemo() {
  const locale = useLocale()
  const [ingestUrl, setIngestUrl] = useState("")
  const [ingestLoading, setIngestLoading] = useState(false)
  const [ingestResult, setIngestResult] = useState<ApiResult>(null)
  const [publishResult, setPublishResult] = useState<ApiResult>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [holdResult, setHoldResult] = useState<ApiResult>(null)
  const [recoveryResult, setRecoveryResult] = useState<ApiResult>(null)
  const [consentResult, setConsentResult] = useState<ApiResult>(null)
  const [classifyInput, setClassifyInput] = useState("")
  const [classifyResult, setClassifyResult] = useState<ApiResult>(null)
  const [transitionResult, setTransitionResult] = useState<TransitionRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [partyAChannels, setPartyAChannels] = useState<string[]>(["email"])
  const [partyBChannels, setPartyBChannels] = useState<string[]>(["whatsapp"])

  const folderId = (ingestResult as any)?.folderId || (ingestResult as any)?.workspace?.id || selectedFolderId

  const handleIngest = async () => {
    setError(null)
    setIngestLoading(true)
    try {
      const result = await postJson<ApiResult>("/api/demo/ingest", { url: ingestUrl })
      setIngestResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed")
    } finally {
      setIngestLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!folderId) {
      setError("No SDR workspace available. Run Step 1 first.")
      return
    }
    setError(null)
    try {
      const result = await postJson<ApiResult>("/api/demo/publish", { folderId })
      setPublishResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed")
    }
  }

  const handleSearch = async () => {
    setError(null)
    setSearchLoading(true)
    try {
      const result = await postJson<{ results: SearchResult[] }>("/api/demo/search", { query: searchQuery })
      const results = result.results ?? []
      setSearchResults(results)
      setSelectedFolderId(results[0]?.id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleHold = async () => {
    if (!selectedFolderId) {
      setError("Select a unit from Step 3 first.")
      return
    }
    setError(null)
    try {
      const result = await postJson<ApiResult>("/api/demo/hold", { folderId: selectedFolderId })
      setHoldResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hold request failed")
    }
  }

  const handleRecover = async () => {
    if (!selectedFolderId) {
      setError("Select a unit from Step 3 first.")
      return
    }
    setError(null)
    try {
      const result = await postJson<ApiResult>("/api/demo/recover", { folderId: selectedFolderId })
      setRecoveryResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recovery failed")
    }
  }

  const handleConsent = async () => {
    setError(null)
    try {
      const result = await postJson<ApiResult>("/api/demo/consent", {
        partyA: partyAChannels,
        partyB: partyBChannels,
      })
      setConsentResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Consent check failed")
    }
  }

  const handleClassify = async () => {
    setError(null)
    try {
      const result = await postJson<ApiResult>("/api/demo/classify", { message: classifyInput })
      setClassifyResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed")
    }
  }

  const handleTransitions = async () => {
    setError(null)
    try {
      const result = await getJson<{ transitions: TransitionRow[] }>("/api/demo/transitions")
      setTransitionResult(result.transitions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transition load failed")
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-400">
          {error}
        </div>
      ) : null}

      <StepCard
        title="Step 1"
        subtitle="Paste live URL -> Structured workspace"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={ingestUrl}
            onChange={(event) => setIngestUrl(event.target.value)}
            placeholder="https://dubizzle.com/..."
            className="flex-1 rounded-xl border border-border/60 bg-background/70 px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleIngest}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            disabled={ingestLoading}
          >
            {ingestLoading ? "Ingesting..." : "Ingest"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {ingestResult ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Raw payload</p>
                <JsonBlock value={(ingestResult as any).raw ?? ingestResult} />
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Structured workspace</p>
                <JsonBlock value={(ingestResult as any).workspace ?? ingestResult} />
              </div>
            </div>
            {Array.isArray((ingestResult as any).deltas) ? (
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Delta checklist</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {(ingestResult as any).deltas.map((delta: any, index: number) => (
                    <span
                      key={`${delta.field}-${index}`}
                      className={`rounded-full border px-2.5 py-1 ${
                        delta.status === "missing"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : delta.status === "resolved"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-border/60 bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {delta.field}: {delta.status}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </StepCard>

      <StepCard
        title="Step 2"
        subtitle="Sybil firewall - Publish gating"
      >
        <button
          type="button"
          onClick={handlePublish}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-sm font-semibold"
        >
          <ShieldCheck className="h-4 w-4" />
          Attempt publish
        </button>
        {publishResult ? (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <JsonBlock value={publishResult} />
          </div>
        ) : null}
      </StepCard>

      <StepCard
        title="Step 3"
        subtitle="Tenant discovery - Structured search"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="2BR Marina under 3M"
            className="flex-1 rounded-xl border border-border/60 bg-background/70 px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            disabled={searchLoading}
          >
            {searchLoading ? "Searching..." : "Search"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {searchResults.map((result) => (
              <button
                type="button"
                key={result.id}
                onClick={() => setSelectedFolderId(result.id)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selectedFolderId === result.id
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 bg-background/60"
                }`}
              >
                <p className="font-semibold text-foreground">{result.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(result.area ?? "-") + " / " + (result.price ? formatAed(result.price, locale, { compact: true, fallback: "—" }) : "Price -")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Queue depth: {result.queueDepth ?? 0}
                </p>
              </button>
            ))}
          </div>
        ) : null}
      </StepCard>

      <StepCard
        title="Step 4"
        subtitle="Hold + queue mechanics"
      >
        <button
          type="button"
          onClick={handleHold}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-sm font-semibold"
        >
          <Clock className="h-4 w-4" />
          Hold this unit
        </button>
        {holdResult ? (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <JsonBlock value={holdResult} />
          </div>
        ) : null}
      </StepCard>

      <StepCard
        title="Step 5"
        subtitle="Soft-bounce recovery"
      >
        <button
          type="button"
          onClick={handleRecover}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-sm font-semibold"
        >
          <Zap className="h-4 w-4" />
          Recover matches
        </button>
        {recoveryResult ? (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <JsonBlock value={recoveryResult} />
          </div>
        ) : null}
      </StepCard>

      <StepCard
        title="Step 6"
        subtitle="Trust protocol - Consent overlap"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Party A</p>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((channel) => (
                <label key={`a-${channel}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={partyAChannels.includes(channel)}
                    onChange={(event) => {
                      setPartyAChannels((prev) =>
                        event.target.checked
                          ? [...prev, channel]
                          : prev.filter((item) => item !== channel),
                      )
                    }}
                  />
                  {channel}
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Party B</p>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((channel) => (
                <label key={`b-${channel}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={partyBChannels.includes(channel)}
                    onChange={(event) => {
                      setPartyBChannels((prev) =>
                        event.target.checked
                          ? [...prev, channel]
                          : prev.filter((item) => item !== channel),
                      )
                    }}
                  />
                  {channel}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleConsent}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-sm font-semibold"
        >
          <CheckCircle2 className="h-4 w-4" />
          Check overlap
        </button>
        {consentResult ? (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <JsonBlock value={consentResult} />
          </div>
        ) : null}
      </StepCard>

      <StepCard
        title="Step 7"
        subtitle="WhatsApp intent -> structured buttons"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={classifyInput}
            onChange={(event) => setClassifyInput(event.target.value)}
            placeholder="I want to hold this unit"
            className="flex-1 rounded-xl border border-border/60 bg-background/70 px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleClassify}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Classify
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {classifyResult ? (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <JsonBlock value={classifyResult} />
          </div>
        ) : null}
      </StepCard>

      <StepCard
        title="Step 8"
        subtitle="State machine visualization"
      >
        <button
          type="button"
          onClick={handleTransitions}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-sm font-semibold"
        >
          Load transitions
          <ArrowRight className="h-4 w-4" />
        </button>
        {transitionResult.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {transitionResult.map((transition, index) => (
              <div key={`${transition.from}-${transition.to}-${index}`} className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs">
                <span className="font-semibold text-foreground">{transition.from}</span>
                <span className="mx-1 text-muted-foreground">-&gt;</span>
                <span className="text-muted-foreground">{transition.to}</span>
              </div>
            ))}
          </div>
        ) : null}
      </StepCard>
    </div>
  )
}

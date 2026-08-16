"use client"

import { useState, useEffect } from "react"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Copy, Key, Loader2, Plus, ShieldCheck, Trash } from "lucide-react"
import { type AppLocale } from "@/i18n/locale"

type ApiKeyRecord = {
  id: string
  name: string
  prefix: string
  scopes: string[]
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
}

type ApiKeyManagerProps = {
  canCreate: boolean
}

const COPY = {
  en: {
    activeKeys: "Active API keys",
    noKeys: "No API keys generated yet.",
    createTitle: "Create new key",
    createPlaceholder: "External dashboard - corporate site",
    generate: "Generate key",
    generating: "Generating...",
    createError: "Failed to create key.",
    loadError: "Failed to load keys.",
    deleteError: "Failed to revoke key.",
    revoke: "Revoke",
    revokeConfirm: "Revoke this API key? This cannot be undone.",
    copied: "Copied",
    copy: "Copy",
    done: "Done",
    successTitle: "API key generated",
    successBody: "Copy this key now. For security reasons it will not be shown again.",
    restrictedTitle: "Key creation requires an institutional plan.",
    restrictedBody: "Existing keys remain visible here, but new keys can only be created on the institutional tier.",
    created: "Created",
    lastUsed: "Last used",
    neverUsed: "Never used",
  },
  ar: {
    activeKeys: "مفاتيح API النشطة",
    noKeys: "لا توجد مفاتيح API بعد.",
    createTitle: "إنشاء مفتاح جديد",
    createPlaceholder: "لوحة خارجية - موقع الشركة",
    generate: "إنشاء المفتاح",
    generating: "جارٍ الإنشاء...",
    createError: "تعذر إنشاء المفتاح.",
    loadError: "تعذر تحميل المفاتيح.",
    deleteError: "تعذر إلغاء المفتاح.",
    revoke: "إلغاء",
    revokeConfirm: "هل تريد إلغاء مفتاح API هذا؟ لا يمكن التراجع عن ذلك.",
    copied: "تم النسخ",
    copy: "نسخ",
    done: "تم",
    successTitle: "تم إنشاء المفتاح",
    successBody: "انسخ هذا المفتاح الآن. لأسباب أمنية لن يظهر مرة أخرى.",
    restrictedTitle: "إنشاء المفاتيح يتطلب الباقة المؤسسية.",
    restrictedBody: "ستظل المفاتيح الحالية ظاهرة هنا، لكن إنشاء مفاتيح جديدة متاح فقط في الباقة المؤسسية.",
    created: "أُنشئ",
    lastUsed: "آخر استخدام",
    neverUsed: "لم يستخدم بعد",
  },
} as const

function formatDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export default function ApiKeyManager({ canCreate }: ApiKeyManagerProps) {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const copy = COPY[locale] ?? COPY.en

  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState("")
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      const response = await fetch("/api/account/api-keys")
      const data = (await response.json().catch(() => ({}))) as {
        keys?: ApiKeyRecord[]
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error || copy.loadError)
      }

      setKeys(data.keys ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.loadError)
    } finally {
      setLoading(false)
    }
  }

  const createKey = async () => {
    if (!newKeyName || !canCreate) return
    setCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/account/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, scopes: ["read:market", "read:listings"] }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        key?: { rawKey?: string }
        error?: string
      }

      if (!response.ok || !data.key?.rawKey) {
        throw new Error(data.error || copy.createError)
      }

      setLastCreatedKey(data.key.rawKey)
      setNewKeyName("")
      setCopyFeedback(false)
      await loadKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.createError)
    } finally {
      setCreating(false)
    }
  }

  const deleteKey = async (id: string) => {
    if (!window.confirm(copy.revokeConfirm)) return
    setDeletingId(id)
    setError(null)

    try {
      const response = await fetch(`/api/account/api-keys/${id}`, { method: "DELETE" })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(data.error || copy.deleteError)
      }

      setKeys((current) => current.filter((key) => key.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.deleteError)
    } finally {
      setDeletingId(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopyFeedback(true)
    window.setTimeout(() => setCopyFeedback(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-60" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-semibold text-foreground">{copy.activeKeys}</Label>
          <Badge variant="outline">{keys.length}</Badge>
        </div>

        {keys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Key className="mx-auto mb-3 h-8 w-8 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">{copy.noKeys}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{key.name}</p>
                    {key.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="text-[10px]">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                    <code className="text-xs font-mono text-muted-foreground">{key.prefix}</code>
                  </div>
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    {copy.created} {formatDate(key.createdAt, locale)}
                    {" • "}
                    {copy.lastUsed}{" "}
                    {key.lastUsedAt ? formatDate(key.lastUsedAt, locale) : copy.neverUsed}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteKey(key.id)}
                  disabled={deletingId === key.id}
                  className="self-start text-muted-foreground hover:text-destructive"
                >
                  {deletingId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                  {copy.revoke}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-border pt-8">
        <Label className="text-sm font-semibold text-foreground">{copy.createTitle}</Label>

        {!canCreate ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-foreground">{copy.restrictedTitle}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.restrictedBody}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={newKeyName}
            onChange={(event) => setNewKeyName(event.target.value)}
            placeholder={copy.createPlaceholder}
            className="h-11 flex-1"
            disabled={!canCreate}
          />
          <Button onClick={createKey} disabled={creating || !newKeyName || !canCreate} className="h-11 sm:min-w-40">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {creating ? copy.generating : copy.generate}
          </Button>
        </div>
      </div>

      {lastCreatedKey && (
        <div className="animate-in slide-in-from-bottom-2 fade-in rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="mb-3 flex items-center gap-2 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-sm font-semibold">{copy.successTitle}</p>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            {copy.successBody}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-xl border border-emerald-500/20 bg-background p-3 shadow-inner">
              <code className="break-all text-sm font-mono text-foreground">{lastCreatedKey}</code>
            </div>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(lastCreatedKey)}>
              <Copy className="h-4 w-4" />
              {copyFeedback ? copy.copied : copy.copy}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLastCreatedKey(null)} className="mt-4 w-full">
            {copy.done}
          </Button>
        </div>
      )}
    </div>
  )
}

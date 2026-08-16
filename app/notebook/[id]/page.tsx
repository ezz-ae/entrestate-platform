"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import {
  ArrowLeft,
  ArrowRight,
  BookCopy,
  FileSearch,
  Loader2,
  MessageSquareText,
  NotebookPen,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react"

import { AccountSectionNav } from "@/components/account/account-section-nav"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { buildLoginHref } from "@/lib/auth/navigation"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type BookType = "client" | "area" | "project" | "portfolio"
type BookPageType = "overview" | "transactions" | "comparison" | "opportunity" | "risk" | "memo" | "content"
type BookPageStatus = "pending" | "generating" | "ready" | "error"

type BookPage = {
  id: string
  bookId: string
  type: BookPageType
  title: string
  content: Record<string, unknown>
  rawText: string | null
  status: BookPageStatus
  createdAt: string
  updatedAt: string
}

type BookFeedItem = {
  id: string
  bookId: string
  category: string
  headline: string
  detail: Record<string, unknown>
  seenAt: string | null
  createdAt: string
}

type BookDetail = {
  id: string
  title: string
  subject: string
  type: BookType
  metadata: Record<string, unknown> | null
  lastFedAt: string | null
  createdAt: string
  updatedAt: string
  pageCount: number
  feedCount: number
  pages: BookPage[]
  feeds: BookFeedItem[]
}

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

type GeneratePreset = {
  key: string
  label: { en: string; ar: string }
  description: { en: string; ar: string }
  pages: BookPageType[]
}

const PAGE_ORDER: BookPageType[] = [
  "overview",
  "risk",
  "transactions",
  "comparison",
  "opportunity",
  "memo",
  "content",
]

const BOOK_TYPE_LABELS: Record<BookType, { en: string; ar: string }> = {
  area: { en: "Area", ar: "منطقة" },
  project: { en: "Project", ar: "مشروع" },
  client: { en: "Client", ar: "عميل" },
  portfolio: { en: "Portfolio", ar: "محفظة" },
}

const PRESETS: GeneratePreset[] = [
  {
    key: "baseline",
    label: { en: "Refresh baseline", ar: "تحديث الأساس" },
    description: {
      en: "Overview and risk pages for the current subject.",
      ar: "صفحتا النظرة العامة والمخاطر للموضوع الحالي.",
    },
    pages: ["overview", "risk"],
  },
  {
    key: "market-activity",
    label: { en: "Market activity", ar: "نشاط السوق" },
    description: {
      en: "Transactions and comparison pages for active pricing context.",
      ar: "صفحات المعاملات والمقارنة لسياق التسعير النشط.",
    },
    pages: ["transactions", "comparison"],
  },
  {
    key: "opportunity",
    label: { en: "Opportunity screen", ar: "فرز الفرص" },
    description: {
      en: "Opportunity page for top ranked candidates.",
      ar: "صفحة الفرص لأفضل المرشحين ترتيباً.",
    },
    pages: ["opportunity"],
  },
  {
    key: "memo",
    label: { en: "Investment memo", ar: "مذكرة استثمار" },
    description: {
      en: "Client-ready memo built from the current notebook context.",
      ar: "مذكرة جاهزة للعميل مبنية على سياق الدفتر الحالي.",
    },
    pages: ["memo"],
  },
]

const COPY = {
  en: {
    back: "Back to notebooks",
    accountBack: "Back to account notebooks",
    loading: "Opening notebook...",
    unauthorizedTitle: "Sign in to open this notebook",
    unauthorizedDescription: "Notebook pages and chat are only available inside an authenticated account session.",
    signIn: "Go to sign in",
    notFoundTitle: "Notebook not found",
    notFoundDescription: "This notebook is missing or no longer belongs to the current account.",
    titleFallback: "Untitled notebook",
    delete: "Delete notebook",
    deleting: "Deleting notebook...",
    deleteConfirm: "Delete this notebook? This cannot be undone.",
    type: "Type",
    pages: "Pages",
    feeds: "Feed items",
    updated: "Updated",
    generating: "Generating...",
    generatedPages: "Generated pages",
    generatedPagesDescription: "Open a page to review the stored output. Generate more pages when you need deeper coverage.",
    noPagesTitle: "This notebook has no generated pages yet",
    noPagesDescription: "A baseline overview and risk pass will start automatically. You can also trigger a specific generation below.",
    generationTitle: "Generate more",
    generationDescription: "These actions call the live notebook generator. Existing pages are refreshed in place.",
    chatTitle: "Notebook copilot",
    chatDescription: "Ask short follow-up questions using only the pages saved in this notebook.",
    chatPlaceholder: "Ask about the current notebook...",
    send: "Send",
    pageContentTitle: "Notebook page",
    pageContentDescription: "Stored output from the latest generation run.",
    noPageSelected: "Select a page to read the notebook output.",
    autoGenerating: "Generating the first notebook pages...",
    chatError: "Failed to send notebook question.",
    loadError: "Failed to load notebook.",
    generateError: "Failed to generate notebook pages.",
    deleteError: "Failed to delete notebook.",
    starterPrompt: "What is the single strongest conclusion from this notebook?",
  },
  ar: {
    back: "العودة إلى الدفاتر",
    accountBack: "العودة إلى دفاتر الحساب",
    loading: "جارٍ فتح الدفتر...",
    unauthorizedTitle: "سجل الدخول لفتح هذا الدفتر",
    unauthorizedDescription: "صفحات الدفتر والمحادثة متاحتان فقط داخل جلسة حساب موثقة.",
    signIn: "اذهب إلى تسجيل الدخول",
    notFoundTitle: "الدفتر غير موجود",
    notFoundDescription: "هذا الدفتر مفقود أو لم يعد تابعاً للحساب الحالي.",
    titleFallback: "دفتر بلا عنوان",
    delete: "حذف الدفتر",
    deleting: "جارٍ حذف الدفتر...",
    deleteConfirm: "هل تريد حذف هذا الدفتر؟ لا يمكن التراجع عن ذلك.",
    type: "النوع",
    pages: "الصفحات",
    feeds: "عناصر المتابعة",
    updated: "آخر تحديث",
    generating: "جارٍ التوليد...",
    generatedPages: "الصفحات المولدة",
    generatedPagesDescription: "افتح صفحة لمراجعة الناتج المحفوظ. وولّد صفحات إضافية عندما تحتاج إلى تغطية أعمق.",
    noPagesTitle: "لا توجد صفحات مولدة لهذا الدفتر بعد",
    noPagesDescription: "سيبدأ تلقائياً توليد النظرة العامة والمخاطر. ويمكنك أيضاً تشغيل توليد محدد من الأسفل.",
    generationTitle: "توليد إضافي",
    generationDescription: "هذه الإجراءات تستدعي مولد الدفاتر الحي. يتم تحديث الصفحات الموجودة في مكانها.",
    chatTitle: "مساعد الدفتر",
    chatDescription: "اطرح أسئلة قصيرة لاحقة باستخدام الصفحات المحفوظة داخل هذا الدفتر فقط.",
    chatPlaceholder: "اسأل عن الدفتر الحالي...",
    send: "إرسال",
    pageContentTitle: "صفحة الدفتر",
    pageContentDescription: "ناتج محفوظ من آخر تشغيل توليد.",
    noPageSelected: "اختر صفحة لقراءة ناتج الدفتر.",
    autoGenerating: "جارٍ توليد أول صفحات الدفتر...",
    chatError: "تعذر إرسال سؤال الدفتر.",
    loadError: "تعذر تحميل الدفتر.",
    generateError: "تعذر توليد صفحات الدفتر.",
    deleteError: "تعذر حذف الدفتر.",
    starterPrompt: "ما أقوى خلاصة واحدة في هذا الدفتر؟",
  },
} as const

function sortPages(pages: BookPage[]) {
  return [...pages].sort((left, right) => PAGE_ORDER.indexOf(left.type) - PAGE_ORDER.indexOf(right.type))
}

function mergePages(book: BookDetail, incomingPages: BookPage[]): BookDetail {
  const pageMap = new Map(book.pages.map((page) => [page.type, page]))

  for (const page of incomingPages) {
    pageMap.set(page.type, page)
  }

  const pages = sortPages(Array.from(pageMap.values()))
  return {
    ...book,
    pages,
    pageCount: pages.length,
    updatedAt: new Date().toISOString(),
  }
}

function formatDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

type NotebookDetailViewProps = {
  basePath?: string
  accountMode?: boolean
}

export function NotebookDetailView({
  basePath = "/notebook",
  accountMode = false,
}: NotebookDetailViewProps) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const isArabic = locale === "ar"
  const backHref = prefixLocalePath(basePath, locale)
  const currentNotebookPath = `${basePath}/${id}`

  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [generatingKey, setGeneratingKey] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [question, setQuestion] = useState("")
  const [sendingQuestion, setSendingQuestion] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const autoGenerateStarted = useRef(false)

  useEffect(() => {
    autoGenerateStarted.current = false
    setMessages([])
    setQuestion("")
    setSelectedPageId(null)
  }, [id])

  useEffect(() => {
    if (!id) return

    let active = true

    async function loadBook() {
      setLoading(true)
      setError(null)
      setUnauthorized(false)
      setNotFound(false)

      try {
        const response = await fetch(`/api/notebook/books/${id}`)
        const data = (await response.json().catch(() => ({}))) as {
          book?: BookDetail
          error?: string
        }

        if (!active) return

        if (response.status === 401) {
          setUnauthorized(true)
          setBook(null)
          return
        }

        if (response.status === 404) {
          setNotFound(true)
          setBook(null)
          return
        }

        if (!response.ok || !data.book) {
          throw new Error(data.error ?? copy.loadError)
        }

        const detail = {
          ...data.book,
          pages: sortPages(data.book.pages ?? []),
        }

        setBook(detail)
        setSelectedPageId((current) => current ?? detail.pages[0]?.id ?? null)
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : copy.loadError)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadBook()

    return () => {
      active = false
    }
  }, [id, copy.loadError])

  useEffect(() => {
    if (!book) return
    if (book.pages.length > 0) return
    if (autoGenerateStarted.current) return

    autoGenerateStarted.current = true
    void generatePages(["overview", "risk"], "bootstrap")
  }, [book])

  useEffect(() => {
    if (!book) return
    if (selectedPageId && book.pages.some((page) => page.id === selectedPageId)) return
    setSelectedPageId(book.pages[0]?.id ?? null)
  }, [book, selectedPageId])

  const selectedPage = book?.pages.find((page) => page.id === selectedPageId) ?? null

  async function generatePages(pageTypes: BookPageType[], key: string) {
    if (!id) return

    setGeneratingKey(key)
    setError(null)

    try {
      const response = await fetch(`/api/notebook/books/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: pageTypes }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        pages?: BookPage[]
        error?: string
      }

      if (response.status === 401) {
        setUnauthorized(true)
        return
      }

      if (!response.ok || !data.pages) {
        throw new Error(data.error ?? copy.generateError)
      }

      const nextPages = data.pages

      setBook((current) => {
        if (!current) return current
        return mergePages(current, nextPages)
      })
      setSelectedPageId((current) => current ?? nextPages[0]?.id ?? null)
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : copy.generateError)
    } finally {
      setGeneratingKey(null)
    }
  }

  async function handleDelete() {
    if (!book || deleting) return
    if (!window.confirm(copy.deleteConfirm)) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/notebook/books/${book.id}`, {
        method: "DELETE",
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        throw new Error(data.error ?? copy.deleteError)
      }

      router.push(backHref)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : copy.deleteError)
    } finally {
      setDeleting(false)
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || sendingQuestion || !book) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    }

    setMessages((current) => [...current, userMessage])
    setQuestion("")
    setSendingQuestion(true)
    setError(null)

    try {
      const response = await fetch(`/api/notebook/books/${book.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        reply?: string
        error?: string
      }

      if (!response.ok || !data.reply) {
        throw new Error(data.error ?? copy.chatError)
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.reply ?? copy.chatError,
        },
      ])
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : copy.chatError)
    } finally {
      setSendingQuestion(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
        <Navbar />
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4 pt-24 text-sm text-muted-foreground">
          <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          {copy.loading}
        </div>
        <Footer />
      </main>
    )
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
            <h1 className="mt-4 text-2xl font-semibold text-foreground">{copy.unauthorizedTitle}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {copy.unauthorizedDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={buildLoginHref(locale, currentNotebookPath)}>{copy.signIn}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={backHref}>{accountMode ? copy.accountBack : copy.back}</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (notFound || !book) {
    return (
      <main className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8">
            <NotebookPen className="h-8 w-8 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-semibold text-foreground">{copy.notFoundTitle}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {copy.notFoundDescription}
            </p>
            <Button asChild className="mt-6">
              <Link href={backHref}>{accountMode ? copy.accountBack : copy.back}</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main id="main-content" className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 md:pt-28">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:text-foreground">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              {accountMode ? copy.accountBack : copy.back}
            </Link>
          </Button>
        </div>

        <header className="mt-4 rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-3">
                {BOOK_TYPE_LABELS[book.type][locale]}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {book.title || copy.titleFallback}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                {book.subject}
              </p>
            </div>

            <Button variant="outline" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? copy.deleting : copy.delete}
            </Button>
          </div>

          {accountMode ? <AccountSectionNav active="notebooks" locale={locale} /> : null}
        </header>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.type}</dt>
            <dd className="mt-1 text-base font-semibold text-foreground">{BOOK_TYPE_LABELS[book.type][locale]}</dd>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.pages}</dt>
            <dd className="mt-1 text-base font-semibold text-foreground">{book.pageCount}</dd>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.feeds}</dt>
            <dd className="mt-1 text-base font-semibold text-foreground">{book.feedCount}</dd>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.updated}</dt>
            <dd className="mt-1 text-base font-semibold text-foreground">{formatDate(book.updatedAt, locale)}</dd>
          </div>
        </dl>

        {error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <BookCopy className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{copy.generatedPages}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {copy.generatedPagesDescription}
                  </p>
                </div>
              </div>

              {book.pages.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-border/70 bg-background/60 p-4">
                  <p className="text-sm font-medium text-foreground">{copy.noPagesTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {copy.noPagesDescription}
                  </p>
                  {generatingKey === "bootstrap" ? (
                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {copy.autoGenerating}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {book.pages.map((page) => {
                    const isActive = page.id === selectedPageId
                    return (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => setSelectedPageId(page.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background/60 hover:border-border/90"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-foreground">{page.title}</span>
                          <Badge variant={isActive ? "default" : "outline"}>{page.type}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(page.updatedAt, locale)}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{copy.generationTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {copy.generationDescription}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {PRESETS.map((preset) => {
                  const isGenerating = generatingKey === preset.key
                  return (
                    <div key={preset.key} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{preset.label[locale]}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {preset.description[locale]}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => generatePages(preset.pages, preset.key)}
                        disabled={Boolean(generatingKey)}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4" />
                        )}
                        {isGenerating ? copy.generating : preset.label[locale]}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </section>
          </aside>

          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <FileSearch className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{copy.pageContentTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {copy.pageContentDescription}
                  </p>
                </div>
              </div>

              {selectedPage ? (
                <div className="mt-5 rounded-3xl border border-border/70 bg-background/60 p-5">
                  <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{selectedPage.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(selectedPage.updatedAt, locale)}
                      </p>
                    </div>
                    <Badge variant="outline">{selectedPage.type}</Badge>
                  </div>
                  <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
                    {selectedPage.rawText || JSON.stringify(selectedPage.content, null, 2)}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-12 text-center text-sm text-muted-foreground">
                  {copy.noPageSelected}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <MessageSquareText className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{copy.chatTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.chatDescription}</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {messages.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setQuestion(copy.starterPrompt)}
                    className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-border hover:text-foreground"
                  >
                    {copy.starterPrompt}
                    <ArrowRight className="ml-2 inline h-4 w-4" />
                  </button>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "assistant"
                          ? "border border-border/70 bg-background/60 text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {message.text}
                    </div>
                  ))
                )}
              </div>

              <form className="mt-5 space-y-3" onSubmit={handleAsk}>
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={copy.chatPlaceholder}
                  rows={4}
                />
                <Button disabled={sendingQuestion || book.pages.length === 0}>
                  {sendingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {copy.send}
                </Button>
              </form>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default function NotebookDetailPage() {
  return <NotebookDetailView />
}

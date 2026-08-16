"use client"

import { type FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import {
  ArrowRight,
  BookOpen,
  Loader2,
  NotebookPen,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react"

import { AccountSectionNav } from "@/components/account/account-section-nav"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { buildLoginHref } from "@/lib/auth/navigation"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type BookType = "client" | "area" | "project" | "portfolio"

type BookSummary = {
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
}

type BooksResponse = {
  books: BookSummary[]
  error?: string
}

const COPY = {
  en: {
    eyebrow: "Research Workspace",
    accountEyebrow: "Account notebooks",
    title: "Research notebooks",
    description:
      "Create working notebooks for an area, project, client mandate, or portfolio. Each notebook generates real pages from the existing data tools and keeps the output in one place.",
    accountDescription:
      "This is the notebook area inside your account. Keep serious research threads here instead of scattering them across one-off chats.",
    formTitle: "Create a notebook",
    formDescription: "Start with a subject. The first overview and risk pages will be generated automatically.",
    titleLabel: "Notebook title",
    titlePlaceholder: "Dubai Marina entry review",
    subjectLabel: "Subject",
    subjectPlaceholder: "Dubai Marina vs JBR for near-term entry",
    typeLabel: "Notebook type",
    create: "Create notebook",
    creating: "Creating notebook...",
    libraryTitle: "Your notebook library",
    libraryDescription: "Open an existing notebook, continue generation, or remove stale drafts.",
    loading: "Loading notebooks...",
    emptyTitle: "No notebooks yet",
    emptyDescription: "Create the first notebook from this account workspace and it will open directly into the working view.",
    unauthorizedTitle: "Sign in to use notebooks",
    unauthorizedDescription: "Notebook creation and history are tied to your account session.",
    signIn: "Go to sign in",
    open: "Open",
    delete: "Delete",
    deleting: "Deleting...",
    pages: "Pages",
    feeds: "Feed items",
    updated: "Updated",
    launchChat: "Open decision terminal",
    launchChatDescription: "Use the terminal when you need a fresh live query before committing it to a notebook.",
    createError: "Failed to create notebook.",
    loadError: "Failed to load notebooks.",
    deleteError: "Failed to delete notebook.",
    deleteConfirm: "Delete this notebook? This cannot be undone.",
  },
  ar: {
    eyebrow: "مساحة البحث",
    accountEyebrow: "دفاتر الحساب",
    title: "دفاتر البحث",
    description:
      "أنشئ دفتراً عملياً لمنطقة أو مشروع أو تفويض عميل أو محفظة. كل دفتر يولد صفحات حقيقية من أدوات البيانات الحالية ويحفظ الناتج في مكان واحد.",
    accountDescription:
      "هذا هو قسم الدفاتر داخل حسابك. احتفظ فيه بخيوط البحث الجدية بدلاً من بعثرة العمل بين جلسات منفصلة.",
    formTitle: "إنشاء دفتر",
    formDescription: "ابدأ بموضوع واضح. سيتم توليد صفحتي النظرة العامة والمخاطر تلقائياً.",
    titleLabel: "عنوان الدفتر",
    titlePlaceholder: "مراجعة الدخول إلى دبي مارينا",
    subjectLabel: "الموضوع",
    subjectPlaceholder: "دبي مارينا مقابل جميرا بيتش ريزيدنس للدخول القريب",
    typeLabel: "نوع الدفتر",
    create: "إنشاء دفتر",
    creating: "جارٍ إنشاء الدفتر...",
    libraryTitle: "مكتبة الدفاتر",
    libraryDescription: "افتح دفتراً موجوداً، واصل التوليد، أو احذف المسودات القديمة.",
    loading: "جارٍ تحميل الدفاتر...",
    emptyTitle: "لا توجد دفاتر بعد",
    emptyDescription: "أنشئ أول دفتر من مساحة الحساب هذه وسيفتح مباشرة في الواجهة العملية.",
    unauthorizedTitle: "سجل الدخول لاستخدام الدفاتر",
    unauthorizedDescription: "إنشاء الدفاتر وسجلها مرتبطان بجلسة حسابك.",
    signIn: "اذهب إلى تسجيل الدخول",
    open: "فتح",
    delete: "حذف",
    deleting: "جارٍ الحذف...",
    pages: "الصفحات",
    feeds: "عناصر المتابعة",
    updated: "آخر تحديث",
    launchChat: "افتح محطة القرار",
    launchChatDescription: "استخدم المحطة عندما تحتاج إلى استعلام حي جديد قبل تثبيته في دفتر.",
    createError: "تعذر إنشاء الدفتر.",
    loadError: "تعذر تحميل الدفاتر.",
    deleteError: "تعذر حذف الدفتر.",
    deleteConfirm: "هل تريد حذف هذا الدفتر؟ لا يمكن التراجع عن ذلك.",
  },
} as const

const BOOK_TYPE_OPTIONS: { value: BookType; label: { en: string; ar: string } }[] = [
  { value: "area", label: { en: "Area", ar: "منطقة" } },
  { value: "project", label: { en: "Project", ar: "مشروع" } },
  { value: "client", label: { en: "Client", ar: "عميل" } },
  { value: "portfolio", label: { en: "Portfolio", ar: "محفظة" } },
]

function formatDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

type NotebookLibraryViewProps = {
  basePath?: string
  accountMode?: boolean
}

export function NotebookLibraryView({
  basePath = "/notebook",
  accountMode = false,
}: NotebookLibraryViewProps) {
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const isArabic = locale === "ar"

  const [books, setBooks] = useState<BookSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    subject: "",
    type: "area" as BookType,
  })

  useEffect(() => {
    let active = true

    async function loadBooks() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/notebook/books")
        const data = (await response.json().catch(() => ({}))) as BooksResponse

        if (!active) return

        if (response.status === 401) {
          setUnauthorized(true)
          setBooks([])
          return
        }

        if (!response.ok) {
          throw new Error(data.error ?? copy.loadError)
        }

        setUnauthorized(false)
        setBooks(data.books ?? [])
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : copy.loadError)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadBooks()

    return () => {
      active = false
    }
  }, [copy.loadError])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creating || unauthorized) return

    setCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/notebook/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await response.json().catch(() => ({}))) as {
        book?: BookSummary
        error?: string
      }

      if (response.status === 401) {
        setUnauthorized(true)
        return
      }

      if (!response.ok || !data.book) {
        throw new Error(data.error ?? copy.createError)
      }

      router.push(prefixLocalePath(`${basePath}/${data.book.id}`, locale))
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : copy.createError)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(bookId: string) {
    if (deletingId) return
    if (!window.confirm(copy.deleteConfirm)) return

    setDeletingId(bookId)
    setError(null)

    try {
      const response = await fetch(`/api/notebook/books/${bookId}`, {
        method: "DELETE",
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error ?? copy.deleteError)
      }

      setBooks((current) => current.filter((book) => book.id !== bookId))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : copy.deleteError)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 md:pt-28">
        <header className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {accountMode ? copy.accountEyebrow : copy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            {accountMode ? copy.accountDescription : copy.description}
          </p>

          {accountMode ? <AccountSectionNav active="notebooks" locale={locale} /> : null}
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px,minmax(0,1fr)]">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                <NotebookPen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{copy.formTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {copy.formDescription}
                </p>
              </div>
            </div>

            {unauthorized ? (
              <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{copy.unauthorizedTitle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {copy.unauthorizedDescription}
                    </p>
                    <Button asChild className="mt-4">
                      <Link href={buildLoginHref(locale, basePath)}>{copy.signIn}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notebook-title">
                    {copy.titleLabel}
                  </label>
                  <Input
                    id="notebook-title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder={copy.titlePlaceholder}
                    required
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notebook-subject">
                    {copy.subjectLabel}
                  </label>
                  <Textarea
                    id="notebook-subject"
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    placeholder={copy.subjectPlaceholder}
                    required
                    maxLength={500}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="notebook-type">
                    {copy.typeLabel}
                  </label>
                  <select
                    id="notebook-type"
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, type: event.target.value as BookType }))
                    }
                    className="border-input dark:bg-input/30 h-10 w-full rounded-md border bg-transparent px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    {BOOK_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label[locale]}
                      </option>
                    ))}
                  </select>
                </div>

                <Button className="w-full" disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {creating ? copy.creating : copy.create}
                </Button>
              </form>
            )}

            <div className="mt-6 rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-medium text-foreground">{copy.launchChat}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {copy.launchChatDescription}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <CopilotEntryLink>
                  {copy.launchChat}
                  <ArrowRight className="h-4 w-4" />
                </CopilotEntryLink>
              </Button>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{copy.libraryTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {copy.libraryDescription}
                </p>
              </div>
              {!loading && !unauthorized ? (
                <Badge variant="outline" className="text-xs">{books.length}</Badge>
              ) : null}
            </div>

            {loading ? (
              <div className="mt-10 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.loading}
              </div>
            ) : null}

            {!loading && !unauthorized && books.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-12 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">{copy.emptyTitle}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {copy.emptyDescription}
                </p>
              </div>
            ) : null}

            {!loading && !unauthorized && books.length > 0 ? (
              <div className="mt-6 space-y-4">
                {books.map((book) => (
                  <article
                    key={book.id}
                    className="rounded-3xl border border-border/70 bg-background/60 p-5 transition hover:border-border"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Badge variant="outline">{BOOK_TYPE_OPTIONS.find((option) => option.value === book.type)?.label[locale]}</Badge>
                        <h3 className="mt-3 text-lg font-semibold text-foreground">{book.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{book.subject}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={prefixLocalePath(`${basePath}/${book.id}`, locale)}>
                            {copy.open}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(book.id)}
                          disabled={deletingId === book.id}
                          aria-label={copy.delete}
                        >
                          {deletingId === book.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                        <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {copy.pages}
                        </dt>
                        <dd className="mt-1 text-base font-semibold text-foreground">{book.pageCount}</dd>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                        <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {copy.feeds}
                        </dt>
                        <dd className="mt-1 text-base font-semibold text-foreground">{book.feedCount}</dd>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                        <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {copy.updated}
                        </dt>
                        <dd className="mt-1 text-base font-semibold text-foreground">
                          {formatDate(book.updatedAt, locale)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default function NotebookPage() {
  return <NotebookLibraryView />
}

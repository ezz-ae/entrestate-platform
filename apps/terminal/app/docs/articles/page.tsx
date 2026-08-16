import Link from "next/link"
import { ArrowRight, BookMarked } from "lucide-react"
import { getLocalizedArticleCategories, getLocalizedDocsArticles } from "@/lib/docs-articles"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export default async function DocsArticlesPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const articles = getLocalizedDocsArticles(locale)
  const articleCategories = getLocalizedArticleCategories(locale)

  const copy = {
    eyebrow: isArabic ? "وثائق المنصة / المقالات" : "Platform Docs / Articles",
    title: isArabic ? "مقالات المنصة" : "Mind Map Articles",
    intro: isArabic
      ? "مجموعة مقالات تشرح وحدات المنصة ومسارات العمل والمفاهيم الأساسية للشركاء والمشغلين والمستثمرين."
      : "Every node in the Entrestate mind map is represented as an individual article for partner, operator, and investor-level reading.",
    readArticle: isArabic ? "قراءة المقال" : "Read article",
  }

  return (
    <>
      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          {copy.intro}
        </p>
      </header>

      <section className="space-y-6">
        {articleCategories.map((category) => {
          const categoryArticles = articles.filter((article) => article.category === category)
          return (
            <article key={category} className="rounded-2xl border border-border/70 bg-card/70 p-6">
              <div className="flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-accent" />
                <h2 className="text-xl font-semibold text-foreground">{category}</h2>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {categoryArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={prefixLocalePath(`/docs/articles/${article.slug}`, locale)}
                    className="rounded-lg border border-border/60 bg-background/40 p-4 hover:border-accent/40"
                  >
                    <h3 className="text-sm font-semibold text-foreground">{article.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{article.summary}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                      {copy.readArticle}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}

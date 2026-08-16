import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CircleCheck } from "lucide-react"
import { docsArticles, getLocalizedArticleBySlug } from "@/lib/docs-articles"
import { SEO, absoluteUrl } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return docsArticles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const article = getLocalizedArticleBySlug(slug, locale)

  if (!article) {
    return {
      title: "Article Not Found - Entrestate Docs",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const url = `/docs/articles/${article.slug}`

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${article.title} | ${SEO.siteName} Docs`,
      description: article.summary,
      url,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | ${SEO.siteName} Docs`,
      description: article.summary,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
  }
}

export default async function DocsArticlePage({ params }: Props) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const article = getLocalizedArticleBySlug(slug, locale)

  if (!article) {
    notFound()
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    mainEntityOfPage: absoluteUrl(`/docs/articles/${article.slug}`),
    author: {
      "@type": "Organization",
      name: SEO.siteName,
    },
    publisher: {
      "@type": "Organization",
      name: SEO.siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.svg"),
      },
    },
  }

  const copy = {
    back: isArabic ? "العودة إلى المقالات" : "Back to articles",
    scope: isArabic ? "النطاق" : "Scope",
    execution: isArabic ? "التنفيذ" : "Execution",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Link href={prefixLocalePath("/docs/articles", locale)} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {copy.back}
      </Link>

      <header className="mb-6 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{article.category}</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">{article.title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{article.summary}</p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.scope}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {article.scope.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CircleCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.execution}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {article.execution.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CircleCheck className="mt-0.5 h-4 w-4 text-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  )
}

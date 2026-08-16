import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getLibraryArticle, libraryArticles } from "@/lib/library-data"
import { ReadingControls } from "@/components/reading-controls"
import { ExplainWithChat } from "@/components/explain-with-chat"
import { SEO, absoluteUrl } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export async function generateStaticParams() {
  return libraryArticles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const { slug } = await params
  const article = getLibraryArticle(slug)

  if (!article) {
    return {
      title: isArabic ? "المقال غير موجود" : "Library Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const url = `/library/${article.slug}`
  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${article.title} | ${SEO.siteName}`,
      description: article.description,
      url,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | ${SEO.siteName}`,
      description: article.description,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
  }
}

export default async function LibraryArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const { slug } = await params
  const article = getLibraryArticle(slug)

  if (!article) {
    notFound()
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    mainEntityOfPage: absoluteUrl(`/library/${article.slug}`),
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

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <Link
            href={prefixLocalePath("/library", locale)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {isArabic ? "العودة إلى المكتبة" : "Back to Library"}
          </Link>

          <div className="max-w-3xl reading-container">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                {article.tag}
              </span>
              <span>{article.date}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance mb-6">
              {article.title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
              {article.description}
            </p>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 mb-8">
              <ReadingControls />
              <div className="mt-3 flex flex-wrap gap-2">
                <ExplainWithChat prompt={isArabic ? `اشرح التقرير "${article.title}" وما أهم النقاط التي يجب فهمها قبل اتخاذ القرار.` : `Explain the report "${article.title}" and the key takeaways.`} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {isArabic ? "فعّل وضع القراءة لعرض أهدأ، وبدّل بين النهاري والليلي لراحة العين." : "Use Reading mode for calmer spacing. Switch Day/Night for eye comfort."}
              </p>
            </div>

            <div className="prose dark:prose-invert max-w-none reading-copy">
              {article.content.split("\n\n").map((block) => (
                <p key={block} className="text-base text-foreground/90 leading-relaxed">
                  {block}
                </p>
              ))}
            </div>

            <div className="mt-12">
              <Link
                href={prefixLocalePath("/workspace", locale)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {isArabic ? "افتح مساحة العمل" : "Open Workspace"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

import type React from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GridBackground } from "@/components/grid-background"
import { ScrollToTop } from "@/components/scroll-to-top"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, Share2, Twitter, Linkedin } from "lucide-react"
import { getBlogPost, blogPosts } from "@/lib/blog-data"
import { SyntaxHighlighter } from "@/lib/syntax-highlighter"
import { SEO, absoluteUrl } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { formatDate } from "@/lib/format/date"

const CATEGORY_LABELS: Record<string, string> = {
  Strategy: "الاستراتيجية",
  Operations: "التشغيل",
  Systems: "الأنظمة",
  Economics: "الاقتصاد",
  Data: "البيانات",
  Marketing: "التسويق",
}

function categoryLabel(category: string, locale: AppLocale) {
  if (locale !== "ar") return category
  return CATEGORY_LABELS[category] ?? category
}

function localizeReadTime(value: string, locale: AppLocale) {
  if (locale !== "ar") return value
  const minutes = Number.parseInt(value, 10)
  return Number.isFinite(minutes) ? `${minutes} دقائق` : value
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const locale = await getRequestLocale()
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    return {
      title: locale === "ar" ? "المقال غير موجود" : "Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const url = prefixLocalePath(`/blog/${post.slug}`, locale)

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title: `${post.title} | ${SEO.siteName}`,
      description: post.excerpt,
      images: [absoluteUrl(post.coverImage || SEO.defaultOgImagePath)],
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | ${SEO.siteName}`,
      description: post.excerpt,
      images: [absoluteUrl(post.coverImage || SEO.defaultOgImagePath)],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = (await getRequestLocale()) as AppLocale
  const isArabic = locale === "ar"
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    notFound()
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://entrestate.ai"
  const articlePath = prefixLocalePath(`/blog/${post.slug}`, locale)
  const articleUrl = `${siteUrl}${articlePath}`
  const shareText = encodeURIComponent(post.title)
  const encodedUrl = encodeURIComponent(articleUrl)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  const mailtoUrl = `mailto:?subject=${shareText}&body=${encodedUrl}`
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    image: absoluteUrl(post.coverImage || SEO.defaultOgImagePath),
    mainEntityOfPage: articleUrl,
    publisher: {
      "@type": "Organization",
      name: SEO.siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.svg"),
      },
    },
  }

  const renderContent = (content: string) => {
    const lines = content.trim().split("\n")
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeContent = ""
    let codeLanguage = ""
    let listItems: React.ReactNode[] = []
    let listType: "ul" | "ol" | null = null

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const ListTag = listType
        elements.push(
          <ListTag
            key={`list-${elements.length}`}
            className={`${listType === "ul" ? "list-disc" : "list-decimal"} pl-6 mb-6 space-y-2 text-muted-foreground`}
          >
            {listItems}
          </ListTag>,
        )
        listItems = []
        listType = null
      }
    }

    const renderInlineFormatting = (text: string, keyPrefix: string) => {
      // Handle bold, inline code, and links
      const parts: React.ReactNode[] = []
      let remaining = text
      let partIndex = 0

      while (remaining.length > 0) {
        // Check for inline code first
        const codeMatch = remaining.match(/^`([^`]+)`/)
        if (codeMatch) {
          parts.push(
            <code
              key={`${keyPrefix}-code-${partIndex}`}
              className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono"
            >
              {codeMatch[1]}
            </code>,
          )
          remaining = remaining.slice(codeMatch[0].length)
          partIndex++
          continue
        }

        // Check for bold
        const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
        if (boldMatch) {
          parts.push(
            <strong key={`${keyPrefix}-bold-${partIndex}`} className="text-foreground font-semibold">
              {boldMatch[1]}
            </strong>,
          )
          remaining = remaining.slice(boldMatch[0].length)
          partIndex++
          continue
        }

        // Find next special character or end of string
        const nextSpecial = remaining.search(/`|\*\*/)
        if (nextSpecial === -1) {
          parts.push(remaining)
          break
        } else if (nextSpecial > 0) {
          parts.push(remaining.slice(0, nextSpecial))
          remaining = remaining.slice(nextSpecial)
          partIndex++
        } else {
          // Edge case: special char at start but didn't match pattern
          parts.push(remaining[0])
          remaining = remaining.slice(1)
          partIndex++
        }
      }

      return parts
    }

    lines.forEach((line, index) => {
      // Code block handling
      if (line.startsWith("```")) {
        flushList()
        if (!inCodeBlock) {
          inCodeBlock = true
          codeLanguage = line.slice(3).trim()
          codeContent = ""
        } else {
          const isJS = ["javascript", "js", "typescript", "ts", "jsx", "tsx"].includes(codeLanguage.toLowerCase())
          elements.push(
            <div key={index} className="my-6 rounded-lg overflow-hidden border border-border">
              {codeLanguage && (
                <div className="bg-surface-elevated px-4 py-2 border-b border-border">
                  <span className="text-xs font-mono text-muted-foreground uppercase">{codeLanguage}</span>
                </div>
              )}
              <div className="bg-surface-dark p-4 overflow-x-auto">
                {isJS ? (
                  <SyntaxHighlighter code={codeContent.trim()} language={codeLanguage} />
                ) : (
                  <pre className="font-mono text-sm">
                    <code className="text-foreground">{codeContent.trim()}</code>
                  </pre>
                )}
              </div>
            </div>,
          )
          inCodeBlock = false
        }
        return
      }

      if (inCodeBlock) {
        codeContent += line + "\n"
        return
      }

      // Headers
      if (line.startsWith("# ")) {
        flushList()
        elements.push(
          <h1 key={index} className="text-3xl md:text-4xl font-bold text-foreground mt-12 mb-6 first:mt-0">
            {line.slice(2)}
          </h1>,
        )
        return
      }
      if (line.startsWith("## ")) {
        flushList()
        elements.push(
          <h2 key={index} className="text-2xl md:text-3xl font-bold text-foreground mt-10 mb-4">
            {line.slice(3)}
          </h2>,
        )
        return
      }
      if (line.startsWith("### ")) {
        flushList()
        elements.push(
          <h3 key={index} className="text-xl md:text-2xl font-semibold text-foreground mt-8 mb-3">
            {line.slice(4)}
          </h3>,
        )
        return
      }

      // Unordered list items
      if (line.startsWith("- ")) {
        if (listType !== "ul") {
          flushList()
          listType = "ul"
        }
        listItems.push(
          <li key={index} className="leading-relaxed">
            {renderInlineFormatting(line.slice(2), `li-${index}`)}
          </li>,
        )
        return
      }

      // Ordered list items
      if (/^\d+\.\s/.test(line)) {
        if (listType !== "ol") {
          flushList()
          listType = "ol"
        }
        listItems.push(
          <li key={index} className="leading-relaxed">
            {renderInlineFormatting(line.replace(/^\d+\.\s/, ""), `li-${index}`)}
          </li>,
        )
        return
      }

      // Empty line
      if (!line.trim()) {
        flushList()
        return
      }

      // Regular paragraph
      flushList()
      elements.push(
        <p key={index} className="text-muted-foreground text-lg leading-relaxed mb-6">
          {renderInlineFormatting(line, `p-${index}`)}
        </p>,
      )
    })

    // Flush any remaining list
    flushList()

    return elements
  }

  // Get related posts (same category, excluding current)
  const relatedPosts = blogPosts.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 2)

  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <GridBackground />
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <main id="main-content" className="relative z-10 pt-32 pb-20">
        <article className="container mx-auto px-6 max-w-4xl">
          {/* Back link */}
          <Link
            href={prefixLocalePath("/blog", locale)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {isArabic ? "العودة إلى المقالات" : "Back to Blog"}
          </Link>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="border-primary/30 text-primary">
                {categoryLabel(post.category, locale)}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt, locale, { month: "long", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {localizeReadTime(post.readTime, locale)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">{post.title}</h1>
            <p className="text-xl text-muted-foreground">{post.excerpt}</p>
          </header>

          {/* Author & Share */}
          <div className="flex items-center justify-between mb-10 pb-10 border-b border-border">
            <div className="flex items-center gap-4">
              <Image
                src={post.author.avatar || "/avatars/avatar-01.svg"}
                alt={post.author.name}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <p className="font-medium text-foreground">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">{post.author.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="icon" className="h-9 w-9 bg-transparent" aria-label={isArabic ? "مشاركة عبر X" : "Share on Twitter"}>
                <Link href={twitterUrl} target="_blank" rel="noreferrer">
                  <Twitter className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="icon" className="h-9 w-9 bg-transparent" aria-label={isArabic ? "مشاركة عبر LinkedIn" : "Share on LinkedIn"}>
                <Link href={linkedinUrl} target="_blank" rel="noreferrer">
                  <Linkedin className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="icon" className="h-9 w-9 bg-transparent" aria-label={isArabic ? "مشاركة المقال" : "Share article"}>
                <Link href={mailtoUrl}>
                  <Share2 className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Cover Image */}
          <div className="relative aspect-[21/9] mb-12 rounded-xl overflow-hidden">
            <Image
              src={post.coverImage || "/covers/cover-01.svg"}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Content */}
          <div>{renderContent(post.content)}</div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-16 border-t border-border">
              <h2 className="text-2xl font-bold text-foreground mb-8">{isArabic ? "مقالات ذات صلة" : "Related Articles"}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {relatedPosts.map((related) => (
                  <Link key={related.slug} href={prefixLocalePath(`/blog/${related.slug}`, locale)} className="group">
                    <div className="bg-surface-elevated border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
                      <div className="relative aspect-[16/9]">
                        <Image
                          src={related.coverImage || "/covers/cover-01.svg"}
                          alt={related.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {related.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">{localizeReadTime(related.readTime, locale)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  )
}

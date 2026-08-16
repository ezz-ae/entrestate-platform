"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GridBackground } from "@/components/grid-background"
import { ScrollToTop } from "@/components/scroll-to-top"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Calendar, Clock } from "lucide-react"
import { blogPosts, categories, getFeaturedPost } from "@/lib/blog-data"
import { getDateLocale } from "@/lib/format/locale"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

const CATEGORY_LABELS: Record<string, string> = {
  All: "الكل",
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

function formatPublishedDate(value: string, locale: AppLocale, withYear = false) {
  return new Intl.DateTimeFormat(getDateLocale(locale), {
    month: withYear ? "long" : "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(new Date(value))
}

export function BlogIndexPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const [activeCategory, setActiveCategory] = useState("All")
  const featuredPost = getFeaturedPost()

  const filteredPosts = useMemo(
    () =>
      activeCategory === "All"
        ? blogPosts.filter((post) => !post.featured)
        : blogPosts.filter((post) => post.category === activeCategory && !post.featured),
    [activeCategory],
  )

  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <GridBackground />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle 800px at 50% -200px, rgba(34, 94, 223, 0.15), transparent 70%)",
        }}
      />
      <Navbar />

      <main id="main-content" className="relative z-10 pb-20 pt-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              {isArabic ? "مقالات المنصة" : "Blog"}
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              {isArabic ? "قراءات ومتابعات من داخل السوق" : "Insights & Updates"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {isArabic
                ? "هنا نكتب ما يهم فريق القرار: السوق، التشغيل، وبناء المنتج من الداخل."
                : "Real estate strategy, market evidence, and execution insights from the Entrestate team."}
            </p>
          </div>

          {featuredPost ? (
            <Link href={prefixLocalePath(`/blog/${featuredPost.slug}`, locale)} className="group mb-16 block">
              <Card className="overflow-hidden border-border bg-surface-elevated transition-colors hover:border-primary/30">
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="relative aspect-[16/10] md:aspect-auto">
                    <Image src={featuredPost.coverImage || "/covers/cover-01.svg"} alt={featuredPost.title} fill priority className="object-cover" />
                    <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent to-surface-elevated/80 md:block" />
                  </div>
                  <div className="flex flex-col justify-center p-8 md:p-10">
                    <div className="mb-4 flex items-center gap-3">
                      <Badge className="border-0 bg-primary/10 text-primary">{isArabic ? "مقالة مختارة" : "Featured"}</Badge>
                      <Badge variant="outline" className="border-border">
                        {categoryLabel(featuredPost.category, locale)}
                      </Badge>
                    </div>
                    <h2 className="mb-3 text-2xl font-bold text-foreground transition-colors group-hover:text-primary md:text-3xl">
                      {featuredPost.title}
                    </h2>
                    <p className="mb-6 line-clamp-2 text-muted-foreground">{featuredPost.excerpt}</p>
                    <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatPublishedDate(featuredPost.publishedAt, locale, true)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {localizeReadTime(featuredPost.readTime, locale)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Image src={featuredPost.author.avatar || "/avatars/avatar-01.svg"} alt={featuredPost.author.name} width={40} height={40} className="rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{featuredPost.author.name}</p>
                        <p className="text-xs text-muted-foreground">{featuredPost.author.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ) : null}

          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {categoryLabel(category, locale)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link key={post.slug} href={prefixLocalePath(`/blog/${post.slug}`, locale)} className="group">
                <Card className="h-full overflow-hidden border-border bg-surface-elevated transition-colors hover:border-primary/30">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image src={post.coverImage || "/covers/cover-01.svg"} alt={post.title} fill loading="lazy" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline" className="border-border text-xs">
                        {categoryLabel(post.category, locale)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{localizeReadTime(post.readTime, locale)}</span>
                    </div>
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image src={post.author.avatar || "/avatars/avatar-01.svg"} alt={post.author.name} width={28} height={28} className="rounded-full" />
                        <span className="text-xs text-muted-foreground">{post.author.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatPublishedDate(post.publishedAt, locale)}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">{isArabic ? "لا توجد مقالات ضمن هذا التصنيف الآن." : "No posts found in this category."}</p>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  )
}

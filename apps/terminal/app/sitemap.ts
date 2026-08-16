import type { MetadataRoute } from "next"
import { blogPosts } from "@/lib/blog-data"
import { listAreas, listDevelopers, listPropertySlugs } from "@/lib/decision-infrastructure"
import { docsArticles } from "@/lib/docs-articles"
import { libraryArticles } from "@/lib/library-data"
import { getSiteUrl } from "@/lib/seo"
import { locales, prefixLocalePath } from "@/i18n/locale"

const baseUrl = getSiteUrl()

const staticRoutes = [
  "",
  "/about",
  "/contact",
  "/support",
  "/status",
  "/changelog",
  "/roadmap",
  "/privacy",
  "/terms",
  "/cookies",
  "/data-usage",
  "/overview",
  "/chat",
  "/search",
  "/map",
  "/market-score",
  "/top-data",
  "/areas",
  "/developers",
  "/properties",
  "/infrastructure",
  "/enterprise",
  "/markets",
  "/reports/library",
  "/library",
  "/library/reports",
  "/library/insights",
  "/library/contracts-explained",
  "/blog",
  "/docs",
  "/docs/articles",
  "/docs/documentation",
  "/docs/partners-apis",
  "/docs/data-information",
  "/docs/industry",
  "/docs/careers-intern",
  "/docs/investors-relations",
  "/investor-relations",
  "/careers",
  "/media",
  "/pricing",
]

function buildAlternates(path: string) {
  return {
    languages: Object.fromEntries([
      ...locales.map((locale) => [locale, `${baseUrl}${prefixLocalePath(path || "/", locale)}`]),
      ...locales.map((locale) => [locale === "ar" ? "ar-AE" : "en-AE", `${baseUrl}${prefixLocalePath(path || "/", locale)}`]),
      ["x-default", `${baseUrl}${prefixLocalePath(path || "/", locales[0])}`],
    ]),
  }
}

function buildEntry(
  path: string,
  locale: (typeof locales)[number],
  lastModified: Date,
  options?: Partial<MetadataRoute.Sitemap[number]>,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${baseUrl}${prefixLocalePath(path || "/", locale)}`,
    lastModified,
    changeFrequency: options?.changeFrequency ?? "weekly",
    priority: options?.priority ?? 0.7,
    alternates: buildAlternates(path),
    ...options,
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const [propertySlugs, areaData, developerData] = await Promise.all([
    listPropertySlugs().catch(() => []),
    listAreas().catch(() => ({ areas: [] })),
    listDevelopers().catch(() => ({ developers: [] })),
  ])

  const staticEntries = locales.flatMap((locale) =>
    staticRoutes.map((route) =>
      buildEntry(route, locale, lastModified, {
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.7,
      }),
    ),
  )

  const blogEntries = locales.flatMap((locale) =>
    blogPosts.map((post) =>
      buildEntry(`/blog/${post.slug}`, locale, new Date(post.publishedAt), {
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }),
    ),
  )

  const docsArticleEntries = locales.flatMap((locale) =>
    docsArticles.map((article) =>
      buildEntry(`/docs/articles/${article.slug}`, locale, lastModified, {
        changeFrequency: "monthly" as const,
        priority: 0.75,
      }),
    ),
  )

  const libraryEntries = locales.flatMap((locale) =>
    libraryArticles.map((article) =>
      buildEntry(`/library/${article.slug}`, locale, lastModified, {
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }),
    ),
  )

  const propertyEntries = locales.flatMap((locale) =>
    propertySlugs.map((slug) =>
      buildEntry(`/properties/${slug}`, locale, lastModified, {
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }),
    ),
  )

  const areaEntries = locales.flatMap((locale) =>
    areaData.areas.map((area) =>
      buildEntry(`/areas/${String(area.slug)}`, locale, lastModified, {
        changeFrequency: "weekly" as const,
        priority: 0.72,
      }),
    ),
  )

  const developerEntries = locales.flatMap((locale) =>
    developerData.developers.map((developer) =>
      buildEntry(`/developers/${String(developer.slug)}`, locale, lastModified, {
        changeFrequency: "weekly" as const,
        priority: 0.72,
      }),
    ),
  )

  return [
    ...staticEntries,
    ...blogEntries,
    ...docsArticleEntries,
    ...libraryEntries,
    ...propertyEntries,
    ...areaEntries,
    ...developerEntries,
  ]
}

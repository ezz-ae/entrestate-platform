import { absoluteUrl } from "@/lib/seo"
import { SITE } from "@/lib/seo/metadata"
import type { AppLocale } from "@/i18n/locale"

export function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/icon.svg"),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@entrestate.com",
        availableLanguage: ["en", "ar"],
        areaServed: ["AE"],
      },
    ],
  }
}

export function websiteSchema(locale: AppLocale = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}#website`,
    name: SITE.name,
    url: SITE.url,
    inLanguage: ["en-AE", "ar-AE"],
    publisher: { "@id": `${SITE.url}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export type BreadcrumbItem = {
  name: string
  href: string
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${SITE.url}${item.href}`,
    })),
  }
}

export type RealEstateListingInput = {
  name: string
  url: string
  description: string
  developer?: string | null
  area?: string | null
  priceMin?: number | null
  priceMax?: number | null
  currency?: "AED" | "USD" | "SAR"
  bedrooms?: number[]
  completionYear?: number | null
  image?: string | null
}

export function realEstateListingSchema(input: RealEstateListingInput) {
  const offers =
    input.priceMin || input.priceMax
      ? {
          "@type": "AggregateOffer",
          priceCurrency: input.currency ?? "AED",
          ...(input.priceMin ? { lowPrice: input.priceMin } : {}),
          ...(input.priceMax ? { highPrice: input.priceMax } : {}),
        }
      : undefined

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: input.name,
    url: input.url,
    description: input.description,
    image: input.image ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
      addressLocality: input.area ?? undefined,
    },
    ...(input.developer
      ? {
          developer: {
            "@type": "Organization",
            name: input.developer,
          },
        }
      : {}),
    ...(offers ? { offers } : {}),
    ...(input.bedrooms && input.bedrooms.length > 0
      ? {
          numberOfRooms: {
            "@type": "QuantitativeValue",
            minValue: Math.min(...input.bedrooms),
            maxValue: Math.max(...input.bedrooms),
          },
        }
      : {}),
    ...(input.completionYear ? { datePosted: `${input.completionYear}-01-01` } : {}),
  }
}

export function faqSchema(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  }
}

export function productSchema(input: {
  name: string
  description: string
  url: string
  price: number
  currency?: "AED" | "USD" | "SAR"
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: input.url,
    brand: {
      "@type": "Brand",
      name: SITE.name,
    },
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.currency ?? "AED",
      url: input.url,
      availability: "https://schema.org/InStock",
    },
  }
}

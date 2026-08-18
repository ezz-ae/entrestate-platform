import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono, Playfair_Display, Cairo } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { WhatsAppFloat } from "@/components/whatsapp-float"
import { BRAND_OG_IMAGE, getMetadataBase, getSiteUrl } from "@/lib/site"
import { BRAND } from "@/lib/freehold/brand"
import { BrandProvider } from "@/components/whitelabel/brand-provider"
import { getWorkspaceBrand } from "@/lib/whitelabel/server"
import { notFound } from "next/navigation"
import { getTenantBrand, isUnknownTenantHost } from "@/lib/tenancy/server"
import "./globals.css"

export const dynamic = "force-dynamic"

// Cyrillic is not optional on a product that ships Russian: without it every
// RU screen renders in whatever the reader's OS supplies, which is the same
// defect the comment below already names for Arabic — stated for exported ads
// and never applied to the product itself.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  preload: false,
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
  preload: false,
})

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-serif",
  preload: false,
})

// Cairo — the Arabic face, for the AD ENGINE and now for the UI too: it is
// appended to the --font-sans stack in globals.css, so an Arabic screen
// renders in a font we chose rather than one the device happened to have.
// Canvas text falls back to whatever
// Arabic font happens to be installed on the machine doing the rendering,
// which makes an exported ad look different for every agent. Loading a real
// webfont and composing only after it is ready makes the pixels deterministic.
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-ad-ar",
  preload: false,
})

const siteUrl = getSiteUrl()

// Public-facing brand name. The env-driven BRAND is the VENDOR's, baked at
// build time and identical for every host — so as a metadata source it put the
// vendor's name in the browser tab, the search result and the social card of
// every customer's own domain. A white-label product cannot ship that, so the
// name is resolved per request from the host and BRAND is only the fallback.
const VENDOR_PUBLIC_NAME = `${BRAND.legalName} UAE`

async function publicNameForHost(): Promise<string> {
  // Never let a control-plane blip cost the page its metadata: an unresolved
  // host is the vendor's own site, which is what BRAND already describes.
  const brand = await getTenantBrand().catch(() => null)
  return brand?.company ?? VENDOR_PUBLIC_NAME
}

// Phone/webapp behaviour: edge-to-edge with safe-area support (viewportFit)
// and a browser-chrome colour that matches the app instead of default white.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Stops iOS Safari's automatic zoom-in when focusing sub-16px inputs (the
  // page then STAYS zoomed, clipping fixed overlays like the Apps sheet).
  // Safari still honors user-initiated pinch zoom despite this cap.
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a1628",
}

export async function generateMetadata(): Promise<Metadata> {
  const publicName = await publicNameForHost()
  return   {
    metadataBase: getMetadataBase(),
    title: {
      default: publicName,
      template: `%s | ${publicName}`,
    },
    applicationName: publicName,
    description:
      `${publicName} real estate advisory for sales, leasing, project marketing, investments, consultancy, valuations, and market intelligence.`,
    generator: publicName,
    authors: [{ name: publicName, url: siteUrl }],
    creator: publicName,
    publisher: publicName,
    category: "Real Estate",
    keywords: [
      "Dubai real estate",
      "Dubai properties",
      "Dubai investment",
      "off-plan Dubai",
      "Golden Visa",
      "Dubai Marina",
      "Downtown Dubai",
      "Dubai market intelligence",
      publicName,
      "investment advisors",
    ],
    openGraph: {
      title: publicName,
      description:
        "Dubai real estate advisory for buying, selling, renting, project marketing, investments, and market intelligence.",
      url: siteUrl,
      siteName: publicName,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: BRAND_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${publicName} — Dubai Real Estate Advisory`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: publicName,
      description:
        "Dubai real estate advisory backed by practical market intelligence.",
      images: [BRAND_OG_IMAGE],
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    },
    manifest: "/site.webmanifest",
    // Installed-to-home-screen behaviour: full-screen, app-like, no browser chrome.
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: BRAND.company,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // A tenant address nobody registered is a 404, decided BEFORE any data call.
  // The wildcard DNS record means every label reaches this app, and left to
  // run the request failed deep in lib/db.ts with TenantResolutionError — a
  // 500 for a page that simply does not exist. See isUnknownTenantHost.
  if (await isUnknownTenantHost()) notFound()

  // Brand resolution order: SaaS tenant (by host) → WL demo workspace (by
  // cookie) → static Freehold BRAND. Null everywhere except those modes.
  const wlBrand = (await getTenantBrand()) ?? (await getWorkspaceBrand())
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    // The tenant's own name, not the vendor's: this JSON-LD is what search
    // engines read for the knowledge panel, so a vendor name here published
    // the wrong business for every customer domain.
    "name": wlBrand?.company ?? VENDOR_PUBLIC_NAME,
    "image": `${siteUrl}${BRAND_OG_IMAGE}`,
    "logo": `${siteUrl}/icon.png`,
    "@id": siteUrl,
    "url": siteUrl,
    "telephone": BRAND.phone,
    "address": {
      "@type": "PostalAddress",
      // Env-overridable office address; the default is the Freehold office.
      "streetAddress": process.env.NEXT_PUBLIC_BRAND_ADDRESS?.trim() || "Sobha Sapphire Building, Office 904, Business Bay, Dubai",
      "addressLocality": "Dubai",
      "addressRegion": "Dubai",
      "addressCountry": "AE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 25.1012,
      "longitude": 55.1852
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    "sameAs": [
      siteUrl
    ]
  }

  return (
    <html lang="en" className={cairo.variable} suppressHydrationWarning>
      <head>
        {/* Apply the persisted Freehold light/dark mode before paint (no flash). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('fh-theme')==='light')document.documentElement.classList.add('theme-light')}catch(e){}`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${geistMono.variable} ${cairo.variable} bg-background font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* White-label: override the gold accent token for the whole tree. */}
        {wlBrand ? (
          <style dangerouslySetInnerHTML={{ __html: `:root{--color-gold:${wlBrand.accent};}` }} />
        ) : null}
        <BrandProvider brand={wlBrand}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            forcedTheme="light"
            disableTransitionOnChange={false}
          >
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1 overflow-x-clip">
                {children}
              </main>
              <SiteFooter />
              <WhatsAppFloat />
            </div>
          </ThemeProvider>
        </BrandProvider>
        <Analytics />
      </body>
    </html>
  )
}

import type React from "react"
import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getTranslations } from "next-intl/server"
import { CookieConsent } from "@/components/CookieConsent"
import { ThemeProvider } from "@/components/theme-provider"
import { CopilotProvider } from "@/components/copilot-provider"
import { RuntimeShellProvider } from "@/components/runtime-shell-provider"
import { getRequestRuntimeShell } from "@/lib/runtime-shell"
import { SEO, absoluteUrl, getLocaleAlternates, getOpenGraphLocale, getSeoCopy, getSiteUrl } from "@/lib/seo"
import { getLocaleDirection } from "@/i18n/locale"
import { getLocaleMessages, getRequestLocale } from "@/i18n/request"
import "./globals.css"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const copy = getSeoCopy(locale)
  const alternates = getLocaleAlternates("/", locale)

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: copy.defaultTitle,
      template: "%s | Entrestate",
    },
    description: copy.defaultDescription,
    applicationName: SEO.siteName,
    alternates,
    keywords: [
      "UAE real estate",
      "Dubai property market",
      "real estate intelligence",
      "property investment analysis",
      "market scoring",
      "developer reliability",
      "rental yield analysis",
      "investor reports",
    ],
    authors: [{ name: "Entrestate" }],
    creator: "Entrestate",
    publisher: "Entrestate",
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
    openGraph: {
      type: "website",
      locale: getOpenGraphLocale(locale),
      siteName: SEO.siteName,
      title: copy.defaultTitle,
      description: copy.defaultDescription,
      url: alternates.languages?.[locale],
      images: [
        {
          url: absoluteUrl(SEO.defaultOgImagePath),
          width: 1200,
          height: 630,
          alt: copy.ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.defaultTitle,
      description: copy.defaultDescription,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
    manifest: "/manifest.json",
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#11161d" },
    { media: "(prefers-color-scheme: dark)", color: "#11161d" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getRequestLocale()
  const runtimeShell = await getRequestRuntimeShell()
  const messages = await getLocaleMessages(locale)
  const t = await getTranslations({ locale, namespace: "common" })

  return (
    <html
      lang={locale}
      dir={getLocaleDirection(locale)}
      suppressHydrationWarning
      className="bg-background"
      data-shell={runtimeShell}
    >
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
        >
          {t("skipToMain")}
        </a>
        <RuntimeShellProvider shell={runtimeShell}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              <CopilotProvider>
                {children}
                <CookieConsent />
              </CopilotProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </RuntimeShellProvider>
      </body>
    </html>
  )
}

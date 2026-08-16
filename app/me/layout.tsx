import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MeNav } from "@/components/me/me-nav"
import { getSyncedUser } from "@/lib/auth/sync"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getRequestLocale } from "@/i18n/request"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Your Entrestate",
  // Personal home is per-user content — never indexed
  robots: { index: false, follow: false },
}

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const user = await getSyncedUser()
  if (!user) {
    const locale = await getRequestLocale()
    redirect(buildLoginHref(locale, "/me"))
  }
  const entitlement = await getCurrentEntitlement()

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 md:pt-32 lg:px-8">
        <MeNav tier={entitlement.tier} />
        <div className="mt-6">{children}</div>
      </div>
      <Footer />
    </main>
  )
}

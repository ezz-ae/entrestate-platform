import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { deleteUserListing, getUserListing } from "@/lib/listings/server"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { PaidUpsell } from "@/components/me/paid-upsell"
import { Card, CardContent } from "@/components/ui/card"
import { VerdictPill } from "@/components/me/verdict-pill"
import { Button } from "@/components/ui/button"
import { formatAed } from "@/lib/format/currency"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export const dynamic = "force-dynamic"

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getRequestLocale()
  const { id } = await params
  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier === "free") return <PaidUpsell capability="listings_ingest" />
  const listing = await getUserListing(id)
  if (!listing) notFound()

  async function deleteAction() {
    "use server"
    await deleteUserListing(id)
    redirect(prefixLocalePath("/me/listings", locale))
  }

  return (
    <div className="space-y-6">
      <Link href={prefixLocalePath("/me/listings", locale)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> All listings
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{listing.name}</h1>
          <p className="text-sm text-muted-foreground">{[listing.developer, listing.area].filter(Boolean).join(" · ")}</p>
        </div>
        <VerdictPill verdict={(listing as any).verdict ?? null} confidence={(listing as any).confidencePct ?? null} />
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Price" value={formatAed(listing.priceAed ?? null, "en", { compact: true, fallback: "—" })} />
        <Stat label="Yield" value={typeof listing.yieldPct === "number" ? `${listing.yieldPct.toFixed(1)}%` : "—"} />
        <Stat label="Bedrooms" value={listing.bedrooms ? String(listing.bedrooms) : "—"} />
        <Stat label="Source" value={listing.source ?? "—"} />
      </div>

      <Card>
        <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
          {listing.description ? <p>{listing.description}</p> : <p className="text-muted-foreground">No description.</p>}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <form action={deleteAction}>
          <Button variant="destructive" type="submit">Delete listing</Button>
        </form>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold font-mono">{value}</div>
    </div>
  )
}

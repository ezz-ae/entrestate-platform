import Link from "next/link"
import { Plus, Filter } from "lucide-react"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { listUserListings } from "@/lib/listings/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VerdictPill } from "@/components/me/verdict-pill"
import { PaidUpsell } from "@/components/me/paid-upsell"
import { formatAed } from "@/lib/format/currency"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export const dynamic = "force-dynamic"

export default async function MyListingsPage() {
  const locale = await getRequestLocale()
  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier === "free") {
    return <PaidUpsell capability="listings_ingest" />
  }

  const listings = await listUserListings()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your listings</h1>
          <p className="text-sm text-muted-foreground">{listings.length} listing{listings.length === 1 ? "" : "s"} · scored against the same evidence stack as the public surface.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={prefixLocalePath("/me/connections", locale)}><Filter className="h-4 w-4 mr-1" /> Connect a portal</Link>
          </Button>
          <Button asChild>
            <Link href={prefixLocalePath("/me/listings/new", locale)}><Plus className="h-4 w-4 mr-1" /> New listing</Link>
          </Button>
        </div>
      </header>

      {listings.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground">No listings yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Add one manually, upload a CSV, or connect Bayut / Property Finder.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button asChild><Link href={prefixLocalePath("/me/listings/new", locale)}>Add manually</Link></Button>
              <Button variant="outline" asChild><Link href={prefixLocalePath("/me/connections", locale)}>Connect portal</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {listings.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Listing</th>
                <th className="text-left px-4 py-2 font-semibold">Area</th>
                <th className="text-right px-4 py-2 font-semibold">Price</th>
                <th className="text-right px-4 py-2 font-semibold">Yield</th>
                <th className="text-left px-4 py-2 font-semibold">Verdict</th>
                <th className="text-left px-4 py-2 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link href={prefixLocalePath(`/me/listings/${l.id}`, locale)} className="font-semibold hover:underline">{l.name}</Link>
                    {l.developer && <div className="text-xs text-muted-foreground">{l.developer}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.area ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatAed(l.priceAed ?? null, "en", { compact: true, fallback: "—" })}</td>
                  <td className="px-4 py-3 text-right font-mono">{typeof l.yieldPct === "number" ? `${l.yieldPct.toFixed(1)}%` : "—"}</td>
                  <td className="px-4 py-3"><VerdictPill verdict={(l as any).verdict ?? null} confidence={(l as any).confidencePct ?? null} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{l.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { PaidUpsell } from "@/components/me/paid-upsell"
import { NewListingForm } from "@/components/me/new-listing-form"

export const dynamic = "force-dynamic"

export default async function NewListingPage() {
  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier === "free") return <PaidUpsell capability="listings_ingest" />
  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold">Add a listing</h1>
        <p className="text-sm text-muted-foreground">Add a single listing now — for bulk upload, connect a portal or use the API.</p>
      </header>
      <NewListingForm />
    </div>
  )
}

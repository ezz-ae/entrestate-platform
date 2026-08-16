import Link from "next/link"
import { Sparkles, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { PaidCapability } from "@/lib/entitlement-gates"
import { capabilityMinTier, tierFeatureMatrix } from "@/lib/entitlement-gates"

const COPY: Record<PaidCapability, { headline: string; body: string }> = {
  personal_home: { headline: "Your personal home", body: "Sign in to see /me." },
  saved_searches: { headline: "More saved searches", body: "Free includes 5. Pro unlocks 50; team and institutional unlimited." },
  alerts: { headline: "Stay ahead with alerts", body: "Get email + push notifications when verdicts shift on areas you care about." },
  listings_ingest: { headline: "Push your own inventory", body: "Free is read-only. Paid lets you upload listings (CSV / JSON / brochure) and run Entrestate scoring on each one." },
  listings_score: { headline: "Score your listings", body: "Run the same evidence stack against your own deals." },
  portal_connections: { headline: "Connect Bayut & Property Finder", body: "Sync your portal listings nightly with one-click connectors." },
  crm_connections: { headline: "Push verdicts into your CRM", body: "HubSpot, Pipedrive, Bitrix24 — pin Entrestate verdicts to every deal." },
  custom_feeds: { headline: "Custom feeds + webhooks", body: "JSON webhooks, SFTP drops, real-time event streams." },
  api_keys: { headline: "Programmatic API access", body: "Create keys to integrate Entrestate into your stack." },
  api_read_market: { headline: "Public market API", body: "Public — works without sign-in." },
  api_read_listings: { headline: "Listings API", body: "Read your own listings programmatically." },
  api_write_listings: { headline: "Write listings via API", body: "POST listings into your account." },
  white_label_embed: { headline: "White-label embed", body: "Embed Entrestate verdicts on your customer-facing site." },
  data_residency_choice: { headline: "Choose data residency", body: "EU or UAE — your call. Institutional only." },
}

export function PaidUpsell({ capability }: { capability: PaidCapability }) {
  const requiredTier = capabilityMinTier(capability)
  const copy = COPY[capability]
  const matrix = tierFeatureMatrix()
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 rounded-md">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-4 w-4" /> {requiredTier} feature
          </div>
          <h1 className="mt-3 text-2xl font-bold">{copy.headline}</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">{copy.body}</p>
          <div className="mt-5 flex gap-2">
            <Button asChild>
              <Link href="/pricing">View plans</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact?ref=upsell">Talk to sales</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Capability</th>
                <th className="text-center px-4 py-2">Free</th>
                <th className="text-center px-4 py-2">Pro</th>
                <th className="text-center px-4 py-2">Team</th>
                <th className="text-center px-4 py-2">Institutional</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-2">{row.label}</td>
                  <td className="text-center px-4 py-2"><Cell value={row.free} /></td>
                  <td className="text-center px-4 py-2"><Cell value={row.pro} /></td>
                  <td className="text-center px-4 py-2"><Cell value={row.team} /></td>
                  <td className="text-center px-4 py-2"><Cell value={row.institutional} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 inline text-emerald-600" aria-label="Included" />
  if (value === false) return <span className="text-muted-foreground" aria-label="Not included">—</span>
  return <span className="font-mono text-xs">{value}</span>
}

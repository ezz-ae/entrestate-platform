import Link from "next/link"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeIcon, KeyRound, ExternalLink, Database, Building2 } from "lucide-react"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export const dynamic = "force-dynamic"

export default async function ApiAccessPage() {
  const locale = await getRequestLocale()
  const entitlement = await getCurrentEntitlement()
  const isPaid = entitlement.tier !== "free"

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">API access</h1>
        <p className="text-sm text-muted-foreground">
          Public market data is open. Paid plans unlock keys for your private listings, writes, and platform integrations.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Database className="h-4 w-4" /> Open market feed
          </h2>
          <p className="text-sm text-muted-foreground">
            Read market pulse and public listings without a paid connection. Use this when you want Entrestate data on your site without bringing your own inventory into the platform.
          </p>
          <pre className="overflow-x-auto rounded bg-muted/40 p-3 text-xs font-mono">{`# Public market pulse
curl https://entrestate.com/api/v1/market-feed?type=dashboard

# Public listing feed
curl https://entrestate.com/api/v1/market-feed?type=listings`}</pre>
          <Link href={prefixLocalePath("/docs/partners-apis", locale)} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Open API docs <ExternalLink className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Building2 className="h-4 w-4" /> Your listings API
          </h2>
          <p className="text-sm text-muted-foreground">
            This is the paid layer: read your own listings, write listings into Entrestate, and connect the output to your platform or CRM.
          </p>
          <pre className="overflow-x-auto rounded bg-muted/40 p-3 text-xs font-mono">{`# List YOUR listings (paid)
curl https://entrestate.com/api/v1/listings \\
  -H "x-api-key: ent_live_..."

# Push a listing (paid)
curl -X POST https://entrestate.com/api/v1/listings \\
  -H "x-api-key: ent_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Marina Heights 2BR","area":"Dubai Marina","priceAed":2500000,"yieldPct":7.2,"source":"api"}'`}</pre>
          {isPaid ? (
            <Button asChild>
              <Link href={prefixLocalePath("/account/api-keys", locale)}>
                <KeyRound className="mr-1 h-4 w-4" /> Manage API keys
              </Link>
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={prefixLocalePath("/pricing", locale)}>Upgrade for API keys</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={prefixLocalePath("/contact", locale)}>Talk to sales</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isPaid ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <CodeIcon className="h-4 w-4" /> Key model
            </h2>
            <p className="text-sm text-muted-foreground">
              Keys are hashed at rest and scoped for market reads, listing reads, and listing writes. Use separate keys per app or environment.
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li><code>read:market</code> for public market feeds</li>
              <li><code>read:listings</code> for your private listing inventory</li>
              <li><code>write:listings</code> for pushing updates into Entrestate</li>
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

import Link from "next/link"
import { ExternalLink, Plug, ShieldCheck, Sparkles } from "lucide-react"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { listConnectors, type ConnectorDefinition } from "@/lib/connectors/registry"
import { listUserConnectorCredentials } from "@/lib/connectors/server"
import { tierMeets } from "@/lib/entitlement-gates"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export const dynamic = "force-dynamic"

export default async function ConnectionsPage() {
  const locale = await getRequestLocale()
  const entitlement = await getCurrentEntitlement()
  const all = listConnectors()
  const credentials = entitlement.accountKey ? await listUserConnectorCredentials().catch(() => []) : []
  const credentialMap = new Map(credentials.map((item) => [item.connectorId, item]))

  const portal = all.filter((connector) => connector.family === "portal")
  const crm = all.filter((connector) => connector.family === "crm")
  const feed = all.filter((connector) => connector.family === "feed")

  return (
    <div className="space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Plug className="h-3.5 w-3.5" />
          Connection layer
        </div>
        <h1 className="mt-4 text-2xl font-bold">Connect your platform</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Entrestate market data stays open on the read surface. This connection layer is the paid work:
          pull your own listings from portals, sync verdicts into CRMs, and connect custom feeds into your stack.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="max-w-2xl">
            <h2 className="font-semibold">What is free vs paid</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Free gives you the full public market read surface. Pro and above unlock listings ingestion,
              platform connections, API keys, and scoring on your own inventory.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={prefixLocalePath("/me/api-access", locale)}>Open API access</Link>
            </Button>
            <Button asChild>
              <Link href={prefixLocalePath("/pricing", locale)}>
                {entitlement.tier === "free" ? "Upgrade plans" : "Manage plan"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Family title="Property portals" subtitle="Pull live inventory from Bayut, Property Finder, and Dubizzle." connectors={portal} userTier={entitlement.tier} credentialMap={credentialMap} locale={locale} />
      <Family title="CRMs" subtitle="Push verdicts into your sales pipeline and pull contacts back into Entrestate." connectors={crm} userTier={entitlement.tier} credentialMap={credentialMap} locale={locale} />
      <Family title="Custom feeds" subtitle="Inbound webhooks, outbound webhooks, and SFTP drops for institutional workflows." connectors={feed} userTier={entitlement.tier} credentialMap={credentialMap} locale={locale} />
    </div>
  )
}

function Family({
  title,
  subtitle,
  connectors,
  userTier,
  credentialMap,
  locale,
}: {
  title: string
  subtitle: string
  connectors: ConnectorDefinition[]
  userTier: "free" | "pro" | "team" | "institutional"
  credentialMap: Map<string, { status: string }>
  locale: "en" | "ar"
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {connectors.map((connector) => {
          const allowed = tierMeets(userTier, connector.minTier)
          const existing = credentialMap.get(connector.id)
          return (
            <Card key={connector.id} className={allowed ? "" : "opacity-80"}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
                    <span className="text-sm font-bold">{connector.name[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{connector.name}</h3>
                      {existing ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
                          <ShieldCheck className="h-3 w-3" /> {existing.status}
                        </span>
                      ) : !allowed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                          <Sparkles className="h-3 w-3" /> {connector.minTier}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{connector.description}</p>
                    <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                      {connector.capabilities.slice(0, 3).map((capability) => (
                        <li key={capability}>{capability}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center gap-2">
                      {allowed ? (
                        <Button asChild size="sm">
                          <Link href={prefixLocalePath(`/me/connections/${connector.id}`, locale)}>
                            {existing ? "Manage" : "Set up"}
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline">
                          <Link href={prefixLocalePath("/pricing", locale)}>Upgrade to use</Link>
                        </Button>
                      )}
                      {connector.docsUrl ? (
                        <Link href={connector.docsUrl} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          Docs <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

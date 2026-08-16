import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { ArrowLeft, CheckCircle2, ExternalLink, Plug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { getConnector } from "@/lib/connectors/registry"
import { getUserConnectorCredential, upsertUserConnectorCredential } from "@/lib/connectors/server"
import { tierMeets } from "@/lib/entitlement-gates"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export const dynamic = "force-dynamic"

export default async function ConnectorSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = await getRequestLocale()
  const { id } = await params
  const query = (await searchParams) ?? {}
  const connector = getConnector(id)
  if (!connector) {
    notFound()
  }
  const resolvedConnector = connector

  const entitlement = await getCurrentEntitlement()
  const allowed = tierMeets(entitlement.tier, resolvedConnector.minTier)
  const credential = entitlement.accountKey ? await getUserConnectorCredential(resolvedConnector.id).catch(() => null) : null
  const saved = query.saved === "1"

  async function saveConnection(formData: FormData) {
    "use server"

    const currentEntitlement = await getCurrentEntitlement()
    if (!tierMeets(currentEntitlement.tier, resolvedConnector.minTier)) {
      redirect(prefixLocalePath("/pricing", locale))
    }

    const config = Object.fromEntries(
      resolvedConnector.authFields.map((field) => [field.key, String(formData.get(field.key) ?? "").trim()]),
    )

    await upsertUserConnectorCredential(resolvedConnector.id, config)
    revalidatePath("/me/connections")
    revalidatePath(`/me/connections/${resolvedConnector.id}`)
    redirect(prefixLocalePath(`/me/connections/${resolvedConnector.id}?saved=1`, locale))
  }

  return (
    <div className="space-y-6">
      <Link href={prefixLocalePath("/me/connections", locale)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> All connections
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Plug className="h-3.5 w-3.5" />
            {resolvedConnector.family}
          </div>
          <h1 className="mt-4 text-2xl font-bold">{resolvedConnector.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{resolvedConnector.description}</p>
        </div>
        {resolvedConnector.docsUrl ? (
          <Button asChild variant="outline">
            <Link href={resolvedConnector.docsUrl}>
              Connector docs <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">What this connector does</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
              {resolvedConnector.capabilities.map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Status</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {credential ? `Connected (${credential.status}). Update the credentials below any time.` : "Not connected yet. Save the required credentials to activate this connector."}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Minimum plan: <span className="font-semibold text-foreground">{resolvedConnector.minTier}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {!allowed ? (
          <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Upgrade required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This connector starts on the {resolvedConnector.minTier} plan. Your current plan can still read all public market data, but connectors and user-owned sync sit behind the paid layer.
            </p>
            <Button asChild className="mt-4">
              <Link href={prefixLocalePath("/pricing", locale)}>View plans</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Setup</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save the credentials needed for {resolvedConnector.name}. Entrestate stores the connection config against your workspace and uses it for sync jobs.
                </p>
              </div>
              {saved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </span>
              ) : null}
            </div>
            <form action={saveConnection} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {resolvedConnector.authFields.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-2">
                  This connector is activated without manual credentials. Save it once and the connection will be registered to your workspace.
                </div>
              ) : null}
              {resolvedConnector.authFields.map((field) => (
                <div key={field.key} className={field.type === "text" && String(field.placeholder ?? "").length > 50 ? "md:col-span-2" : ""}>
                  <label htmlFor={field.key} className="text-sm font-medium text-foreground">
                    {field.label}
                  </label>
                  <input
                    id={field.key}
                    name={field.key}
                    type={field.type === "password" ? "password" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                    defaultValue={String((credential?.config as Record<string, unknown> | null)?.[field.key] ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="mt-2 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50"
                  />
                  {field.helpText ? (
                    <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
                  ) : null}
                </div>
              ))}
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button type="submit">{credential ? "Update connector" : "Save connector"}</Button>
                <Button asChild variant="outline">
                  <Link href={prefixLocalePath("/me/connections", locale)}>Back to connections</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

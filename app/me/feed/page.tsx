import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { Card, CardContent } from "@/components/ui/card"
import { PaidUpsell } from "@/components/me/paid-upsell"
import { prisma } from "@/lib/prisma"
import { getSyncedUser } from "@/lib/auth/sync"

export const dynamic = "force-dynamic"

export default async function FeedPage() {
  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier === "free") return <PaidUpsell capability="alerts" />

  const user = await getSyncedUser()
  const alerts = user
    ? await prisma.marketAlert.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }).catch(() => [])
    : []

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Email and push updates when something changes on your saved areas, watched projects, or your own listings.
        </p>
      </header>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No alerts yet. Save an area or project to start receiving updates.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {alert.subjectKind}
                  </p>
                  <span className="text-[11px] text-muted-foreground">{new Date(alert.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 className="mt-3 font-semibold">{alert.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

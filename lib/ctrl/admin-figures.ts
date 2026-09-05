/**
 * THE ADMIN'S FIGURES — what the overview and the finance desk read.
 *
 * Read-only over the control plane's own tables on the shared schema: the
 * workspaces (saas_tenants), the accounts and their credit
 * (entrestate_accounts, entrestate_credit_postings), the coupon campaigns,
 * the Ads Coin requests waiting for a person, and the partners' held leads.
 * Every figure is DERIVED at read time from the rows that carry it — the
 * same discipline as the finance screen: a stored total is the number that
 * quietly stops matching the rows it claims to sum.
 *
 * Nothing here writes. Approving a request is the finance screen's
 * decideRequest and nothing else (the standing money rule); minting a
 * campaign is the coupon desk's; this module never imports a writer, and
 * scripts/admin-panel-test.ts holds it to that. Every reader degrades to a
 * zero it says out loud (`unknown: true`) rather than a confident 0.
 */
import { query, runWithDefaultSchema } from '@/lib/db'
import { filsToAed } from '@/lib/freehold/wallet'
import { listRequests, listWallets } from '@/lib/freehold/wallet-db'
import { listTenants, type SaasTenant } from '@/lib/tenancy/store'
import { trialState, trialsToChase, type TrialState } from '@/lib/tenancy/trial'
import { listCampaigns, type CampaignLine } from '@/lib/coupon-campaigns'
import { ensureCreditTables } from '@/lib/account-credit'

export interface Figure { n: number; unknown?: boolean }

export interface AdminOverview {
  workspaces: Figure & { starting: number; active: number; chase: number }
  accounts: Figure
  credit: { landedAed: string; onAccountsAed: string; unknown?: boolean }
  coupons: Figure & { live: number }
  requests: Figure
  partners: Figure & { held: number }
}

const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<{ v: T; ok: boolean }> => {
  try { return { v: await fn(), ok: true } } catch { return { v: fallback, ok: false } }
}

export async function readAdminOverview(): Promise<AdminOverview> {
  const now = new Date()
  const [tenants, accounts, credit, campaigns, pending, partners] = await Promise.all([
    safe(() => listTenants(), [] as SaasTenant[]),
    safe(() => runWithDefaultSchema(() => query<{ n: string }>(`SELECT count(*)::text AS n FROM entrestate_accounts`)), [{ n: '0' }]),
    safe(async () => {
      await ensureCreditTables()
      return runWithDefaultSchema(() => query<{ granted: string; applied: string }>(
        `SELECT COALESCE(SUM(amount) FILTER (WHERE kind = 'grant'), 0)::text AS granted,
                COALESCE(SUM(amount) FILTER (WHERE kind = 'apply'), 0)::text AS applied
           FROM entrestate_credit_postings`))
    }, [{ granted: '0', applied: '0' }]),
    safe(() => listCampaigns(), [] as CampaignLine[]),
    safe(() => runWithDefaultSchema(() => listRequests('pending')), []),
    safe(() => runWithDefaultSchema(() => query<{ partners: string; held: string }>(
      `SELECT (SELECT count(*)::text FROM ctrl_tenants) AS partners,
              (SELECT count(*)::text FROM ctrl_leads WHERE state = 'held') AS held`)), [{ partners: '0', held: '0' }]),
  ])

  const states = tenants.v.map((t) => trialState(t, now))
  const granted = Number(credit.v[0]?.granted ?? 0)
  const applied = Number(credit.v[0]?.applied ?? 0)
  return {
    workspaces: {
      n: tenants.v.length,
      unknown: !tenants.ok,
      starting: states.filter((s) => s.kind === 'active' || s.kind === 'endingSoon').length,
      active: tenants.v.filter((t) => t.status === 'active').length,
      chase: trialsToChase(tenants.v, now).length,
    },
    accounts: { n: Number(accounts.v[0]?.n ?? 0), unknown: !accounts.ok },
    credit: { landedAed: filsToAed(granted), onAccountsAed: filsToAed(Math.max(0, granted - applied)), unknown: !credit.ok },
    coupons: { n: campaigns.v.length, live: campaigns.v.filter((c) => c.status === 'live').length, unknown: !campaigns.ok },
    requests: { n: pending.v.length, unknown: !pending.ok },
    partners: { n: Number(partners.v[0]?.partners ?? 0), held: Number(partners.v[0]?.held ?? 0), unknown: !partners.ok },
  }
}

/* ── workspaces ─────────────────────────────────────────────────────────── */

export interface WorkspaceLine extends SaasTenant {
  period: TrialState
  /** What the period is called on the desk — never the word trial. */
  periodLabel: string
  chase: boolean
}

/** The starting period, in the desk's words. */
export function periodLabel(t: SaasTenant, s: TrialState): string {
  if (t.status === 'suspended') return 'Paused'
  if (t.status === 'active') return 'Paying'
  if (s.kind === 'active') return `Starting · ${s.daysLeft} days left`
  if (s.kind === 'endingSoon') return s.daysLeft === 1 ? 'Starting · ends tomorrow' : `Starting · ends in ${s.daysLeft} days`
  if (s.kind === 'expired') return s.daysSince === 0 ? 'Starting period ended today' : `Starting period ended ${s.daysSince} days ago`
  return 'Starting'
}

export async function readWorkspaces(): Promise<{ lines: WorkspaceLine[]; unknown: boolean }> {
  const now = new Date()
  const tenants = await safe(() => listTenants(), [] as SaasTenant[])
  const chase = new Set(trialsToChase(tenants.v, now).map((c) => c.tenant.subdomain))
  return {
    unknown: !tenants.ok,
    lines: tenants.v.map((t) => {
      const period = trialState(t, now)
      return { ...t, period, periodLabel: periodLabel(t, period), chase: chase.has(t.subdomain) }
    }),
  }
}

/* ── finance ────────────────────────────────────────────────────────────── */

export interface PendingRequest {
  id: string
  amountAed: string
  reason: string
  requestedBy: string
  wallet: string
  createdAt: string
}

export interface CreditHolder {
  accountId: string
  email: string | null
  name: string | null
  onAccountAed: string
  landedAed: string
  appliedAed: string
}

export interface FinanceDesk {
  pending: PendingRequest[]
  holders: CreditHolder[]
  totals: { landedAed: string; appliedAed: string; onAccountsAed: string }
  unknown: boolean
}

export async function readFinanceDesk(): Promise<FinanceDesk> {
  const [pending, wallets, holders] = await Promise.all([
    safe(() => runWithDefaultSchema(() => listRequests('pending')), []),
    safe(() => runWithDefaultSchema(() => listWallets()), []),
    safe(async () => {
      await ensureCreditTables()
      return runWithDefaultSchema(() => query<{ account_id: string; email: string | null; name: string | null; granted: string; applied: string }>(
        `SELECT p.account_id, a.email, a.name,
                COALESCE(SUM(p.amount) FILTER (WHERE p.kind = 'grant'), 0)::text AS granted,
                COALESCE(SUM(p.amount) FILTER (WHERE p.kind = 'apply'), 0)::text AS applied
           FROM entrestate_credit_postings p
           LEFT JOIN entrestate_accounts a ON a.id = p.account_id
          GROUP BY p.account_id, a.email, a.name
          ORDER BY (COALESCE(SUM(p.amount) FILTER (WHERE p.kind = 'grant'), 0) - COALESCE(SUM(p.amount) FILTER (WHERE p.kind = 'apply'), 0)) DESC
          LIMIT 200`))
    }, []),
  ])
  const walletLabel = new Map(wallets.v.map((w) => [w.id, `${w.label} · ${w.accountNo}`]))
  let landed = 0, applied = 0
  const lines: CreditHolder[] = holders.v.map((h) => {
    const g = Number(h.granted), a = Number(h.applied)
    landed += g; applied += a
    return { accountId: h.account_id, email: h.email, name: h.name, onAccountAed: filsToAed(Math.max(0, g - a)), landedAed: filsToAed(g), appliedAed: filsToAed(a) }
  })
  return {
    pending: pending.v.map((r) => ({
      id: r.id, amountAed: filsToAed(r.amount), reason: r.reason, requestedBy: r.requestedBy,
      wallet: walletLabel.get(r.walletId) ?? r.walletId, createdAt: r.createdAt,
    })),
    holders: lines,
    totals: { landedAed: filsToAed(landed), appliedAed: filsToAed(applied), onAccountsAed: filsToAed(Math.max(0, landed - applied)) },
    unknown: !pending.ok || !holders.ok,
  }
}

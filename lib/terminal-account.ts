/**
 * PHASE 2 OF THE ACCOUNT FOUNDATION — identity becomes an account.
 *
 * Phase 1 (lib/terminal-session.ts) taught the business site to RECOGNISE a
 * Terminal session: a name on a strip, nothing behind it. This module gives
 * the recognition something to land on — the business-account row that every
 * later phase hangs off: the wallet (phase 3), the app entitlements (phase
 * 4), the workspace surfaces (phase 5). The owner's ruling that ordered all
 * of this: "الأساس اللي بنبني عليه هو الأكاونت" — one account, the Terminal's
 * Google sign-in, and everything the business sells attaches to it.
 *
 * TWO TABLES, BOTH OURS AND ONLY OURS:
 *
 *   entrestate_accounts      one row per Neon identity — find-or-create on
 *                            sight, refreshed on every visit. This is the
 *                            spine; deleting a Neon user orphans (never
 *                            cascades) the row, because money and installs
 *                            will hang off it.
 *   entrestate_account_apps  what this account asked for from the App Store —
 *                            status 'requested' until a human activates it
 *                            (phase 4 gives it billing states). An install
 *                            request is a SALES SIGNAL: leadership is
 *                            emailed the moment one lands.
 *
 * Deliberately NOT freehold_site_users: that table is the client-workspace
 * auth of the forked product. The vendor's account spine is named for the
 * vendor and pinned to the shared schema (runWithDefaultSchema), because an
 * account is one thing across every host and tenant — the same rule /ctrl
 * follows and for the same reason.
 *
 * Fail-soft everywhere: recognition and the store must render whether or not
 * this table is reachable. A visit that cannot be recorded is a quieter
 * visit, never an error page.
 */
import { randomUUID } from 'node:crypto'
import { query, runWithDefaultSchema, ensureOnce } from '@/lib/db'
import type { TerminalUser } from '@/lib/terminal-session'

export interface BusinessAccount {
  id: string
  neonUserId: string
  email: string | null
  name: string | null
  createdAt: string
  /** True the first time this identity was ever seen on the business side. */
  isNew: boolean
}

export const APP_REQUEST_STATUSES = ['requested', 'active', 'declined'] as const
export type AppRequestStatus = (typeof APP_REQUEST_STATUSES)[number]

const ensureTables = () =>
  ensureOnce('entrestate-accounts', () =>
    runWithDefaultSchema(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS entrestate_accounts (
          id           text PRIMARY KEY,
          neon_user_id text NOT NULL UNIQUE,
          email        text,
          name         text,
          created_at   timestamptz NOT NULL DEFAULT now(),
          last_seen_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      await query(`
        CREATE TABLE IF NOT EXISTS entrestate_account_apps (
          id           text PRIMARY KEY,
          account_id   text NOT NULL REFERENCES entrestate_accounts(id),
          app_id       text NOT NULL,
          status       text NOT NULL DEFAULT 'requested'
                       CHECK (status IN ('requested', 'active', 'declined')),
          requested_at timestamptz NOT NULL DEFAULT now(),
          decided_at   timestamptz,
          UNIQUE (account_id, app_id)
        )
      `)
    }),
  )

/**
 * THE find-or-create. Idempotent and racing-safe: the unique key is the Neon
 * user id, and a concurrent first visit resolves to one row via ON CONFLICT.
 * Name and email refresh on every visit — people rename their Google account
 * and the strip should keep up — and last_seen_at is the account's pulse.
 */
export async function ensureBusinessAccount(user: TerminalUser): Promise<BusinessAccount | null> {
  const neonUserId = (user.id ?? '').trim()
  if (!neonUserId) return null
  try {
    await ensureTables()
    return await runWithDefaultSchema(async () => {
      const rows = await query<{ id: string; neon_user_id: string; email: string | null; name: string | null; created_at: string; is_new: boolean }>(
        `INSERT INTO entrestate_accounts (id, neon_user_id, email, name)
         VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''))
         ON CONFLICT (neon_user_id) DO UPDATE SET
           email = COALESCE(NULLIF($3, ''), entrestate_accounts.email),
           name = COALESCE(NULLIF($4, ''), entrestate_accounts.name),
           last_seen_at = now()
         RETURNING id, neon_user_id, email, name, created_at::text,
                   (created_at = last_seen_at) AS is_new`,
        [`ea_${randomUUID()}`, neonUserId, user.email ?? '', user.name ?? ''],
      )
      const r = rows[0]
      if (!r) return null
      return { id: r.id, neonUserId: r.neon_user_id, email: r.email, name: r.name, createdAt: r.created_at, isNew: r.is_new === true }
    })
  } catch (err) {
    console.error('[terminal-account] ensure failed', err)
    return null
  }
}

/**
 * The account asks for an app. One row per (account, app) — asking twice is
 * one request, and a request that was already decided is not reopened by a
 * second click. Returns the request with whether this click created it, so
 * the caller can alert leadership exactly once.
 */
export async function requestApp(accountId: string, appId: string): Promise<{ status: AppRequestStatus; created: boolean } | null> {
  if (!accountId || !appId) return null
  try {
    await ensureTables()
    return await runWithDefaultSchema(async () => {
      const rows = await query<{ status: AppRequestStatus; created: boolean }>(
        `INSERT INTO entrestate_account_apps (id, account_id, app_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (account_id, app_id) DO UPDATE SET account_id = entrestate_account_apps.account_id
         RETURNING status, (xmax = 0) AS created`,
        [`eaa_${randomUUID()}`, accountId, appId],
      )
      const r = rows[0]
      return r ? { status: r.status, created: r.created === true } : null
    })
  } catch (err) {
    console.error('[terminal-account] app request failed', err)
    return null
  }
}

/** What this account has asked for — the store renders truthfully from it. */
export async function listAccountApps(accountId: string): Promise<Map<string, AppRequestStatus>> {
  const map = new Map<string, AppRequestStatus>()
  if (!accountId) return map
  try {
    await ensureTables()
    const rows = await runWithDefaultSchema(() =>
      query<{ app_id: string; status: AppRequestStatus }>(
        `SELECT app_id, status FROM entrestate_account_apps WHERE account_id = $1`,
        [accountId],
      ),
    )
    for (const r of rows) map.set(r.app_id, r.status)
  } catch { /* an unreadable list renders as "nothing requested yet" */ }
  return map
}

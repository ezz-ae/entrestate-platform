/**
 * The CONTROL PLANE's data layer — /ctrl, the lead-by-lead marketplace that
 * sells Entrestate's own Meta leads to partner brokerages.
 *
 * This began as a standalone service (entrestate-partner, its own Pool). Folded
 * into the platform it keeps its two laws:
 *
 *   MONEY IS INTEGER FILS everywhere (1 AED = 100 fils) — bigint columns, never
 *   numeric, so a balance can never grow a floating-point tail.
 *
 *   THE LEDGER IS APPEND-ONLY — a balance is SUM(credits) - SUM(debits), never
 *   a column somebody UPDATEs. Every entry carries a `ref` with a UNIQUE index,
 *   so a retry or double-click inserts nothing the second time.
 *
 * ONE SCHEMA, cross-tenant. Unlike the per-tenant business tables, the control
 * plane is global: one wallet per partner, one catalogue, one lead pool. So all
 * of its SQL runs through runWithDefaultSchema — the platform's own blessed
 * pattern for control-plane modules (see lib/db.ts, resolution rule 1) — and
 * every table is prefixed `ctrl_` so it never collides with a tenant's
 * `leads` / `projects` / `subscriptions` in the same shared schema.
 */
import { query, withTransaction, runWithDefaultSchema, ensureOnce, type TxQuery } from '@/lib/db'

// A result row with any-typed columns — the same shape as pg's QueryResultRow,
// declared HERE so this module imports no Postgres client of its own: every
// query still funnels through @/lib/db (the db-funnel guard enforces that, so
// tenant/schema scoping is never bypassed).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CtrlRow = { [column: string]: any }

/**
 * pg-shaped wrapper (returns `{ rows }`) so the ported marketplace code keeps
 * reading `const r = await ctrlQuery(...); r.rows`. Pinned to the shared schema.
 */
export async function ctrlQuery<T extends CtrlRow = CtrlRow>(
  text: string,
  params: unknown[] = [],
): Promise<{ rows: T[] }> {
  return runWithDefaultSchema(async () => ({ rows: await query<T>(text, params) }))
}

/** A control-plane transaction (billLead's FOR UPDATE), pinned to the shared schema. */
export function ctrlTx<T>(fn: (q: TxQuery) => Promise<T>): Promise<T> {
  return runWithDefaultSchema(() => withTransaction(fn))
}

// The whole schema, created lazily on first use and memoised once per process.
// All names carry the ctrl_ prefix; every FK stays inside the control plane.
const DDL = `
  CREATE TABLE IF NOT EXISTS ctrl_tenants (
    id            text PRIMARY KEY,
    name          text NOT NULL,
    -- sha256 hex of the bearer token; the token itself is shown once and never stored.
    token_hash    text NOT NULL UNIQUE,
    topup_slug    text NOT NULL UNIQUE,
    portal_slug   text,
    delivery_mode text NOT NULL DEFAULT 'marketplace',
    created_at    timestamptz NOT NULL DEFAULT now()
  );

  -- Which Meta objects on ENTRESTATE'S account belong to which partner.
  -- kind: 'campaign' | 'form' | 'facebook_page' | 'instagram'.
  CREATE TABLE IF NOT EXISTS ctrl_mappings (
    id           serial PRIMARY KEY,
    tenant_id    text NOT NULL REFERENCES ctrl_tenants(id),
    kind         text NOT NULL,
    ref_id       text NOT NULL,
    name         text NOT NULL DEFAULT '',
    campaign_ref text,
    project_ref  text,
    access       text NOT NULL DEFAULT 'read_write',
    UNIQUE (kind, ref_id)
  );

  -- Pricing: THE NUMBER THE PARTNER NEVER SEES COMPUTED. fixed_fils wins when
  -- set, otherwise price = max(floor_fils, round(cost * multiplier)).
  CREATE TABLE IF NOT EXISTS ctrl_pricing_rules (
    tenant_id   text PRIMARY KEY REFERENCES ctrl_tenants(id),
    multiplier  double precision NOT NULL DEFAULT 1.5,
    floor_fils  bigint NOT NULL DEFAULT 15000,
    fixed_fils  bigint
  );

  -- The append-only ledger. amount_fils is ALWAYS positive; kind says which way
  -- the money moved. ref is the idempotency key.
  CREATE TABLE IF NOT EXISTS ctrl_wallet_entries (
    id          bigserial PRIMARY KEY,
    tenant_id   text NOT NULL REFERENCES ctrl_tenants(id),
    kind        text NOT NULL CHECK (kind IN ('credit', 'debit')),
    amount_fils bigint NOT NULL CHECK (amount_fils > 0),
    ref         text NOT NULL UNIQUE,
    note        text NOT NULL DEFAULT '',
    created_at  timestamptz NOT NULL DEFAULT now()
  );

  -- The catalogue. A PROJECT is what a partner shops for ("Reportage
  -- Townhouses"), not a Meta campaign id. A project may pin its own per-lead
  -- price, which outranks the arithmetic — a catalogue price is a promise.
  CREATE TABLE IF NOT EXISTS ctrl_projects (
    id                  text PRIMARY KEY,
    name                text NOT NULL,
    description         text NOT NULL DEFAULT '',
    active              boolean NOT NULL DEFAULT true,
    price_fils_override bigint,
    created_at          timestamptz NOT NULL DEFAULT now()
  );

  -- A SUBSCRIPTION is the partner choosing a project with a LEAD LIMIT. The
  -- limit caps buying, not seeing.
  CREATE TABLE IF NOT EXISTS ctrl_subscriptions (
    tenant_id  text NOT NULL REFERENCES ctrl_tenants(id),
    project_id text NOT NULL REFERENCES ctrl_projects(id),
    lead_limit int NOT NULL CHECK (lead_limit > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, project_id)
  );

  -- Leads pulled from Meta, priced at ingestion, billed at delivery. state:
  -- 'held' (not yet paid for — invisible to the partner) or 'delivered'.
  CREATE TABLE IF NOT EXISTS ctrl_leads (
    id           text PRIMARY KEY,
    tenant_id    text NOT NULL REFERENCES ctrl_tenants(id),
    form_id      text NOT NULL,
    created_time timestamptz NOT NULL,
    field_data   jsonb NOT NULL DEFAULT '[]',
    cost_fils    bigint,
    price_fils   bigint NOT NULL,
    state        text NOT NULL DEFAULT 'held' CHECK (state IN ('held', 'delivered')),
    delivered_at timestamptz,
    project_id   text
  );

  CREATE UNIQUE INDEX IF NOT EXISTS ctrl_tenants_portal_slug_uidx ON ctrl_tenants (portal_slug);
`

/** Create the control-plane schema once, in the shared (default) schema. */
export function ensureCtrlSchema(): Promise<void> {
  return runWithDefaultSchema(() =>
    ensureOnce('ctrl-marketplace', async () => { await query(DDL) }),
  )
}

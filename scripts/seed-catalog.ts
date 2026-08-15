#!/usr/bin/env tsx
/**
 * scripts/seed-catalog.ts
 * Derive the platform's shared catalogue from the data universe.
 *
 * The platform's DEFAULT_SCHEMA (entrestate_app) must hold
 * freehold_site_projects BEFORE the first signup: tenant provisioning copies
 * from it (lib/tenancy/provision.ts) and skips QUIETLY when the source is
 * missing — a signup against an unseeded schema returns 200 and an empty
 * workspace, with no log line anywhere. Seeding is therefore part of wiring,
 * not an optional polish step.
 *
 * The source is raw.inventory_full — the ecosystem master (~7k projects) that
 * arrives with the platform's Neon branch — and never a client's curated
 * tables: gc_* and freehold_site_* in public are DERIVATIONS owned by their
 * brands, and copying a client's catalogue into the vendor's product is both
 * wrong and the exact thing the derivation rule exists to prevent.
 *
 * Quality gates (the reason a 7,015-row source seeds fewer rows): a listing
 * enters the catalogue only with a name, an area, a developer, a real image
 * URL and a sane asking price. A tenant's first screen holding 5k trustworthy
 * rows beats 7k rows where the gaps show up as broken cards.
 *
 * Idempotent: re-running upserts by id and never touches rows a human edited
 * after seeding (updated_at guard). Reads DATABASE_URL / NEON_DATABASE_URL
 * exactly as lib/db.ts does.
 *
 * Usage:  pnpm tsx scripts/seed-catalog.ts            # seed
 *         pnpm tsx scripts/seed-catalog.ts --dry-run  # report only
 */

import pg from 'pg'

const SCHEMA = process.env.DB_SCHEMA || 'entrestate_app'
const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
if (!url) {
  console.error('Missing NEON_DATABASE_URL or DATABASE_URL')
  process.exit(2)
}
const dry = process.argv.includes('--dry-run')

async function main() {
  const c = new pg.Client({ connectionString: url })
  await c.connect()
  const q = async <T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string) =>
    (await c.query<T>(sql)).rows

  // Refuse to seed the live branch by accident: the platform's branch was cut
  // from the shared production branch, so the only reliable identity is the
  // Neon timeline. Set SEED_TIMELINE_PREFIX to pin; unset skips the check for
  // a future fresh database.
  const pin = process.env.SEED_TIMELINE_PREFIX
  if (pin) {
    const [t] = await q<{ tl: string | null }>(
      `SELECT current_setting('neon.timeline_id', true) AS tl`,
    )
    if (!String(t?.tl ?? '').startsWith(pin)) {
      console.error(`Timeline mismatch — refusing to seed (expected ${pin}…)`)
      process.exit(3)
    }
  }

  const [src] = await q<{ n: number }>(`SELECT count(*)::int AS n FROM raw.inventory_full`)
  console.log(`source raw.inventory_full: ${src.n} rows`)

  await c.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`)

  // The app's own DDL (ensureProjectsTable in lib/data.ts) plus the three
  // columns its readers select but its lazy DDL does not create — omitting
  // them makes AI/notebook surfaces raise 42703 on tenant copies.
  await c.query(`
    CREATE TABLE IF NOT EXISTS "${SCHEMA}".freehold_site_projects (
      id text PRIMARY KEY,
      slug text UNIQUE,
      name text,
      area text,
      status text,
      developer_name text,
      hero_image text,
      price_from_aed numeric,
      price_to_aed numeric,
      market_score numeric,
      rental_yield numeric,
      golden_visa_eligible boolean DEFAULT false,
      featured boolean DEFAULT false,
      payload jsonb DEFAULT '{}'::jsonb,
      llm_context text,
      risk_class text,
      handover_date date,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )`)
  await c.query(`
    CREATE TABLE IF NOT EXISTS "${SCHEMA}".freehold_site_project_profiles (
      project_slug text PRIMARY KEY,
      profile      jsonb,
      facts_hash   text,
      generated_at timestamptz NOT NULL DEFAULT now()
    )`)

  // One row per slug: the master holds near-duplicates from multiple crawls;
  // the copy with the highest data confidence (then score) represents the
  // project. DISTINCT ON keeps exactly that one. raw.media_enrichment is the
  // CDN image map (1:1 on project_id) — the image gate is what actually sizes
  // the catalogue (~630 of 7k enriched today), and that is deliberate: the
  // real-image-only rule. Growing the catalogue means enriching more projects,
  // never dropping the gate.
  const select = `
    SELECT DISTINCT ON (slug) * FROM (
      SELECT
        i.project_id::text                                 AS id,
        lower(COALESCE(NULLIF(i.url_slug, ''),
          regexp_replace(lower(COALESCE(NULLIF(i.official_name,''), i.name)), '[^a-z0-9]+', '-', 'g') || '-' || i.project_id::text
        ))                                                 AS slug,
        COALESCE(NULLIF(i.official_name, ''), i.name)      AS name,
        COALESCE(NULLIF(i.final_area, ''), i.area, NULLIF(m.verified_location, '')) AS area,
        COALESCE(NULLIF(i.final_status, ''), i.handover_status, NULLIF(m.construction_phase, '')) AS status,
        COALESCE(NULLIF(i.developer_canonical, ''), NULLIF(i.final_developer, ''),
                 NULLIF(i.developer_clean, ''), i.developer) AS developer_name,
        COALESCE(NULLIF(i.hero_image_url, ''), NULLIF(m.hero_image_url, '')) AS hero_image,
        i.final_price_from                                 AS price_from_aed,
        i.final_price_to                                   AS price_to_aed,
        COALESCE(i.l2_investment_score, i.investment_score) AS market_score,
        COALESCE(i.net_rental_yield, i.gross_rental_yield) AS rental_yield,
        -- AED 2M is the UAE Golden Visa property threshold; derived, not stored.
        (i.final_price_from >= 2000000)                    AS golden_visa_eligible,
        NULLIF(TRIM(CONCAT_WS(' ', i.kernel_identity, i.kernel_problem_solved)), '') AS llm_context,
        i.derived_risk_class                               AS risk_class,
        CASE WHEN i.final_handover_year BETWEEN 2000 AND 2100
             THEN make_date(i.final_handover_year::int, 12, 31) END AS handover_date,
        jsonb_strip_nulls(jsonb_build_object(
          'bedrooms_min', i.bedrooms_min,
          'bedrooms_max', i.bedrooms_max,
          'has_payment_plan', i.has_payment_plan,
          'brochure_url', NULLIF(i.brochure_url, ''),
          'data_confidence', i.data_confidence,
          'buyer_archetype', NULLIF(i.derived_buyer_archetype, ''),
          'source', 'entrestate-universe'
        ))                                                 AS payload,
        i.data_confidence                                  AS _conf
      FROM raw.inventory_full i
      LEFT JOIN raw.media_enrichment m ON m.project_id::text = i.project_id::text
      WHERE COALESCE(NULLIF(i.official_name, ''), i.name) IS NOT NULL
        AND COALESCE(NULLIF(i.final_area, ''), i.area, NULLIF(m.verified_location, '')) IS NOT NULL
        AND COALESCE(NULLIF(i.developer_canonical, ''), NULLIF(i.final_developer, ''),
                     NULLIF(i.developer_clean, ''), i.developer) IS NOT NULL
        AND COALESCE(NULLIF(i.hero_image_url, ''), NULLIF(m.hero_image_url, '')) ~* '^https?://'
        AND i.final_price_from >= 100000
    ) g
    ORDER BY slug, _conf DESC NULLS LAST, market_score DESC NULLS LAST`

  const [gate] = await q<{ n: number }>(`SELECT count(*)::int AS n FROM (${select}) g`)
  console.log(`passes quality gates    : ${gate.n} rows`)

  if (dry) {
    console.log('(dry run — nothing written)')
    await c.end()
    return
  }

  // Never clobber a human edit: rows update only while still machine-owned
  // (updated_at untouched since insert).
  const res = await c.query(`
    INSERT INTO "${SCHEMA}".freehold_site_projects
      (id, slug, name, area, status, developer_name, hero_image,
       price_from_aed, price_to_aed, market_score, rental_yield,
       golden_visa_eligible, llm_context, risk_class, handover_date, payload)
    SELECT id, slug, name, area, status, developer_name, hero_image,
       price_from_aed, price_to_aed, market_score, rental_yield,
       golden_visa_eligible, llm_context, risk_class, handover_date, payload
    FROM (${select}) s
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, area = EXCLUDED.area, status = EXCLUDED.status,
      developer_name = EXCLUDED.developer_name, hero_image = EXCLUDED.hero_image,
      price_from_aed = EXCLUDED.price_from_aed, price_to_aed = EXCLUDED.price_to_aed,
      market_score = EXCLUDED.market_score, rental_yield = EXCLUDED.rental_yield,
      golden_visa_eligible = EXCLUDED.golden_visa_eligible,
      llm_context = EXCLUDED.llm_context, risk_class = EXCLUDED.risk_class,
      handover_date = EXCLUDED.handover_date, payload = EXCLUDED.payload,
      updated_at = now()
    WHERE freehold_site_projects.updated_at = freehold_site_projects.created_at`)
  const [fin] = await q<{ n: number }>(
    `SELECT count(*)::int AS n FROM "${SCHEMA}".freehold_site_projects`,
  )
  console.log(`upserted                : ${res.rowCount}`)
  console.log(`catalogue now holds     : ${fin.n} rows in ${SCHEMA}.freehold_site_projects`)
  await c.end()
}

main().catch((e) => {
  console.error('Seed failed:', e.message)
  process.exit(1)
})

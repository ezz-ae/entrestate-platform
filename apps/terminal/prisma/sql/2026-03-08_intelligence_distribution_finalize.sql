CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── investor_profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investor_profiles (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          text NOT NULL UNIQUE,
    workspace_id     text,
    version          integer NOT NULL DEFAULT 1,
    explicit_prefs   jsonb,
    inferred_prefs   jsonb,
    scoring_weights  jsonb,
    behavior_log     jsonb,
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now()
);

CREATE OR REPLACE VIEW investor_profiles_v1 AS
SELECT
    user_id,
    COALESCE(explicit_prefs ->> 'risk_profile', inferred_prefs ->> 'risk_profile', 'balanced') AS risk_profile,
    COALESCE(
        ARRAY(
            SELECT jsonb_array_elements_text(
                COALESCE(explicit_prefs -> 'allowed_bands', inferred_prefs -> 'allowed_bands', '[]'::jsonb)
            )
        ),
        ARRAY[]::text[]
    ) AS allowed_bands
FROM investor_profiles;

-- ── tier_gate_events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tier_gate_events (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          text,
    user_tier        text,
    gated_columns    text[],
    request_id       text,
    created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tier_gate_user
    ON tier_gate_events(user_id, created_at DESC);

-- ── notebook_provenance_log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notebook_provenance_log (
    run_id                   text PRIMARY KEY,
    snapshot_ts              timestamptz,
    exclusion_policy_version text,
    column_registry_version  text,
    sources_used             text[],
    inventory_stats          jsonb,
    data_contracts           jsonb,
    confidence_bands         jsonb,
    schema_hash              text,
    created_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prov_ts
    ON notebook_provenance_log(created_at DESC);

CREATE OR REPLACE VIEW notebook_provenance AS
SELECT
    run_id,
    snapshot_ts,
    exclusion_policy_version,
    column_registry_version,
    sources_used,
    inventory_stats,
    data_contracts,
    confidence_bands,
    schema_hash,
    created_at
FROM notebook_provenance_log;

CREATE OR REPLACE VIEW latest_provenance AS
    SELECT *
    FROM notebook_provenance_log
    ORDER BY created_at DESC
    LIMIT 1;

-- ── attribution_events ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attribution_events (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type       text NOT NULL CHECK (event_type IN (
                         'widget_view','widget_click',
                         'widget_signup','widget_upgrade')),
    widget_id        text NOT NULL,
    embed_type       text,
    source_domain    text,
    source_page_url  text,
    project_id       text,
    area             text,
    referrer_user_id text,
    new_user_id      text,
    session_id       text,
    from_tier        text,
    to_tier          text,
    days_to_convert  integer,
    mrr_delta        numeric(10,2),
    metadata         jsonb,
    created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attr_widget
    ON attribution_events(widget_id, event_type);
CREATE INDEX IF NOT EXISTS idx_attr_referrer
    ON attribution_events(referrer_user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_attr_domain
    ON attribution_events(source_domain, created_at DESC);

-- ── widgets ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS widgets (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          text NOT NULL,
    embed_type       text NOT NULL,
    project_id       text,
    area             text,
    config           jsonb,
    total_views      integer DEFAULT 0,
    total_clicks     integer DEFAULT 0,
    total_signups    integer DEFAULT 0,
    total_upgrades   integer DEFAULT 0,
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_widgets_user
    ON widgets(user_id, created_at DESC);

-- ── unit_samples ──────────────────────────────────────────────────────────
-- samples[] element schema:
--   { floor_level: int, view_type: str, bedrooms: int,
--     price_aed: float, price_vs_project_avg_pct: float, tx_date: date }
CREATE TABLE IF NOT EXISTS unit_samples (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   text NOT NULL,
    samples      jsonb NOT NULL DEFAULT '[]',
    coverage_pct numeric(5,2),
    created_at   timestamptz DEFAULT now(),
    updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unit_samples_project
    ON unit_samples(project_id);

DO $$
BEGIN
    IF to_regclass('public.inventory_full') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'inventory_full'
              AND column_name = 'project_id'
        ) THEN
            EXECUTE '
                CREATE OR REPLACE VIEW public.inventory_spine AS
                SELECT
                    i.*,
                    us.samples AS unit_sample,
                    us.coverage_pct::numeric AS unit_coverage_pct
                FROM public.inventory_full i
                LEFT JOIN public.unit_samples us
                  ON us.project_id = i.project_id::text
            ';
        ELSE
            EXECUTE '
                CREATE OR REPLACE VIEW public.inventory_spine AS
                SELECT
                    i.*,
                    NULL::jsonb AS unit_sample,
                    NULL::numeric AS unit_coverage_pct
                FROM public.inventory_full i
            ';
        END IF;
    END IF;
END $$;

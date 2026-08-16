CREATE OR REPLACE VIEW public.inventory_spine AS
SELECT *
FROM public.inventory_full;

CREATE OR REPLACE VIEW public.area_roi_summary AS
SELECT
  COALESCE(final_area, area) AS area,
  COUNT(*)::int AS projects,
  ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0))::double precision AS avg_price,
  ROUND(AVG(l1_canonical_yield::numeric), 2)::double precision AS avg_yield,
  ROUND(AVG(l3_supply_pressure::numeric), 2)::double precision AS supply_pressure,
  ROUND(AVG(engine_god_metric::numeric), 2)::double precision AS efficiency,
  COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END)::int AS buy_signals,
  COUNT(CASE WHEN l2_stress_test_grade IN ('A', 'B') THEN 1 END)::int AS safe_projects
FROM public.inventory_full
GROUP BY 1;

CREATE OR REPLACE VIEW public.developer_performance AS
SELECT
  developer,
  COUNT(*)::int AS projects,
  ROUND(AVG(l2_developer_reliability::numeric), 2)::double precision AS reliability,
  ROUND(AVG(engine_god_metric::numeric), 2)::double precision AS efficiency,
  COUNT(CASE WHEN l2_stress_test_grade IN ('A', 'B') THEN 1 END)::int AS safe_projects,
  ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0))::double precision AS avg_price,
  ARRAY_AGG(DISTINCT COALESCE(final_area, area)) AS areas
FROM public.inventory_full
WHERE developer IS NOT NULL
GROUP BY 1;

CREATE OR REPLACE FUNCTION public.rank_investors(
  p_limit integer DEFAULT 25,
  p_area text DEFAULT NULL,
  p_budget_max numeric DEFAULT NULL,
  p_timing_signal text DEFAULT NULL
)
RETURNS TABLE (
  rank integer,
  name text,
  developer text,
  area text,
  l1_canonical_price double precision,
  l1_canonical_yield double precision,
  l3_timing_signal text,
  engine_god_metric double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY engine_god_metric DESC NULLS LAST)::int AS rank,
    i.name,
    i.developer,
    COALESCE(i.final_area, i.area) AS area,
    i.l1_canonical_price::double precision,
    i.l1_canonical_yield::double precision,
    i.l3_timing_signal,
    i.engine_god_metric::double precision
  FROM public.inventory_full i
  WHERE (p_area IS NULL OR LOWER(COALESCE(i.final_area, i.area)) LIKE LOWER('%' || p_area || '%'))
    AND (p_budget_max IS NULL OR i.l1_canonical_price <= p_budget_max)
    AND (p_timing_signal IS NULL OR i.l3_timing_signal = p_timing_signal)
  LIMIT GREATEST(COALESCE(p_limit, 25), 1);
$$;

ALTER TABLE public.market_scores_v1
ADD COLUMN IF NOT EXISTS score double precision;

UPDATE public.market_scores_v1
SET score = score_0_100::double precision
WHERE score IS NULL;

CREATE OR REPLACE FUNCTION public.refresh_market_scores()
RETURNS integer
LANGUAGE sql
VOLATILE
AS $$
  UPDATE public.market_scores_v1
  SET score = score_0_100::double precision
  WHERE score IS DISTINCT FROM score_0_100::double precision;

  SELECT COUNT(*)::int
  FROM public.market_scores_v1;
$$;

CREATE OR REPLACE FUNCTION public.get_area_absorption(p_area text DEFAULT NULL)
RETURNS TABLE (
  area text,
  projects integer,
  buy_signals integer,
  safe_projects integer,
  efficiency double precision,
  supply_pressure double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    a.area::text,
    a.projects::int,
    a.buy_signals::int,
    a.safe_projects::int,
    a.efficiency::double precision,
    a.supply_pressure::double precision
  FROM public.area_roi_summary a
  WHERE (p_area IS NULL OR LOWER(a.area) LIKE LOWER('%' || p_area || '%'))
  ORDER BY a.efficiency DESC NULLS LAST;
$$;

ALTER TABLE public.entrestate_master
ALTER COLUMN price_from_aed TYPE double precision
USING NULLIF(regexp_replace(price_from_aed::text, '[^0-9\.-]', '', 'g'), '')::double precision;

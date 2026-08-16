-- Entrestate — single source of truth for headline platform metrics.
-- Closes P0-8 / Bugs 7, 8, 9.
--
-- This template comes from the finalization pack and assumes canonical
-- projects / developers / areas tables exist in the target database.

CREATE OR REPLACE VIEW v_platform_stats AS
WITH
  live_projects AS (
    SELECT *
    FROM projects
    WHERE status = 'live'
      AND is_test = false
      AND deleted_at IS NULL
  ),
  live_developers AS (
    SELECT *
    FROM developers
    WHERE is_test = false
      AND deleted_at IS NULL
      AND id IN (SELECT DISTINCT developer_id FROM live_projects WHERE developer_id IS NOT NULL)
  ),
  live_areas AS (
    SELECT *
    FROM areas
    WHERE deleted_at IS NULL
      AND id IN (SELECT DISTINCT area_id FROM live_projects WHERE area_id IS NOT NULL)
  ),
  verdict_counts AS (
    SELECT verdict, COUNT(*) AS n
    FROM live_projects
    WHERE verdict IS NOT NULL
    GROUP BY verdict
  )
SELECT
  (SELECT COUNT(*) FROM live_projects) AS projects_total,
  (SELECT COUNT(*) FROM live_developers) AS developers_total,
  (SELECT COUNT(*) FROM live_areas) AS areas_total,
  COALESCE((SELECT n FROM verdict_counts WHERE verdict = 'STRONG_BUY'), 0) AS strong_buy_count,
  COALESCE((SELECT n FROM verdict_counts WHERE verdict = 'BUY'), 0) AS buy_count,
  COALESCE((SELECT n FROM verdict_counts WHERE verdict = 'HOLD'), 0) AS hold_count,
  COALESCE((SELECT n FROM verdict_counts WHERE verdict = 'WAIT'), 0) AS wait_count,
  COALESCE((SELECT n FROM verdict_counts WHERE verdict = 'AVOID'), 0) AS avoid_count,
  (SELECT MAX(updated_at) FROM live_projects) AS data_last_updated,
  (SELECT COUNT(*) FROM live_projects WHERE developer_id IS NULL) AS unknown_developer_projects,
  CASE
    WHEN (SELECT COUNT(*) FROM live_projects) = 0 THEN 0
    ELSE ROUND(
      100.0 * (SELECT COUNT(*) FROM live_projects WHERE developer_id IS NOT NULL)
      / (SELECT COUNT(*) FROM live_projects),
      2
    )
  END AS developer_coverage_pct;

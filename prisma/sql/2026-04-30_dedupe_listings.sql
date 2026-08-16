-- Entrestate — one-shot dedupe for project listings on area pages.
-- Closes P1-20 / Bug 19.
--
-- This template comes from the finalization pack and assumes canonical
-- projects / developers / areas tables exist in the target database.

BEGIN;

CREATE TABLE IF NOT EXISTS _audit_dedupe_listings_2026_04_30 AS
SELECT id, name, area_id, developer_id, updated_at
FROM projects;

WITH dupes AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(name)), area_id
      ORDER BY
        (
          CASE WHEN hero_image IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN price_min IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN completion_year IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN developer_id IS NOT NULL THEN 1 ELSE 0 END
        ) DESC,
        updated_at DESC,
        created_at DESC
    ) AS rn
  FROM projects
  WHERE deleted_at IS NULL
)
UPDATE projects p
SET deleted_at = NOW(),
    deletion_reason = 'dedupe_2026_04_30'
FROM dupes d
WHERE p.id = d.id
  AND d.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_projects_name_area') THEN
    CREATE UNIQUE INDEX uq_projects_name_area
      ON projects (LOWER(TRIM(name)), area_id)
      WHERE deleted_at IS NULL;
  END IF;
END $$;

COMMIT;

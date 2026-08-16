-- Entrestate — remove or quarantine test data.
-- Closes P0-10 / Bug 11.
--
-- This template comes from the finalization pack and assumes canonical
-- projects / developers / areas tables exist in the target database.

BEGIN;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

UPDATE projects
SET is_test = TRUE
WHERE name ILIKE '%floating resort%'
   OR name ILIKE '%sea palace%'
   OR price_min IN (111111, 999999, 123456, 100000, 1000000)
   OR yield_pct IN (15.00, 20.00, 25.00) AND name IS NULL;

UPDATE developers
SET is_test = TRUE
WHERE name ILIKE 'test%'
   OR name ILIKE 'demo%'
   OR name ILIKE 'sample%';

SELECT 'projects' AS entity, COUNT(*) FILTER (WHERE is_test) AS marked_test, COUNT(*) AS total FROM projects
UNION ALL
SELECT 'developers', COUNT(*) FILTER (WHERE is_test), COUNT(*) FROM developers
UNION ALL
SELECT 'areas', COUNT(*) FILTER (WHERE is_test), COUNT(*) FROM areas;

COMMIT;

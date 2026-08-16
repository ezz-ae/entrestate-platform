-- Optional index helpers for Market Score filters.
-- Apply in Neon if query latency requires it.

CREATE INDEX IF NOT EXISTS market_scores_v1_city_idx ON market_scores_v1 (city);
CREATE INDEX IF NOT EXISTS market_scores_v1_area_idx ON market_scores_v1 (area);
CREATE INDEX IF NOT EXISTS market_scores_v1_status_band_idx ON market_scores_v1 (status_band);
CREATE INDEX IF NOT EXISTS market_scores_v1_safety_band_idx ON market_scores_v1 (safety_band);

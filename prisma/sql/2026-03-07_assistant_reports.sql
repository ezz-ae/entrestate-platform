CREATE TABLE IF NOT EXISTS public.assistant_reports (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  team_id text NULL,
  title text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assistant_reports_user_id_created_at_idx
  ON public.assistant_reports (user_id, created_at);

CREATE INDEX IF NOT EXISTS assistant_reports_team_id_created_at_idx
  ON public.assistant_reports (team_id, created_at);

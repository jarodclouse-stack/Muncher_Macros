-- Migration: user_integrations — fitness tracker OAuth token storage
-- Apply via: Supabase Dashboard → SQL Editor → Run

CREATE TABLE IF NOT EXISTS user_integrations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL,  -- references auth.users(id), no FK so service role can insert freely
  provider             TEXT NOT NULL CHECK (provider IN ('fitbit', 'google_fit')),
  access_token         TEXT NOT NULL,
  refresh_token        TEXT,
  token_expires_at     TIMESTAMPTZ,
  last_synced_at       TIMESTAMPTZ,
  last_calories_burned INTEGER,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can read their own integration status (not the raw tokens — those are never returned to the client)
CREATE POLICY "Users read own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

-- All writes happen via service-role API endpoints (fitbit-callback, google-fit-callback, etc.)
-- No client-side INSERT/UPDATE/DELETE policies needed.

-- =============================================================
-- PHASE 2: Search synonyms table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

CREATE TABLE IF NOT EXISTS search_synonyms (
  term    TEXT PRIMARY KEY,
  expands TEXT NOT NULL
);

-- RLS: publicly readable, no public writes
ALTER TABLE search_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "synonyms_select_all" ON search_synonyms
  FOR SELECT USING (true);

CREATE POLICY "synonyms_no_public_insert" ON search_synonyms
  FOR INSERT WITH CHECK (false);

CREATE POLICY "synonyms_no_public_update" ON search_synonyms
  FOR UPDATE USING (false);

CREATE POLICY "synonyms_no_public_delete" ON search_synonyms
  FOR DELETE USING (false);

-- =============================================================
-- PHASE 1: Foods table + fuzzy search
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- 1. Enable trigram extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create the foods table
CREATE TABLE IF NOT EXISTS foods (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  brand       TEXT DEFAULT '',
  serving     TEXT NOT NULL DEFAULT '100 g',
  s_qty       NUMERIC DEFAULT 100,
  s_unit      TEXT DEFAULT 'g',

  -- Macros
  cal         NUMERIC DEFAULT 0,
  p           NUMERIC DEFAULT 0,
  c           NUMERIC DEFAULT 0,
  f           NUMERIC DEFAULT 0,

  -- Secondary macros
  fiber       NUMERIC DEFAULT 0,
  sugars      NUMERIC DEFAULT 0,
  sat         NUMERIC DEFAULT 0,
  mono        NUMERIC DEFAULT 0,
  poly        NUMERIC DEFAULT 0,
  trans       NUMERIC DEFAULT 0,
  chol        NUMERIC DEFAULT 0,

  -- Minerals
  sodium      NUMERIC DEFAULT 0,
  potassium   NUMERIC DEFAULT 0,
  calcium     NUMERIC DEFAULT 0,
  magnesium   NUMERIC DEFAULT 0,
  iron        NUMERIC DEFAULT 0,
  zinc        NUMERIC DEFAULT 0,
  phosphorus  NUMERIC DEFAULT 0,
  manganese   NUMERIC DEFAULT 0,
  selenium    NUMERIC DEFAULT 0,
  copper      NUMERIC DEFAULT 0,
  chloride    NUMERIC DEFAULT 0,
  iodine      NUMERIC DEFAULT 0,
  chromium    NUMERIC DEFAULT 0,
  molybdenum  NUMERIC DEFAULT 0,
  fluoride    NUMERIC DEFAULT 0,

  -- Vitamins
  vitamin_c   NUMERIC DEFAULT 0,
  vitamin_a   NUMERIC DEFAULT 0,
  vitamin_d   NUMERIC DEFAULT 0,
  vitamin_e   NUMERIC DEFAULT 0,
  vitamin_k   NUMERIC DEFAULT 0,
  vitamin_b1  NUMERIC DEFAULT 0,
  vitamin_b2  NUMERIC DEFAULT 0,
  vitamin_b3  NUMERIC DEFAULT 0,
  vitamin_b5  NUMERIC DEFAULT 0,
  vitamin_b6  NUMERIC DEFAULT 0,
  vitamin_b7  NUMERIC DEFAULT 0,
  vitamin_b9  NUMERIC DEFAULT 0,
  vitamin_b12 NUMERIC DEFAULT 0,

  -- Meta
  barcode     TEXT,
  source      TEXT DEFAULT 'usda',
  usda_fdc_id INTEGER UNIQUE,
  popularity  INTEGER DEFAULT 0,
  search_vector TSVECTOR,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON foods USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_foods_search_vector ON foods USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_foods_popularity ON foods (popularity DESC);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods (barcode) WHERE barcode IS NOT NULL;

-- 4. Trigger: auto-populate search_vector from name + brand
CREATE OR REPLACE FUNCTION foods_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.name, '') || ' ' || coalesce(NEW.brand, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_foods_search_vector ON foods;
CREATE TRIGGER trg_foods_search_vector
  BEFORE INSERT OR UPDATE ON foods
  FOR EACH ROW
  EXECUTE FUNCTION foods_search_vector_update();

-- 5. RLS: publicly readable, service role only for writes
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foods_select_all" ON foods
  FOR SELECT USING (true);

-- Service role bypasses RLS entirely, so no permissive policy needed for it.
-- These block all other roles (anon, authenticated) from writing.
CREATE POLICY "foods_no_public_insert" ON foods
  FOR INSERT WITH CHECK (false);

CREATE POLICY "foods_no_public_update" ON foods
  FOR UPDATE USING (false);

CREATE POLICY "foods_no_public_delete" ON foods
  FOR DELETE USING (false);

-- 6. Search function: fuzzy + full-text + popularity ranking
CREATE OR REPLACE FUNCTION search_foods(query_text TEXT, result_limit INTEGER DEFAULT 25)
RETURNS TABLE (
  id UUID, name TEXT, brand TEXT, serving TEXT, s_qty NUMERIC, s_unit TEXT,
  cal NUMERIC, p NUMERIC, c NUMERIC, f NUMERIC,
  fiber NUMERIC, sugars NUMERIC, sat NUMERIC, mono NUMERIC, poly NUMERIC,
  trans NUMERIC, chol NUMERIC, sodium NUMERIC, potassium NUMERIC,
  calcium NUMERIC, magnesium NUMERIC, iron NUMERIC, zinc NUMERIC,
  phosphorus NUMERIC, manganese NUMERIC, selenium NUMERIC, copper NUMERIC,
  chloride NUMERIC, iodine NUMERIC, chromium NUMERIC, molybdenum NUMERIC, fluoride NUMERIC,
  vitamin_c NUMERIC, vitamin_a NUMERIC, vitamin_d NUMERIC, vitamin_e NUMERIC,
  vitamin_k NUMERIC, vitamin_b1 NUMERIC, vitamin_b2 NUMERIC, vitamin_b3 NUMERIC,
  vitamin_b5 NUMERIC, vitamin_b6 NUMERIC, vitamin_b7 NUMERIC, vitamin_b9 NUMERIC,
  vitamin_b12 NUMERIC,
  barcode TEXT, source TEXT, popularity INTEGER,
  rank_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fd.id, fd.name, fd.brand, fd.serving, fd.s_qty, fd.s_unit,
    fd.cal, fd.p, fd.c, fd.f,
    fd.fiber, fd.sugars, fd.sat, fd.mono, fd.poly,
    fd.trans, fd.chol, fd.sodium, fd.potassium,
    fd.calcium, fd.magnesium, fd.iron, fd.zinc,
    fd.phosphorus, fd.manganese, fd.selenium, fd.copper,
    fd.chloride, fd.iodine, fd.chromium, fd.molybdenum, fd.fluoride,
    fd.vitamin_c, fd.vitamin_a, fd.vitamin_d, fd.vitamin_e,
    fd.vitamin_k, fd.vitamin_b1, fd.vitamin_b2, fd.vitamin_b3,
    fd.vitamin_b5, fd.vitamin_b6, fd.vitamin_b7, fd.vitamin_b9,
    fd.vitamin_b12,
    fd.barcode, fd.source, fd.popularity,
    (
      COALESCE(similarity(fd.name, query_text), 0) * 3.0
      + COALESCE(ts_rank(fd.search_vector, plainto_tsquery('english', query_text)), 0) * 2.0
      + LEAST(LN(GREATEST(fd.popularity, 1))::REAL / 10.0, 1.0)
    )::REAL AS rank_score
  FROM foods fd
  WHERE
    similarity(fd.name, query_text) > 0.1
    OR fd.search_vector @@ plainto_tsquery('english', query_text)
  ORDER BY rank_score DESC, fd.popularity DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

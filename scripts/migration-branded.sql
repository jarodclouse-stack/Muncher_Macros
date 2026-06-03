-- =============================================================
-- CURATED BRANDED FOODS: priority column + ranking boost
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- 1. Add a priority column (separate from log-derived popularity).
--    Curated branded foods get a high priority so they rank at the top
--    of their query. Survives popularity refreshes (which only touch popularity).
ALTER TABLE foods ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- 2. Update the search function to add a priority bonus, but ONLY when the
--    item genuinely matches (substring or full-text) — so a curated item
--    never jumps to the top of an unrelated query.
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
      -- Exact substring match in name gets huge bonus
      CASE WHEN LOWER(fd.name) LIKE '%' || LOWER(query_text) || '%' THEN 10.0 ELSE 0 END
      -- Bonus for name STARTING with the query
      + CASE WHEN LOWER(fd.name) LIKE LOWER(query_text) || '%' THEN 5.0 ELSE 0 END
      -- Shorter names rank higher (more specific match)
      + CASE WHEN LENGTH(fd.name) < 40 THEN 1.0 WHEN LENGTH(fd.name) < 60 THEN 0.5 ELSE 0 END
      -- Trigram similarity (0-3)
      + COALESCE(similarity(fd.name, query_text), 0) * 3.0
      -- Full-text rank (0-2)
      + COALESCE(ts_rank(fd.search_vector, plainto_tsquery('english', query_text)), 0) * 2.0
      -- Popularity bonus (0-1)
      + LEAST(LN(GREATEST(fd.popularity, 1))::REAL / 10.0, 1.0)
      -- Curated priority bonus — ONLY on a word-level match (full-text), so a
      -- query like "cola" doesn't boost "choCOLAte" via a mid-word substring.
      + CASE WHEN fd.search_vector @@ plainto_tsquery('english', query_text)
             THEN fd.priority ELSE 0 END
    )::REAL AS rank_score
  FROM foods fd
  WHERE
    LOWER(fd.name) LIKE '%' || LOWER(query_text) || '%'
    OR similarity(fd.name, query_text) > 0.15
    OR fd.search_vector @@ plainto_tsquery('english', query_text)
  ORDER BY rank_score DESC, fd.popularity DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

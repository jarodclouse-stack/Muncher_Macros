-- =============================================================
-- PHASE 3: Popularity ranking from user food logs
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- Function to count food name occurrences across all user food logs
-- and update foods.popularity accordingly.
-- Idempotent: resets all to 0, then recalculates from scratch.

CREATE OR REPLACE FUNCTION refresh_food_popularity()
RETURNS void AS $$
BEGIN
  -- Reset all popularity to 0
  UPDATE foods SET popularity = 0;

  -- Count food name occurrences across all user food logs
  -- Food logs are stored as: user_data.data[date_key].foodLog[i].f.name
  WITH food_counts AS (
    SELECT
      LOWER(TRIM(log_entry->'f'->>'name')) AS food_name,
      COUNT(*) AS cnt
    FROM user_data,
      LATERAL jsonb_each(data) AS date_entries(date_key, date_val),
      LATERAL jsonb_array_elements(
        CASE WHEN date_val ? 'foodLog' THEN date_val->'foodLog' ELSE '[]'::jsonb END
      ) AS log_entry
    WHERE date_key ~ '^\d{4}-\d{2}-\d{2}$'   -- Only date keys, skip settings/goals/customFoods
      AND log_entry ? 'f'
      AND log_entry->'f' ? 'name'
    GROUP BY LOWER(TRIM(log_entry->'f'->>'name'))
  )
  UPDATE foods
  SET popularity = fc.cnt
  FROM food_counts fc
  WHERE LOWER(foods.name) = fc.food_name;
END;
$$ LANGUAGE plpgsql;

-- Run it once immediately to populate initial values
SELECT refresh_food_popularity();

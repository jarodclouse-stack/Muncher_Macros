-- =============================================================
-- PHASE 2: Subscriptions + RLS Hardening
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- 1. Create the user_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create index on the user_id to ensure fast authentication checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- 3. Add is_pro and stripe_customer_id columns if they don't exist
ALTER TABLE user_data ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;
ALTER TABLE user_data ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 5. Set RLS Policies so users can only touch their own data
DROP POLICY IF EXISTS "Allow users to read their own data" ON user_data;
CREATE POLICY "Allow users to read their own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own data" ON user_data;
CREATE POLICY "Allow users to insert their own data" ON user_data
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND is_pro = false -- Client-side insertions must default to non-Pro
  );

DROP POLICY IF EXISTS "Allow users to update their own data" ON user_data;
CREATE POLICY "Allow users to update their own data" ON user_data
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      -- Prevent client-side updates from changing the existing is_pro value
      is_pro = (SELECT is_pro FROM user_data WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow users to delete their own data" ON user_data;
CREATE POLICY "Allow users to delete their own data" ON user_data
  FOR DELETE USING (auth.uid() = user_id);

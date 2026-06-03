-- =============================================================
-- Migration: Create Search Cache Table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.search_cache (
  query_hash TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) for database hygiene
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Since the Vercel serverless API endpoints access this table using the 
-- service_role secret key, they will automatically bypass RLS checks.
-- We intentionally do NOT define any public SELECT or INSERT policies,
-- which prevents malicious clients from direct queries/modification.

-- Comment on table
COMMENT ON TABLE public.search_cache IS 'Caches normalized AI nutrient results to eliminate redundant Anthropic API calls and costs.';

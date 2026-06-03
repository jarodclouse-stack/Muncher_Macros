// src/lib/api.ts — Authenticated API fetch helper
import { supabase } from './supabase';

/**
 * Returns headers including the current Supabase session's JWT token
 * for authenticated API calls. Falls back gracefully if no session exists.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // No session available — request will proceed without auth
  }

  return headers;
}

/**
 * Authenticated fetch wrapper for API endpoints.
 * Automatically attaches the Supabase JWT token.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
}

// api/tracker-status.js — Return connection status for all fitness tracker integrations
import { setCors, handlePreflight } from '../cors.js';
import { requireAuth } from '../auth.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: integrations } = await supabase
    .from('user_integrations')
    .select('provider, last_synced_at, last_calories_burned, token_expires_at')
    .eq('user_id', user.id);

  const status = { fitbit: { connected: false }, google_fit: { connected: false } };

  for (const row of integrations || []) {
    status[row.provider] = {
      connected: true,
      last_synced_at: row.last_synced_at,
      last_calories_burned: row.last_calories_burned,
      token_expired: row.token_expires_at ? new Date(row.token_expires_at) <= new Date() : false,
    };
  }

  res.json(status);
}

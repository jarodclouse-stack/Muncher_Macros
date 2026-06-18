// api/tracker-disconnect.js — Remove a fitness tracker integration
import { setCors, handlePreflight } from '../cors.js';
import { requireAuth } from '../auth.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { provider } = req.body;
  if (!provider || !['fitbit', 'google_fit'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
}

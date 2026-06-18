// api/fitbit-sync.js — Fetch today's calorie burn from Fitbit and update DB
// Required env vars: FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { setCors, handlePreflight } from '../cors.js';
import { requireAuth } from '../auth.js';
import { createClient } from '@supabase/supabase-js';

async function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function refreshFitbitToken(integration, supabase) {
  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: integration.refresh_token,
    }),
  });

  if (!res.ok) throw new Error('Fitbit token refresh failed');

  const tokens = await res.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from('user_integrations')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || integration.refresh_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', integration.user_id)
    .eq('provider', 'fitbit');

  return tokens.access_token;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = await getServiceClient();

  // Load stored tokens
  const { data: integration, error: dbError } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'fitbit')
    .single();

  if (dbError || !integration) {
    return res.status(404).json({ error: 'Fitbit not connected' });
  }

  // Refresh access token if expired
  let accessToken = integration.access_token;
  if (new Date(integration.token_expires_at) <= new Date()) {
    try {
      accessToken = await refreshFitbitToken({ ...integration, user_id: user.id }, supabase);
    } catch {
      return res.status(401).json({ error: 'Fitbit token expired — please reconnect', code: 'RECONNECT_REQUIRED' });
    }
  }

  // Fetch Fitbit daily activity summary
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const activityRes = await fetch(
    `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!activityRes.ok) {
    return res.status(activityRes.status).json({ error: 'Fitbit API error' });
  }

  const activityData = await activityRes.json();
  // caloriesOut = total TDEE (BMR + active). This is what we want.
  const caloriesBurned = activityData.summary?.caloriesOut || 0;
  const activeCalories = activityData.summary?.activityCalories || 0;

  // Update sync timestamp and last burn in DB
  await supabase
    .from('user_integrations')
    .update({
      last_synced_at: new Date().toISOString(),
      last_calories_burned: caloriesBurned,
    })
    .eq('user_id', user.id)
    .eq('provider', 'fitbit');

  res.json({ caloriesBurned, activeCalories, date, source: 'fitbit' });
}

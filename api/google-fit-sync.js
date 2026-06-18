// api/google-fit-sync.js — Fetch today's calorie burn from Google Fit and update DB
// Required env vars: GOOGLE_FIT_CLIENT_ID, GOOGLE_FIT_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { setCors, handlePreflight } from './_lib/cors.js';
import { requireAuth } from './_lib/auth.js';
import { createClient } from '@supabase/supabase-js';

async function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function refreshGoogleToken(integration, supabase) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: integration.refresh_token,
      client_id: process.env.GOOGLE_FIT_CLIENT_ID,
      client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error('Google token refresh failed');

  const tokens = await res.json();
  const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

  await supabase
    .from('user_integrations')
    .update({
      access_token: tokens.access_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', integration.user_id)
    .eq('provider', 'google_fit');

  return tokens.access_token;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = await getServiceClient();

  const { data: integration, error: dbError } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google_fit')
    .single();

  if (dbError || !integration) {
    return res.status(404).json({ error: 'Google Fit not connected' });
  }

  let accessToken = integration.access_token;
  if (new Date(integration.token_expires_at) <= new Date()) {
    try {
      accessToken = await refreshGoogleToken({ ...integration, user_id: user.id }, supabase);
    } catch {
      return res.status(401).json({ error: 'Google Fit token expired — please reconnect', code: 'RECONNECT_REQUIRED' });
    }
  }

  // Build time window for the requested date (midnight to midnight in ms)
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const startMs = new Date(date + 'T00:00:00Z').getTime();
  const endMs = new Date(date + 'T23:59:59Z').getTime();

  // Google Fit aggregate endpoint — sum calories expended for the day
  const fitRes = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.calories.expended' }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startMs,
        endTimeMillis: endMs,
      }),
    }
  );

  if (!fitRes.ok) {
    return res.status(fitRes.status).json({ error: 'Google Fit API error' });
  }

  const fitData = await fitRes.json();

  // Extract total calories from the first bucket's data points
  let caloriesBurned = 0;
  const bucket = fitData.bucket?.[0];
  if (bucket) {
    for (const ds of bucket.dataset || []) {
      for (const pt of ds.point || []) {
        for (const v of pt.value || []) {
          caloriesBurned += v.fpVal || 0;
        }
      }
    }
  }
  caloriesBurned = Math.round(caloriesBurned);

  await supabase
    .from('user_integrations')
    .update({
      last_synced_at: new Date().toISOString(),
      last_calories_burned: caloriesBurned,
    })
    .eq('user_id', user.id)
    .eq('provider', 'google_fit');

  res.json({ caloriesBurned, date, source: 'google_fit' });
}

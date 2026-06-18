// api/google-fit-auth.js — Initiate Google Fit / Health Connect OAuth flow
// Required env vars: GOOGLE_FIT_CLIENT_ID, APP_URL
import { setCors, handlePreflight } from './_lib/cors.js';
import { requireAuth } from './_lib/auth.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const clientId = process.env.GOOGLE_FIT_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Google Fit integration not configured — add GOOGLE_FIT_CLIENT_ID to Vercel env vars' });
  }

  const appUrl = process.env.APP_URL || 'https://munchermacros.digital';
  const redirectUri = `${appUrl}/api/google-fit-callback`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  // Fitness activity (calories) + body (weight sync)
  authUrl.searchParams.set('scope', [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
  ].join(' '));
  authUrl.searchParams.set('state', user.id);
  authUrl.searchParams.set('access_type', 'offline');  // Get refresh token
  authUrl.searchParams.set('prompt', 'consent');        // Always show consent (ensures refresh token)

  res.json({ url: authUrl.toString() });
}

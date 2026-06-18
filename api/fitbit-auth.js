// api/fitbit-auth.js — Initiate Fitbit OAuth 2.0 flow
// Required env vars: FITBIT_CLIENT_ID, APP_URL
import { setCors, handlePreflight } from './_lib/cors.js';
import { requireAuth } from './_lib/auth.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const clientId = process.env.FITBIT_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Fitbit integration not configured — add FITBIT_CLIENT_ID to Vercel env vars' });
  }

  const appUrl = process.env.APP_URL || 'https://munchermacros.digital';
  const redirectUri = `${appUrl}/api/fitbit-callback`;

  const authUrl = new URL('https://www.fitbit.com/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'activity heartrate profile settings');
  authUrl.searchParams.set('state', user.id); // user ID used as anti-CSRF state
  authUrl.searchParams.set('expires_in', '604800'); // 7 days

  res.json({ url: authUrl.toString() });
}

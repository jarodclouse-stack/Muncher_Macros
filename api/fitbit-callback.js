// api/fitbit-callback.js — Fitbit OAuth callback: exchange code → tokens → store in Supabase
// Required env vars: FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, APP_URL
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { code, state: userId, error: oauthError } = req.query;
  const appUrl = process.env.APP_URL || 'https://munchermacros.digital';

  if (oauthError || !code || !userId) {
    return res.redirect(`${appUrl}/?tracker_error=fitbit_denied`);
  }

  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/fitbit-callback`;

  try {
    // Exchange authorization code for access + refresh tokens
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[fitbit-callback] Token exchange failed:', err);
      return res.redirect(`${appUrl}/?tracker_error=fitbit_token_failed`);
    }

    const tokens = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store tokens in Supabase using service role (bypasses RLS)
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          provider: 'fitbit',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      );

    if (dbError) {
      console.error('[fitbit-callback] DB error:', dbError.message);
      return res.redirect(`${appUrl}/?tracker_error=fitbit_db_failed`);
    }

    // Redirect back to the app with success signal
    res.redirect(`${appUrl}/?tracker_connected=fitbit`);
  } catch (err) {
    console.error('[fitbit-callback] Unexpected error:', err.message);
    res.redirect(`${appUrl}/?tracker_error=fitbit_failed`);
  }
}

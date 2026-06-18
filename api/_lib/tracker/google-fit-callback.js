// api/google-fit-callback.js — Google Fit OAuth callback: exchange code → tokens → store
// Required env vars: GOOGLE_FIT_CLIENT_ID, GOOGLE_FIT_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_URL
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { code, state: userId, error: oauthError } = req.query;
  const appUrl = process.env.APP_URL || 'https://munchermacros.digital';

  if (oauthError || !code || !userId) {
    return res.redirect(`${appUrl}/?tracker_error=google_fit_denied`);
  }

  const clientId = process.env.GOOGLE_FIT_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/google-fit-callback`;

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[google-fit-callback] Token exchange failed:', err);
      return res.redirect(`${appUrl}/?tracker_error=google_fit_token_failed`);
    }

    const tokens = await tokenRes.json();
    // Google returns expires_in in seconds from now
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    // Store in Supabase using service role
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          provider: 'google_fit',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token, // Only present on first auth
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      );

    if (dbError) {
      console.error('[google-fit-callback] DB error:', dbError.message);
      return res.redirect(`${appUrl}/?tracker_error=google_fit_db_failed`);
    }

    res.redirect(`${appUrl}/?tracker_connected=google_fit`);
  } catch (err) {
    console.error('[google-fit-callback] Unexpected error:', err.message);
    res.redirect(`${appUrl}/?tracker_error=google_fit_failed`);
  }
}

import { requireAuth } from './_lib/auth.js';
import { setCors, handlePreflight } from './_lib/cors.js';
import { getSupabase } from './_lib/supabase-client.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database client not initialized' });
  }

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (error || !data?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active Stripe customer found for this account. Please upgrade first.' });
    }

    const origin = req.headers.origin || 'http://localhost:5173';
    const params = new URLSearchParams({
      customer: data.stripe_customer_id,
      return_url: `${origin}/`
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const portalSession = await stripeRes.json();
    if (!stripeRes.ok) {
      throw new Error(portalSession.error?.message || 'Failed to create Billing Portal session');
    }

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('[stripe] Portal error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

import { requireAuth } from '../auth.js';
import { setCors, handlePreflight } from '../cors.js';

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

  const priceId = process.env.STRIPE_PRICE_ID || 'price_placeholder_muncher_premium';
  const origin = req.headers.origin || 'http://localhost:5173';

  try {
    const params = new URLSearchParams({
      success_url: `${origin}/?stripe_checkout=success`,
      cancel_url: `${origin}/?stripe_checkout=cancel`,
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      client_reference_id: user.id,
      customer_email: user.email || ''
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      throw new Error(session.error?.message || 'Failed to create Stripe Checkout session');
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[stripe] Checkout error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

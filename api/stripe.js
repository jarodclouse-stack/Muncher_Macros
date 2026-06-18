import createCheckoutSession from './_lib/stripe/create-checkout-session.js';
import createPortalSession from './_lib/stripe/create-portal-session.js';
import stripeWebhook from './_lib/stripe/stripe-webhook.js';

export default async function handler(req, res) {
  let action = req.query?.action;
  if (!action) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    action = url.searchParams.get('action');
  }

  switch (action) {
    case 'checkout': return createCheckoutSession(req, res);
    case 'portal': return createPortalSession(req, res);
    case 'webhook': return stripeWebhook(req, res);
    default: return res.status(404).json({ error: 'Unknown or missing action parameter' });
  }
}

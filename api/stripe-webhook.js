import crypto from 'crypto';
import { getSupabase } from './_lib/supabase-client.js';

async function readRawBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', () => resolve(''));
  });
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  
  const parts = signatureHeader.split(',');
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Part = parts.find(p => p.startsWith('v1='));
  
  if (!tPart || !v1Part) return false;
  
  const timestamp = tPart.split('=')[1];
  const signature = v1Part.split('=')[1];
  
  const payload = `${timestamp}.${rawBody}`;
  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return computedHash === signature;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const signatureHeader = req.headers['stripe-signature'] || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const rawBody = await readRawBody(req);

  // In production, enforce webhook signature verification
  if (webhookSecret) {
    const isValid = verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
    if (!isValid) {
      console.error('[stripe-webhook] Signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  } else {
    console.warn('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured — skipping signature verification (local testing)');
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database client not initialized' });
  }

  try {
    const type = event.type;
    console.log(`[stripe-webhook] Received event: ${type}`);

    if (type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customerId = session.customer;

      if (userId && customerId) {
        // Update user to Pro status and store their Customer ID
        const { error } = await supabase
          .from('user_data')
          .upsert(
            { user_id: userId, is_pro: true, stripe_customer_id: customerId, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );

        if (error) throw error;
        console.log(`[stripe-webhook] Successfully upgraded user ${userId} to Pro.`);
      }
    } else if (type === 'customer.subscription.deleted' || type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // If the subscription is cancelled or unpaid, set is_pro to false
      const status = subscription.status;
      const isUnpaid = ['canceled', 'unpaid', 'incomplete_expired'].includes(status);

      if (customerId && (type === 'customer.subscription.deleted' || isUnpaid)) {
        const { error } = await supabase
          .from('user_data')
          .update({ is_pro: false, updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId);

        if (error) throw error;
        console.log(`[stripe-webhook] Downgraded subscription for customer ${customerId} (status: ${status}).`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

import { setCors } from './_lib/cors.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const secret = req.query?.secret || req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();

  if (!apiKey) {
    return res.status(200).json({ status: 'error', message: 'ANTHROPIC_API_KEY not set' });
  }

  try {
    const modelsRes = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
    });
    const data = await modelsRes.json();
    const models = (data.data || []).map(m => m.id);

    return res.status(200).json({
      status: modelsRes.ok ? 'ok' : 'error',
      httpStatus: modelsRes.status,
      keyConfigured: true,
      availableModels: models,
    });
  } catch (err) {
    return res.status(200).json({ status: 'fetch_error', message: err.message });
  }
}

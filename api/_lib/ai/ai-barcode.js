import https from 'https';
import { setCors, handlePreflight } from '../cors.js';
import { validateImage, readBody } from '../validate.js';
import { rateLimit, checkAiQuota } from '../rate-limit.js';
import { requireAuth } from '../auth.js';

const MODELS = [
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-haiku-4-5-20241022',
  'claude-haiku-4-5-20241001',
];

async function anthropicRequest(prompt, apiKey, modelIndex = 0) {
  const model = MODELS[modelIndex];
  return new Promise((resolve, reject) => {
    const apiReq = https.request('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }, (res) => {
      let str = '';
      res.on('data', chunk => str += chunk);
      res.on('end', () => {
        try {
          const body = JSON.parse(str);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
          else {
            if (modelIndex < MODELS.length - 1) {
              console.log(`Model ${model} failed, trying fallback...`);
              resolve(anthropicRequest(prompt, apiKey, modelIndex + 1));
            } else {
              reject(new Error(`Anthropic ${res.statusCode}: ${JSON.stringify(body)}`));
            }
          }
        } catch (e) { reject(new Error('Invalid JSON from AI')); }
      });
    });
    apiReq.on('error', reject);
    apiReq.write(JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    }));
    apiReq.end();
  });
}

const BARCODE_PROMPT = `Analyze this image and find the product barcode.
Prioritize reading the Human Readable Interpretation numbers (the digits printed directly below or beside the barcode stripes). 
These digits are usually 8, 12, or 13 numbers long.
Return ONLY the raw digit sequence (UPC/EAN). No spaces or dashes.
If NO barcode digits are found, return the text: "NO_BARCODE_DETECTED".
Return ONLY the digits or the failure phrase. No markdown or conversational text.`;

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await rateLimit(req, res))) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  if (!(await checkAiQuota(user.id, res))) return;

  const body = await readBody(req);
  const { base64, mediaType } = body;

  const imgError = validateImage(base64, mediaType);
  if (imgError) return res.status(400).json({ error: imgError });

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const mtype = mediaType || 'image/jpeg';

  try {
    const promptWithImage = [
      { type: 'image', source: { type: 'base64', media_type: mtype, data: base64 } },
      { type: 'text', text: BARCODE_PROMPT }
    ];

    const data = await anthropicRequest(promptWithImage, apiKey);
    let rawText = (data?.content?.[0]?.text || '').trim();
    
    const digits = rawText.replace(/[^\d]/g, '');
    if (!digits || digits.length < 5) {
      return res.status(200).json({ error: 'No barcode detected in image. Please try a clearer photo or enter the code manually.' });
    }

    return res.status(200).json({ code: digits });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

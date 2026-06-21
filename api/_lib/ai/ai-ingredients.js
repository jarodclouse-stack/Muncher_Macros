import https from 'https';
import { setCors, handlePreflight } from '../cors.js';
import { validateImage, readBody } from '../validate.js';
import { rateLimit, checkAiQuota } from '../rate-limit.js';
import { requireAuth } from '../auth.js';

const MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
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
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    }));
    apiReq.end();
  });
}

const INGREDIENTS_PROMPT = `GLOBAL DEEP SCAN: Extract the ingredients list from this image.
Return ONLY a strictly valid JSON object. 

Critical Rules:
1. MANDATORY KEY: 'ingredients'.
2. Return ONLY the raw string of ingredients found on the label. Do not include prefixes like "Ingredients:" or "Contains:".
3. FORMAT: Return only the final minified JSON string. No markdown, no conversation.

Example output:
{"ingredients": "Water, Sugar, Salt, Citric Acid, Natural Flavors"}`;

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
      { type: 'text', text: INGREDIENTS_PROMPT }
    ];

    const data = await anthropicRequest(promptWithImage, apiKey);
    let rawText = (data?.content?.[0]?.text || '').trim();

    if (rawText.includes('\`\`\`')) {
      rawText = rawText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }

    let parsed;
    try { parsed = JSON.parse(rawText); } 
    catch (e) { return res.status(502).json({ error: 'Invalid JSON from AI', raw: rawText.slice(0, 100) }); }

    return res.status(200).json({ ingredients: parsed.ingredients || '' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  } 
}

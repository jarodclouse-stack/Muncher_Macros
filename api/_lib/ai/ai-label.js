import https from 'https';
import { setCors, handlePreflight } from '../cors.js';
import { validateImage, readBody } from '../validate.js';
import { rateLimit, checkAiQuota } from '../rate-limit.js';
import { requireAuth } from '../auth.js';

const MODELS = [
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
];

const REQUEST_TIMEOUT_MS = 25000; // 25s timeout to safely beat Vercel's 30s limit

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
    
    apiReq.setTimeout(REQUEST_TIMEOUT_MS, () => {
      apiReq.destroy();
      reject(new Error('AI response timed out (took longer than 25 seconds). Please try a clearer or closer photo of the label.'));
    });

    apiReq.write(JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    }));
    apiReq.end();
  });
}

const LABEL_PROMPT = `GLOBAL DEEP SCAN: Extract EVERY nutritional data point from this label.
Return ONLY a strictly valid JSON object. 

Critical Rules:
1. MANDATORY MACROS: name, brand, serving, sUnit, sQty, cal, p (protein), c (carbs), f (fat), Fiber (Dietary Fiber).
2. TOTAL MINERAL & FIBER SCAN: You must scan the entire label for minerals and fibers. 
   - SODIUM: Often found in the middle section (near Cholesterol/Fiber). REQUIRED.
   - POTASSIUM: Often found in the bottom footer. REQUIRED.
   - DIETARY FIBER: Total Fiber or Dietary Fiber. REQUIRED (as "Fiber" key in grams).
   - SOLUBLE & INSOLUBLE FIBER: If "Soluble Fiber" or "Insoluble Fiber" are explicitly listed on the label below Dietary Fiber, extract them as "Soluble Fiber" and "Insoluble Fiber" in grams.
   - VITAMINS/MINERALS: Look specifically for Calcium, Iron, Vitamin D, Magnesium, Zinc, and Vitamin C.
3. DATA CROSS-CHECK: If a value is listed both in milligrams (mg) and % Daily Value, prioritize the absolute milligram/mcg value.
4. KEYS & VALUES: Use EXACT keys (e.g., "Sodium", "Magnesium", "Vitamin D", "Fiber", "Soluble Fiber", "Insoluble Fiber"). Return ONLY the raw number (integer or float). 
5. ABSENCE: If a nutrient is explicitly not listed on the label, use 0. Do not guess.
6. FORMAT: Return only the final minified JSON string. No markdown, no conversation.`;

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
      { type: 'text', text: LABEL_PROMPT }
    ];

    const data = await anthropicRequest(promptWithImage, apiKey);
    let rawText = (data?.content?.[0]?.text || '').trim();

    if (rawText.includes('```')) {
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let food;
    try { food = JSON.parse(rawText); } 
    catch (e) { return res.status(502).json({ error: 'Invalid JSON from AI', raw: rawText.slice(0, 100) }); }

    return res.status(200).json({ food });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  } 
}

// api/ai-lookup.js
// Modern AI-Native Food Search Logic

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function extractJSON(text) {
  if (!text) return null;
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(clean); } catch {}
  const aStart = clean.indexOf('['), aEnd = clean.lastIndexOf(']');
  if (aStart !== -1 && aEnd > aStart) {
    try { return JSON.parse(clean.slice(aStart, aEnd + 1)); } catch {}
  }
  const oStart = clean.indexOf('{'), oEnd = clean.lastIndexOf('}');
  if (oStart !== -1 && oEnd > oStart) {
    try { return [JSON.parse(clean.slice(oStart, oEnd + 1))]; } catch {}
  }
  return null;
}

const MODELS = [
  'claude-3-5-sonnet-20240620',
  'claude-3-haiku-20240307',
];

const https = require('https');

async function anthropicJson(prompt, apiKey, maxTokens = 4000) {
  let lastError = 'Initialization error';
  for (const model of MODELS) {
    try {
      const data = await new Promise((resolve, reject) => {
        const req = https.request('https://api.anthropic.com/v1/messages', {
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
              else reject(new Error(`Anthropic ${res.statusCode}: ${JSON.stringify(body)}`));
            } catch (e) {
               reject(new Error('Invalid JSON from AI'));
            }
          });
        });
        req.on('error', reject);
        req.write(JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        }));
        req.end();
      });

      const content = data?.content?.[0]?.text || '';
      const parsed = extractJSON(content);
      if (parsed) return parsed;
      lastError = 'Invalid JSON structure in AI response';
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(lastError);
}

function normalizeResult(f) {
  const p = Math.round((Number(f.p) || 0) * 10) / 10;
  const c = Math.round((Number(f.c) || 0) * 10) / 10;
  const fat = Math.round((Number(f.f) || 0) * 10) / 10;
  const cal = Math.round(p * 4 + c * 4 + fat * 9);

  return {
    name: String(f.name || 'Unknown Item'),
    serving: String(f.serving || '100g'),
    sQty: Number(f.sQty) || 100,
    sUnit: String(f.sUnit || 'g'),
    cal, p, c, f: fat,
    fb: Math.round((Number(f.fb) || 0) * 10) / 10,
    sat: Math.round((Number(f.sat) || 0) * 10) / 10,
    trans: Math.round((Number(f.trans) || 0) * 10) / 10,
    mono: Math.round((Number(f.mono) || 0) * 10) / 10,
    poly: Math.round((Number(f.poly) || 0) * 10) / 10,
    chol: Math.round(Number(f.chol) || 0),
    sugars: Math.round((Number(f.sugars) || 0) * 10) / 10,
    Sodium: Math.round(Number(f.Sodium) || 0),
    Potassium: Math.round(Number(f.Potassium) || 0),
    Calcium: Math.round(Number(f.Calcium) || 0),
    Iron: Math.round((Number(f.Iron) || 0) * 10) / 10,
    'Vitamin C': Math.round((Number(f['Vitamin C']) || 0) * 10) / 10,
    'Vitamin A': Math.round(Number(f['Vitamin A']) || 0),
    'Vitamin D': Math.round((Number(f['Vitamin D']) || 0) * 10) / 10,
    'Vitamin B12': Math.round((Number(f['Vitamin B12']) || 0) * 100) / 100,
    Magnesium: Math.round(Number(f.Magnesium) || 0),
    Zinc: Math.round((Number(f.Zinc) || 0) * 10) / 10,
    _src: 'ai',
    // Legacy support
    calories: cal,
    protein: p,
    carbs: c,
    fat: fat,
    fiber: Math.round((Number(f.fb) || 0) * 10) / 10,
    sugar: Math.round((Number(f.sugars) || 0) * 10) / 10,
    sodium: Math.round(Number(f.Sodium) || 0),
    potassium: Math.round(Number(f.Potassium) || 0),
    cholesterol: Math.round(Number(f.chol) || 0),
    stagedQty: (Number(f.sQty) || 100).toString(),
    stagedUnit: String(f.sUnit || 'g')
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readBody(req);
  const query = body.query || '';

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'Environment variable ANTHROPIC_API_KEY missing' });

  const prompt = `Search for nutritional data for: "${query}".
  Return a JSON array of the 5 most likely food matches.
  For each match, provide a complete nutrient breakdown scaled to a standard 100g or 1 serving size.

  JSON keys: name, serving, sQty, sUnit, cal, p, c, f, fb, sat, trans, mono, poly, chol, sugars, Sodium, Potassium, Calcium, Iron, "Vitamin C", "Vitamin A", "Vitamin D", "Magnesium", "Zinc".

  Rules:
  - Return ONLY raw JSON. No markdown fences.
  - Accuracy is paramount. Use P*4 + C*4 + F*9 for calories.`;

  try {
    const aiResults = await anthropicJson(prompt, apiKey);
    const finalFoods = aiResults.map(f => normalizeResult(f));
    return res.status(200).json({ foods: finalFoods });
  } catch (e) {
    console.error('AI Lookup Error:', e);
    return res.status(500).json({ error: 'Search failed: ' + e.message });
  }
}

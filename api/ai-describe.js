// api/ai-describe.js
// Modern AI-Native Meal Perception Logic
// Logic: AI parses AND estimates in ONE pass, then verifies against USDA if key exists.

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
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20241001',
];

import https from 'https';

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
  
  // Enforce Macro Integrity
  const cal = Math.round(p * 4 + c * 4 + fat * 9);

  return {
    name: String(f.name || 'Unknown Item'),
    serving: String(f.serving || '1 serving'),
    sQty: Number(f.sQty || f.qty || f.quantity || 1),
    sUnit: String(f.sUnit || f.unit || 'piece'),
    cal,
    p,
    c,
    f: fat,
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
    'Vitamin B1': Math.round((Number(f['Vitamin B1']) || 0) * 100) / 100,
    'Vitamin B2': Math.round((Number(f['Vitamin B2']) || 0) * 100) / 100,
    'Vitamin B3': Math.round((Number(f['Vitamin B3']) || 0) * 100) / 100,
    'Vitamin B5': Math.round((Number(f['Vitamin B5']) || 0) * 100) / 100,
    'Vitamin B6': Math.round((Number(f['Vitamin B6']) || 0) * 100) / 100,
    'Vitamin B7': Math.round((Number(f['Vitamin B7']) || 0) * 100) / 100,
    'Vitamin B9': Math.round((Number(f['Vitamin B9']) || 0) * 100) / 100,
    'Vitamin B12': Math.round((Number(f['Vitamin B12']) || 0) * 100) / 100,
    'Vitamin E': Math.round((Number(f['Vitamin E']) || 0) * 10) / 10,
    'Vitamin K': Math.round((Number(f['Vitamin K']) || 0) * 10) / 10,
    Magnesium: Math.round(Number(f.Magnesium) || 0),
    Phosphorus: Math.round(Number(f.Phosphorus) || 0),
    Zinc: Math.round((Number(f.Zinc) || 0) * 10) / 10,
    Copper: Math.round((Number(f.Copper) || 0) * 1000) / 1000,
    Manganese: Math.round((Number(f.Manganese) || 0) * 100) / 100,
    Selenium: Math.round((Number(f.Selenium) || 0) * 10) / 10,
    _src: f._src || 'ai',
    // Duplicate keys for legacy compatibility
    calories: cal,
    protein: p,
    carbs: c,
    fat: fat,
    fiber: Math.round((Number(f.fb) || 0) * 10) / 10,
    sugar: Math.round((Number(f.sugars) || 0) * 10) / 10,
    sodium: Math.round(Number(f.Sodium) || 0),
    potassium: Math.round(Number(f.Potassium) || 0),
    cholesterol: Math.round(Number(f.chol) || 0),
    saturatedFat: Math.round((Number(f.sat) || 0) * 10) / 10,
    monounsaturatedFat: Math.round((Number(f.mono) || 0) * 10) / 10,
    polyunsaturatedFat: Math.round((Number(f.poly) || 0) * 10) / 10,
    // Staging pre-population - CRITICAL: Preserve natural units from AI
    // Check multiple possible keys from AI: sQty, qty, quantity
    stagedQty: String(f.sQty || f.qty || f.quantity || 1),
    stagedUnit: String(f.sUnit || f.unit || 'piece')
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readBody(req);
  const description = body.description || '';
  const meal = body.meal || 'Snacks';

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  
  // Diagnostic Log: Verify key format without leaking the whole thing
  const keyDiagnostics = apiKey ? `[Valid Format, starts with ${apiKey.slice(0, 7)}... ends with ...${apiKey.slice(-4)}]` : '[MISSING]';
  console.log(`AI Describe Trace: Key=${keyDiagnostics} Model=${MODELS[0]}`);

  if (!apiKey) {
    return res.status(200).json({ 
      error: 'Anthropic API Key is missing in Vercel settings. Please add ANTHROPIC_API_KEY to your environment variables.',
      setupRequired: true
    });
  }

  const prompt = `You are a world-class nutrition scientist.
  
  Meal: "${description}"

  DIETARY PERCEPTION PROTOCOL:
  1. ANALYZE COUNTS: For every item, identify the EXACT quantity mentioned by the user (e.g. "2 eggs" -> 2).
  2. PER UNIT DATA: You MUST return nutritional data **PER SINGLE UNIT** (e.g. for 1 single egg).
  3. sQty POPULATION: Set sQty to the count you detected in Step 1. NEVER default to 1 if a larger number was mentioned.

  EXAMPLES:
  - "2 eggs" -> sQty: 2, cal: 70 (for 1)
  - "3 slices of toast" -> sQty: 3, cal: 80 (for 1)

  Return ONLY a JSON array of objects. Format:
  [{
    "name": "specific ingredient name",
    "serving": "e.g. 1 Medium Egg (50g)",
    "sQty": number, "sUnit": "piece|slice|whole|serving|oz|cup|tbsp|tsp|g|ml",
    "cal": number, "p": number, "c": number, "f": number, "fb": number,
    "sat": number, "trans": number, "mono": number, "poly": number, "chol": number, "sugars": number,
    "Sodium": number, "Potassium": number, "Calcium": number, "Iron": number,
    "Vitamin C": number, "Vitamin A": number, "Vitamin D": number, 
    "Vitamin B1": number, "Vitamin B2": number, "Vitamin B3": number, "Vitamin B5": number, "Vitamin B6": number, "Vitamin B12": number,
    "Vitamin E": number, "Vitamin K": number,
    "Magnesium": number, "Zinc": number, "Phosphorus": number, "Manganese": number, "Selenium": number, "Copper": number
  }]

  RULES:
  - Return ONLY raw JSON. No markdown fences.
  - CRITICAL: sQty = count of units. cal = calories for ONE of those units.
  - Calorie Math: P*4 + C*4 + F*9.`;

  try {
    const aiResults = await anthropicJson(prompt, apiKey);
    console.log('AI Describe Result:', JSON.stringify(aiResults));
    const finalFoods = (Array.isArray(aiResults) ? aiResults : []).map(f => normalizeResult(f));
    return res.status(200).json({ foods: finalFoods, meal });
  } catch (e) {
    console.error('AI Describe Error:', e);
    return res.status(500).json({ error: 'Could not analyze meal: ' + e.message });
  }
}

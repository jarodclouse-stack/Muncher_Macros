// api/ai-lookup.js
function buildPrompt(query) {
  return 'Search for foods matching: "' + query + '".\n\n' +
    'If this is a restaurant name, return its most popular menu items.\n' +
    'If this is a food or ingredient, return common variations and preparations.\n\n' +
    'Return a JSON array of up to 5 items. Each item must have ONLY these keys:\n' +
    'name, serving, sUnit, sQty, cal, p, c, f, fb, sat, trans, chol, mono, poly,\n' +
    '"Vitamin C", "Vitamin B1", "Vitamin B2", "Vitamin B3", "Vitamin B5", "Vitamin B6",\n' +
    '"Vitamin B7", "Vitamin B9", "Vitamin B12",\n' +
    '"Vitamin A", "Vitamin D", "Vitamin E", "Vitamin K",\n' +
    'Calcium, Phosphorus, Magnesium, Sodium, Potassium, Chloride,\n' +
    'Iron, Zinc, Copper, Manganese, Selenium, Iodine, Chromium, Molybdenum, Fluoride.\n\n' +
    'Rules:\n' +
    '- sUnit must be one of: g oz cup tbsp tsp piece slice whole medium large small scoop serving\n' +
    '- sQty must be a positive number\n' +
    '- All nutrient values must be numbers (use 0 if unknown)\n' +
    '- Units: vitamins B7/B9/B12/A/D/K in mcg, all others in mg, macros in g, cal in kcal\n' +
    '- sat = saturated fat (g), trans = trans fat (g), chol = cholesterol (mg), mono = monounsaturated fat (g), poly = polyunsaturated fat (g)\n' +
    '- Return ONLY the raw JSON array. No markdown. No code blocks. No explanation. Start with [ and end with ].';
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() { try { resolve(JSON.parse(raw)); } catch(e) { resolve({}); } });
    req.on('error', function() { resolve({}); });
  });
}

function extractJSON(text) {
  if (!text) return null;

  // Strip markdown code fences (handles ```json ... ``` and ``` ... ```)
  var clean = text
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // Try direct parse first
  try { return JSON.parse(clean); } catch(e) {}

  // Find outermost array
  var start = clean.indexOf('[');
  var end   = clean.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try { return JSON.parse(clean.slice(start, end + 1)); } catch(e) {}
  }

  // Find outermost object and wrap in array
  var oStart = clean.indexOf('{');
  var oEnd   = clean.lastIndexOf('}');
  if (oStart !== -1 && oEnd > oStart) {
    try { return [JSON.parse(clean.slice(oStart, oEnd + 1))]; } catch(e) {}
  }

  return null;
}

// Models available on this account (verified via /api/check)
var MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-sonnet-4-5-20250929',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = await readBody(req);
  var query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) return res.status(400).json({ error: 'Missing query' });

  var apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on Vercel' });

  var modelErrors = {};

  for (var i = 0; i < MODELS.length; i++) {
    var model = MODELS[i];
    var anthropicRes, rawBody;

    try {
      anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4000,
          messages: [{ role: 'user', content: buildPrompt(query) }]
        })
      });
      rawBody = await anthropicRes.text();
    } catch (err) {
      modelErrors[model] = 'Network error: ' + err.message;
      console.error('[ai-lookup] Network error for', model, ':', err.message);
      continue;
    }

    if (anthropicRes.status === 404) {
      modelErrors[model] = 'Model not available (404)';
      console.error('[ai-lookup] 404 for model:', model);
      continue;
    }

    if (anthropicRes.status === 401) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }

    if (anthropicRes.status === 429) {
      modelErrors[model] = 'Rate limited (429)';
      console.error('[ai-lookup] Rate limited for model:', model);
      continue;
    }

    if (!anthropicRes.ok) {
      var snippet = rawBody.slice(0, 300);
      modelErrors[model] = 'HTTP ' + anthropicRes.status + ': ' + snippet;
      console.error('[ai-lookup] HTTP', anthropicRes.status, 'for', model, snippet);
      continue;
    }

    var data;
    try { data = JSON.parse(rawBody); } catch(e) {
      modelErrors[model] = 'Non-JSON Anthropic response';
      continue;
    }

    var rawText = (data && data.content && data.content[0] && data.content[0].text) || '';
    console.log('[ai-lookup] rawText for', model, ':', rawText.slice(0, 300));

    var foods = extractJSON(rawText);

    if (!foods || !foods.length) {
      modelErrors[model] = 'Could not parse AI response: ' + rawText.slice(0, 300);
      console.error('[ai-lookup] Parse failed for', model, '- raw:', rawText.slice(0, 300));
      continue;
    }

    return res.status(200).json({ foods: Array.isArray(foods) ? foods : [foods], model: model });
  }

  console.error('[ai-lookup] All models failed. Errors:', JSON.stringify(modelErrors));
  return res.status(503).json({
    error: 'All models failed',
    details: modelErrors,
    tried: MODELS
  });
};

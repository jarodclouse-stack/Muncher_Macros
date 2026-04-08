// api/ai-meal.js
// Describes a meal in plain English → accurate nutrition.
// Pipeline:
//   1. AI extracts food items + quantities from the description
//   2. Each item is looked up in USDA FoodData Central for real fat/nutrient data
//   3. Any item not found in USDA falls back to AI estimation
//   4. Results are scaled to the quantities described and returned

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
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-3-5-haiku-20241022',
  'claude-3-5-sonnet-20241022',
];

async function anthropicJson(prompt, apiKey, maxTokens) {
  let lastError = 'Unknown Anthropic error';

  for (const model of MODELS) {
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const raw = await resp.text();

      if (resp.status === 404) {
        lastError = 'Model not available: ' + model;
        continue;
      }
      if (!resp.ok) {
        lastError = 'Anthropic error ' + resp.status + ': ' + raw.slice(0, 200);
        continue;
      }

      let data;
      try { data = JSON.parse(raw); }
      catch {
        lastError = 'Non-JSON response from Anthropic';
        continue;
      }

      const parsed = extractJSON(data?.content?.[0]?.text || '');
      if (parsed) return parsed;

      lastError = 'AI returned unparseable JSON';
    } catch (e) {
      lastError = e.message || 'Network error';
    }
  }

  throw new Error(lastError);
}

function sanitizeFoodName(name) {
  return String(name || '')
    .replace(/\s*\([^)]*specified[^)]*\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeParsedItem(item) {
  const unit = String(item?.unit || 'serving').toLowerCase();
  const qty = Number(item?.qty) > 0 ? Number(item.qty) : 1;
  const grams = Number(item?.grams) > 0 ? Number(item.grams) : 0;
  const serving_desc = String(item?.serving_desc || `${qty} ${unit}`).trim();
  return {
    name: sanitizeFoodName(item?.name || 'Unknown food'),
    qty,
    unit,
    grams,
    serving_desc
  };
}

// ── Step 1: Ask AI to parse the description into named items ─────────────────
async function parseDescription(description, apiKey) {
  const prompt = `You are a food identification assistant. Parse this meal description into individual food items using realistic USDA-style serving sizes.

Description: "${description}"

Return ONLY a JSON array. Each element:
{
  "name": "specific searchable food name (e.g. 'large egg', 'salted butter', 'broccoli', 'canned spam', 'orange juice')",
  "qty": number,
  "unit": "g|oz|cup|tbsp|tsp|piece|slice|whole|medium|large|small|scoop|serving",
  "grams": number,
  "serving_desc": "human-readable serving description, e.g. '4 large eggs' or '1/2 cup orange juice'"
}

Rules:
- Use the most specific searchable food name possible — include brand if mentioned.
- Estimate grams for EVERY item using normal USDA household serving sizes.
- Count-based foods must use realistic gram totals. Example: 1 large egg ≈ 50 g edible portion, so 4 eggs ≈ 200 g.
- For vague phrases, convert to conservative household servings:
  - "a little bit" ≈ 1 tbsp, 2 tbsp, or 1/4 cup depending on the food
  - "some" ≈ a small serving, not a large one
- Split multi-component meals into separate ingredients.
- If the user states explicit nutrient amounts (e.g. "18g sat fat"), keep that as a note in the name, but still provide realistic grams.
- Do NOT combine the whole meal into one item.
- Return ONLY the JSON array, no markdown, no explanation.`;

  const parsed = await anthropicJson(prompt, apiKey, 1000);
  return Array.isArray(parsed) ? parsed.map(normalizeParsedItem) : [];
}

function rankUsdaMatches(items, query) {
  const q = sanitizeFoodName(query).toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);

  function score(item) {
    const desc = String(item?.description || '').toLowerCase();
    const brand = String(item?.brandOwner || '').toLowerCase();
    const dataType = String(item?.dataType || '');

    let s = 0;
    if (desc === q) s += 100;
    if (desc.includes(q)) s += 35;
    s += tokens.filter(t => desc.includes(t)).length * 8;
    if (brand && q.includes(brand)) s += 15;
    if (dataType === 'SR Legacy' || dataType === 'Foundation') s += 10;
    if (item?.servingSize) s += 4;
    return s;
  }

  return [...items].sort((a, b) => score(b) - score(a));
}

// ── Step 2: Look up one food in USDA ─────────────────────────────────────────
async function lookupUSDA(foodName, usdaKey) {
  if (!usdaKey) return null;

  try {
    const cleanedName = sanitizeFoodName(foodName);
    const searchResp = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(cleanedName)}&pageSize=8&api_key=${usdaKey}`
    );
    if (!searchResp.ok) return null;

    const searchData = await searchResp.json();
    const ranked = rankUsdaMatches(searchData.foods || [], cleanedName);
    if (!ranked.length) return null;

    const top = ranked[0];
    const fdcId = top.fdcId;
    if (!fdcId) return null;

    const detailResp = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods?api_key=${usdaKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fdcIds: [fdcId], format: 'full' })
      }
    );
    if (!detailResp.ok) return null;

    const detailData = await detailResp.json();
    const detail = (Array.isArray(detailData) ? detailData : (detailData.foods || []))[0];
    if (!detail) return null;

    const fn = detail.foodNutrients || [];
    const ln = detail.labelNutrients || {};

    function gd(id) {
      const f = fn.find(x => (x.nutrient && x.nutrient.id === id) || x.nutrientId === id);
      return f ? (f.amount || f.value || 0) : 0;
    }
    function lnVal(key) { return (ln[key] && ln[key].value) || 0; }

    const srvQty = Number(detail.servingSize || top.servingSize || 100) || 100;
    const srvUnit = String(detail.servingSizeUnit || top.servingSizeUnit || 'g').toLowerCase();
    // USDA FoodData Central always returns nutrient values per 100g.
    // Scale to the actual serving size so downstream ratio math is correct.
    const scale = srvQty / 100;

    return {
      name: detail.description || top.description || cleanedName,
      serving: srvQty + srvUnit,
      sQty: srvQty,
      sUnit: srvUnit,
      cal: Math.round((gd(1008) || gd(2047)) * scale),
      p: Math.round((gd(1003)) * scale * 10) / 10,
      c: Math.round((gd(1005)) * scale * 10) / 10,
      f: Math.round((gd(1004)) * scale * 10) / 10,
      fb: Math.round((gd(1079)) * scale * 10) / 10,
      sat: Math.round((gd(1258)) * scale * 10) / 10,
      trans: Math.round((gd(1257)) * scale * 10) / 10,
      chol: Math.round((gd(1253)) * scale),
      mono: Math.round((gd(1292)) * scale * 10) / 10,
      poly: Math.round((gd(1293)) * scale * 10) / 10,
      sugars: Math.round((gd(2000) || gd(1063)) * scale * 10) / 10,
      Sodium: Math.round(gd(1093) * scale),
      Potassium: Math.round(gd(1092) * scale),
      Calcium: Math.round(gd(1087) * scale),
      Iron: Math.round(gd(1089) * scale * 10) / 10,
      'Vitamin C': Math.round(gd(1162) * scale * 10) / 10,
      'Vitamin A': Math.round(gd(1106) * scale),
      'Vitamin D': Math.round(gd(1114) * scale * 10) / 10,
      _src: 'usda'
    };
  } catch (e) {
    return null;
  }
}

// ── Step 3: AI fallback estimation for items not in USDA ─────────────────────
async function aiEstimate(parsedItems, description, apiKey) {
  const itemList = parsedItems
    .map(i => `- ${i.serving_desc} of ${i.name}${i.grams ? ` (~${i.grams}g)` : ''}`)
    .join('\n');

  const prompt = `You are a precise nutrition expert. Estimate nutrition for these specific food items using realistic USDA-style serving sizes.

IMPORTANT:
- Respect the stated item sizes and grams exactly.
- Use normal household serving sizes. Example: 1 large egg ≈ 50 g edible portion.
- If any item includes a note about a specific stated amount (e.g. "18g sat fat specified"), use that exact value.
- Keep the estimate physically plausible. Eggs should have very low carbs. Orange juice can have carbs but almost no fat.

Items:
${itemList}

Full meal description for context: "${description}"

Return ONLY a JSON array with one object per item above (in the same order). Shape:
{
  "name": "concise food name",
  "serving": "e.g. '4 large eggs (~200g)'",
  "sQty": number, "sUnit": "g|oz|cup|tbsp|tsp|piece|slice|whole|medium|scoop|serving",
  "cal": number, "p": number, "c": number, "f": number, "fb": number,
  "sat": number, "trans": number, "mono": number, "poly": number, "chol": number, "sugars": number,
  "Sodium": number, "Potassium": number, "Calcium": number, "Iron": number,
  "Vitamin C": number, "Vitamin A": number, "Vitamin D": number
}

Rules:
- sat = saturated fat g, trans = trans fat g, mono = monounsaturated g, poly = polyunsaturated g.
- f must be at least sat + trans + mono + poly, but should stay realistic for the food.
- If "X g of unsaturated fat" is stated, set mono + poly = X (about 60% mono, 40% poly), then set f accordingly.
- All numbers only. Use 0 for unknowns.
- Return ONLY the JSON array.`;

  const parsed = await anthropicJson(prompt, apiKey, 2200);
  return Array.isArray(parsed) ? parsed : [];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function estimateServingRatio(parsedItem, usdaFood) {
  const unit = String(parsedItem?.unit || 'serving').toLowerCase();
  const qty = Number(parsedItem?.qty) > 0 ? Number(parsedItem.qty) : 1;
  const grams = Number(parsedItem?.grams) > 0 ? Number(parsedItem.grams) : 0;
  const srvQty = Number(usdaFood?.sQty) > 0 ? Number(usdaFood.sQty) : 1;
  const srvUnit = String(usdaFood?.sUnit || 'serving').toLowerCase();
  const srvGrams = srvUnit === 'g' ? srvQty : null;

  const gramsPerUnit = {
    g: 1,
    oz: 28.35,
    lb: 453.6,
    cup: 240,
    tbsp: 15,
    tsp: 5
  };

  // Best case: we have a parsed gram estimate and a gram-based USDA serving.
  if (grams > 0 && srvGrams) {
    return grams / srvGrams;
  }

  // Same-unit scaling.
  if (unit === srvUnit && srvQty > 0) {
    return qty / srvQty;
  }

  // Weight/volume conversion to grams when the USDA basis is grams.
  if (gramsPerUnit[unit] && srvGrams) {
    return (qty * gramsPerUnit[unit]) / srvGrams;
  }

  // If USDA is also a count-based serving, direct ratio is safe.
  const countUnits = new Set(['piece', 'slice', 'whole', 'medium', 'large', 'small', 'scoop', 'serving']);
  if (countUnits.has(unit) && countUnits.has(srvUnit) && srvQty > 0) {
    return qty / srvQty;
  }

  // Conservative fallback: do NOT multiply a count directly against a 100g USDA basis.
  // Use one USDA serving instead of a wildly inflated estimate.
  return 1;
}

function scaleFood(food, ratio, label) {
  function r(v) { return Math.round((Number(v || 0)) * ratio * 10) / 10; }
  return {
    name: food.name,
    serving: label || food.serving,
    sQty: food.sQty,
    sUnit: food.sUnit,
    cal: Math.round((Number(food.cal) || 0) * ratio),
    p: r(food.p),
    c: r(food.c),
    f: r(food.f),
    fb: r(food.fb),
    sat: r(food.sat),
    trans: r(food.trans),
    mono: r(food.mono),
    poly: r(food.poly),
    chol: Math.round((Number(food.chol) || 0) * ratio),
    sugars: r(food.sugars),
    Sodium: Math.round((Number(food.Sodium) || 0) * ratio),
    Potassium: Math.round((Number(food.Potassium) || 0) * ratio),
    Calcium: Math.round((Number(food.Calcium) || 0) * ratio),
    Iron: r(food.Iron),
    'Vitamin C': r(food['Vitamin C']),
    'Vitamin A': Math.round((Number(food['Vitamin A']) || 0) * ratio),
    'Vitamin D': r(food['Vitamin D']),
    _src: food._src || 'usda'
  };
}


function macroCalories(p, c, f) {
  return Math.round((Math.max(0, Number(p) || 0) * 4) + (Math.max(0, Number(c) || 0) * 4) + (Math.max(0, Number(f) || 0) * 9));
}

function normalizeResult(f) {
  const sat = Math.round((Number(f.sat) || 0) * 10) / 10;
  const trans = Math.round((Number(f.trans) || 0) * 10) / 10;
  const mono = Math.round((Number(f.mono) || 0) * 10) / 10;
  const poly = Math.round((Number(f.poly) || 0) * 10) / 10;
  const fatParts = sat + trans + mono + poly;
  const fatRaw = Math.round((Number(f.f) || 0) * 10) / 10;

  return {
    name: String(f.name || 'Unknown food'),
    serving: String(f.serving || '1 serving'),
    sQty: Number(f.sQty) || 1,
    sUnit: String(f.sUnit || 'serving'),
    cal: Math.round(Number(f.cal) || 0),
    p: Math.round((Number(f.p) || 0) * 10) / 10,
    c: Math.round((Number(f.c) || 0) * 10) / 10,
    f: Math.max(fatRaw, fatParts),
    fb: Math.round((Number(f.fb) || 0) * 10) / 10,
    sat,
    trans,
    mono,
    poly,
    chol: Math.round(Number(f.chol) || 0),
    sugars: Math.round((Number(f.sugars) || 0) * 10) / 10,
    Sodium: Math.round(Number(f.Sodium) || 0),
    Potassium: Math.round(Number(f.Potassium) || 0),
    Calcium: Math.round(Number(f.Calcium) || 0),
    Iron: Math.round((Number(f.Iron) || 0) * 10) / 10,
    'Vitamin C': Math.round((Number(f['Vitamin C']) || 0) * 10) / 10,
    'Vitamin A': Math.round(Number(f['Vitamin A']) || 0),
    'Vitamin D': Math.round((Number(f['Vitamin D']) || 0) * 10) / 10,
    _src: f._src || 'ai'
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readBody(req);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const meal = typeof body.meal === 'string' ? body.meal : 'Snacks';
  if (!description) return res.status(400).json({ error: 'Missing description' });

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  const usdaKey = (process.env.USDA_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const parsedItems = await parseDescription(description, apiKey);

    if (!parsedItems || !parsedItems.length) {
      const fallback = await aiEstimate(
        [{ name: description, serving_desc: '1 serving', qty: 1, unit: 'serving', grams: 0 }],
        description,
        apiKey
      );
      return res.status(200).json({ foods: (fallback || []).map(normalizeResult), meal });
    }

    const lookupResults = await Promise.allSettled(
      parsedItems.map(item => usdaKey ? lookupUSDA(item.name, usdaKey) : Promise.resolve(null))
    );

    const foundFoods = [];
    const missedItems = [];

    parsedItems.forEach((item, i) => {
      const usdaFood = lookupResults[i].status === 'fulfilled' ? lookupResults[i].value : null;

      if (usdaFood && usdaFood.name) {
        const ratio = estimateServingRatio(item, usdaFood);
        const scaled = scaleFood(usdaFood, ratio, item.serving_desc);
        scaled.name = sanitizeFoodName(item.name);
        foundFoods.push({ idx: i, food: scaled });
      } else {
        missedItems.push({ idx: i, item });
      }
    });

    let aiFoods = [];
    if (missedItems.length) {
      const aiEstimates = await aiEstimate(missedItems.map(m => m.item), description, apiKey);
      missedItems.forEach((m, j) => {
        aiFoods.push({
          idx: m.idx,
          food: normalizeResult(aiEstimates[j] || {
            name: m.item.name,
            serving: m.item.serving_desc,
            sQty: m.item.qty || 1,
            sUnit: m.item.unit || 'serving'
          })
        });
      });
    }

    const allResults = [...foundFoods, ...aiFoods]
      .sort((a, b) => a.idx - b.idx)
      .map(x => x.food);

    const finalFoods = allResults.map(f => {
      const n = normalizeResult(f);
      n._src = f._src || 'ai';
      return n;
    });

    if (!finalFoods.length) return res.status(502).json({ error: 'No results returned' });

    return res.status(200).json({ foods: finalFoods, meal });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
};

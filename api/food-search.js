const { normalizeFoodItem, toLegacyFood } = require('../lib/food/food-normalizer');

// api/food-search.js
// Hits USDA FoodData Central + Open Food Facts in parallel for fast results.
// Nutritionix can be added later by setting NUTRITIONIX_APP_ID + NUTRITIONIX_API_KEY env vars.

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

// ── Normalize a USDA food item into app format ─────────────────────────────
// IMPORTANT: USDA FoodData Central always returns all nutrient values per 100g,
// regardless of the food's actual serving size. We must scale every value by
// (servingSize / 100) so that the stored macros match the stored sQty.
// Example: raw rice has 365 kcal/100g and servingSize=45g  →  stored cal = 164.
function normalizeUSDA(item) {
  const n = item.foodNutrients || [];
  function get(id) {
    const found = n.find(x => x.nutrientId === id || (x.nutrient && x.nutrient.id === id));
    return found ? (found.value || found.amount || 0) : 0;
  }
  const brand = (item.brandOwner || '').trim();
  const name = (item.description || '').trim() || 'Unknown food';
  const servingSize = item.servingSize || 100;
  const srv = item.servingSize ? (item.servingSize + (item.servingSizeUnit || 'g')) : '100g';
  // Scale factor: convert per-100g USDA values → per-serving values
  const scale = servingSize / 100;
  return {
    name,
    brand,
    serving: srv,
    sQty: servingSize,
    sUnit: (item.servingSizeUnit || 'g').toLowerCase(),
    cal:  Math.round((get(1008) || get(2047)) * scale),   // Energy kcal
    p:    Math.round((get(1003)) * scale * 10) / 10,       // Protein
    c:    Math.round((get(1005)) * scale * 10) / 10,       // Carbs
    f:    Math.round((get(1004)) * scale * 10) / 10,       // Total fat
    fb:   Math.round((get(1079)) * scale * 10) / 10,       // Fiber
    sugars: Math.round(((item._sugars != null ? item._sugars : (get(2000) || get(1063))) || 0) * scale * 10) / 10,
    // sat/trans/chol/mono/poly come from the batch detail fetch (also per 100g) → scale them too
    sat:  Math.round(((item._sat   != null ? item._sat   : get(1258)) || 0) * scale * 10) / 10,
    trans:Math.round(((item._trans != null ? item._trans : get(1257)) || 0) * scale * 10) / 10,
    chol: Math.round(((item._chol  != null ? item._chol  : get(1253)) || 0) * scale),
    mono: Math.round(((item._mono  != null ? item._mono  : get(1292)) || 0) * scale * 10) / 10,
    poly: Math.round(((item._poly  != null ? item._poly  : get(1293)) || 0) * scale * 10) / 10,
    Sodium:    Math.round(get(1093) * scale),
    Calcium:   Math.round(get(1087) * scale),
    Iron:      Math.round(get(1089) * scale * 10) / 10,
    Potassium: Math.round(get(1092) * scale),
    Magnesium: Math.round(get(1090) * scale),
    Phosphorus:Math.round(get(1091) * scale),
    Zinc:      Math.round(get(1095) * scale * 10) / 10,
    'Vitamin C':  Math.round(get(1162) * scale * 10) / 10,
    'Vitamin A':  Math.round(get(1106) * scale),
    'Vitamin D':  Math.round(get(1114) * scale * 10) / 10,
    'Vitamin E':  Math.round(get(1109) * scale * 10) / 10,
    'Vitamin K':  Math.round(get(1185) * scale * 10) / 10,
    'Vitamin B1': Math.round(get(1165) * scale * 100) / 100,
    'Vitamin B2': Math.round(get(1166) * scale * 100) / 100,
    'Vitamin B3': Math.round(get(1167) * scale * 10) / 10,
    'Vitamin B6': Math.round(get(1175) * scale * 100) / 100,
    'Vitamin B9': Math.round(get(1177) * scale),
    'Vitamin B12':Math.round(get(1178) * scale * 100) / 100,
    _src: 'usda'
  };
}

// ── Normalize an Open Food Facts item into app format ──────────────────────
function normalizeOFF(p) {
  const n = p.nutriments || {};
  const name = [p.brands?.split(',')[0]?.trim(), p.product_name_en || p.product_name]
    .filter(Boolean).join(' ');
  if (!name.trim()) return null;
  if (/[^\x00-\x7F\u00C0-\u024F]/.test(name)) return null;
  const srv = p.serving_size || '100g';
  return {
    name,
    serving: srv,
    sQty: parseFloat(p.serving_quantity) || 100,
    sUnit: (p.serving_quantity_unit || p.serving_size_unit || 'g').toLowerCase(),
    cal:  Math.round(n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0),
    p:    Math.round((n['proteins_serving']       || n['proteins_100g']       || 0) * 10) / 10,
    c:    Math.round((n['carbohydrates_serving']   || n['carbohydrates_100g']  || 0) * 10) / 10,
    f:    Math.round((n['fat_serving']             || n['fat_100g']            || 0) * 10) / 10,
    fb:   Math.round((n['fiber_serving']           || n['fiber_100g']          || 0) * 10) / 10,
    // Saturated & trans fat (stored as g in OFF)
    sat:  Math.round((n['saturated-fat_serving']  || n['saturated-fat_100g']  || 0) * 10) / 10,
    trans:Math.round((n['trans-fat_serving']      || n['trans-fat_100g']      || 0) * 10) / 10,
    // Cholesterol: OFF stores in g, convert to mg
    chol: Math.round((n['cholesterol_serving']    || n['cholesterol_100g']    || 0) * 1000),
    Sodium:    Math.round((n['sodium_serving']    || n['sodium_100g']    || 0) * 1000),
    Calcium:   Math.round(n['calcium_serving']    || n['calcium_100g']   || 0),
    Iron:      Math.round((n['iron_serving']       || n['iron_100g']      || 0) * 10) / 10,
    Potassium: Math.round(n['potassium_serving']  || n['potassium_100g'] || 0),
    _src: 'off'
  };
}

// ── Normalize Nutritionix item ─────────────────────────────────────────────
function normalizeNutritional(item) {
  const n = item.full_nutrients || [];
  function get(id) { const f = n.find(x => x.attr_id === id); return f ? f.value || 0 : 0; }
  return {
    name: item.food_name,
    brand: (item.brand_name || item.brand || '').trim(),
    serving: (item.serving_qty || 1) + ' ' + (item.serving_unit || 'serving'),
    sQty: item.serving_qty || 1,
    sUnit: (item.serving_unit || 'serving').toLowerCase(),
    cal:  Math.round(item.nf_calories || 0),
    p:    Math.round((item.nf_protein || 0) * 10) / 10,
    c:    Math.round((item.nf_total_carbohydrate || 0) * 10) / 10,
    f:    Math.round((item.nf_total_fat || 0) * 10) / 10,
    fb:   Math.round((item.nf_dietary_fiber || 0) * 10) / 10,
    sat:  Math.round((item.nf_saturated_fat || get(606) || 0) * 10) / 10,  // Saturated fat
    trans:Math.round((get(605)) * 10) / 10,                                // Trans fat
    chol: Math.round(item.nf_cholesterol || get(601) || 0),                // Cholesterol mg
    Sodium:    Math.round(item.nf_sodium || 0),
    Calcium:   Math.round(get(301)),
    Iron:      Math.round(get(303) * 10) / 10,
    Potassium: Math.round(item.nf_potassium || 0),
    'Vitamin C':  Math.round(get(401) * 10) / 10,
    'Vitamin A':  Math.round(get(318)),
    'Vitamin D':  Math.round(get(328) * 10) / 10,
    _src: 'nutritionix'
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readBody(req);
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) return res.status(400).json({ error: 'Missing query' });

  const USDA_KEY       = process.env.USDA_API_KEY || '';
  const NX_APP_ID      = process.env.NUTRITIONIX_APP_ID || '';
  const NX_API_KEY     = process.env.NUTRITIONIX_API_KEY || '';

  // ── USDA: 2-step fetch so we get sat fat, trans fat, and cholesterol ────────
  // Step 1: search for food names + basic macros (abridged endpoint)
  // Step 2: batch-fetch full nutrients (1258=sat, 1257=trans, 1253=chol) for found fdcIds
  async function fetchUSDA() {
    if (!USDA_KEY) return null;
    try {
      const searchResp = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=15&api_key=${USDA_KEY}`
      );
      const searchData = await searchResp.json();
      const items = searchData.foods || [];
      if (!items.length) return searchData;

      // Step 2: batch fetch sat/trans/chol/mono/poly for all found foods
      const fdcIds = items.map(f => f.fdcId).filter(Boolean);
      let _batchDebug = null;
      if (fdcIds.length) {
        try {
          // Fetch full data — no nutrients filter so we get everything including labelNutrients
          const detailResp = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods?api_key=${USDA_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fdcIds, format: 'full' })
            }
          );
          const detailData = await detailResp.json();
          const detailArr = Array.isArray(detailData) ? detailData : (detailData.foods || []);
          const firstItem = detailArr[0] || {};
          _batchDebug = {
            status: detailResp.status, count: detailArr.length,
            firstFdcId: firstItem.fdcId,
            firstFnCount: (firstItem.foodNutrients||[]).length,
            firstLabelKeys: Object.keys(firstItem.labelNutrients || {})
          };
          // Build a map of fdcId → { sat, trans, chol, mono, poly }
          // NOTE: foodNutrients values are always per 100g — normalizeUSDA scales them.
          // We intentionally do NOT use labelNutrients here because those values are
          // per-serving and would get incorrectly double-scaled by normalizeUSDA.
          const detailMap = {};
          detailArr.forEach(d => {
            if (!d.fdcId) return;
            // Standard nutrient lookup via foodNutrients array (all values per 100g)
            const fn = d.foodNutrients || [];
            function gd(id) {
              const f = fn.find(x => (x.nutrient && x.nutrient.id === id) || x.nutrientId === id);
              return f ? (f.amount || f.value || 0) : 0;
            }
            const sat    = gd(1258) || 0;   // Saturated fat  — per 100g
            const trans  = gd(1257) || 0;   // Trans fat      — per 100g
            const chol   = gd(1253) || 0;   // Cholesterol    — per 100g
            const mono   = gd(1292) || 0;   // Monounsaturated — per 100g
            const poly   = gd(1293) || 0;   // Polyunsaturated — per 100g
            const sugars = gd(2000) || gd(1063) || 0;  // Total sugars — per 100g
            detailMap[d.fdcId] = { sat, trans, chol, mono, poly, sugars };
          });
          // Merge back into search items
          items.forEach(item => {
            const d = detailMap[item.fdcId];
            if (d) { item._sat = d.sat; item._trans = d.trans; item._chol = d.chol; item._mono = d.mono; item._poly = d.poly; item._sugars = d.sugars; }
          });
        } catch (e) { _batchDebug = { error: e.message }; }
      }
      return { foods: items, _batchDebug };
    } catch (e) { return null; }
  }

  // ── Run all sources in parallel ──────────────────────────────────────────
  const [usdaResult, offResult, nxResult] = await Promise.allSettled([

    // 1. USDA FoodData Central (2-step: search + batch nutrient fetch)
    fetchUSDA(),

    // 2. Open Food Facts — 3 s timeout so a slow response never blocks the reply
    Promise.race([
      fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,product_name_en,serving_size,serving_quantity,serving_quantity_unit,serving_size_unit,nutriments,brands`
      ).then(r => r.json()).catch(() => null),
      new Promise(resolve => setTimeout(() => resolve(null), 3000))
    ]),

    // 3. Nutritionix (only if keys provided)
    (NX_APP_ID && NX_API_KEY) ? fetch(
      'https://trackapi.nutritionix.com/v2/search/instant?query=' + encodeURIComponent(query),
      { headers: { 'x-app-id': NX_APP_ID, 'x-app-key': NX_API_KEY } }
    ).then(r => r.json()).catch(() => null) : Promise.resolve(null),

  ]);

  const allFoods = [];
  const seen = new Set();

  function addFood(food) {
    if (!food || !food.name) return;
    const normalized = toLegacyFood(normalizeFoodItem(food));
    const key = ((normalized.name || '') + '|' + (normalized.brand || '')).toLowerCase().trim();
    if (seen.has(key)) return;
    seen.add(key);
    allFoods.push(normalized);
  }

  // Merge USDA results
  if (usdaResult.status === 'fulfilled' && usdaResult.value?.foods) {
    usdaResult.value.foods.slice(0, 15).forEach(item => addFood(normalizeUSDA(item)));
  }

  // Merge Open Food Facts results
  if (offResult.status === 'fulfilled' && offResult.value?.products) {
    offResult.value.products
      .filter(p => p.lang !== 'fr' && p.lang !== 'de' && p.lang !== 'es')
      .slice(0, 15)
      .forEach(p => addFood(normalizeOFF(p)));
  }

  // Merge Nutritionix results
  if (nxResult.status === 'fulfilled' && nxResult.value) {
    const branded = nxResult.value.branded || [];
    const common  = nxResult.value.common  || [];
    [...common.slice(0, 8), ...branded.slice(0, 8)].forEach(item => addFood(normalizeNutritional(item)));
  }

  if (!allFoods.length) {
    return res.status(404).json({ error: 'No results found for: ' + query });
  }

  return res.status(200).json({
    foods: allFoods,
    sources: {
      usda: usdaResult.status === 'fulfilled' && !!usdaResult.value?.foods,
      off:  offResult.status  === 'fulfilled' && !!offResult.value?.products,
      nutritionix: nxResult.status === 'fulfilled' && !!nxResult.value
    },
    _batchDebug: usdaResult.value?._batchDebug || null
  });
};

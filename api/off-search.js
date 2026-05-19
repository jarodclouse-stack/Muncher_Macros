// api/off-search.js — server-side proxy for Open Food Facts (English only)

async function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') { resolve(req.body); return; }
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function isEnglish(p) {
  // Must have an English product name
  const name = p.product_name_en || p.product_name || '';
  if (!name.trim()) return false;
  // Prefer products explicitly tagged as English
  if (p.lang && p.lang !== 'en') return false;
  // Filter out names with non-Latin characters (Chinese, Arabic, Cyrillic, etc.)
  if (/[^\x00-\x7F\u00C0-\u024F]/.test(name)) return false;
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await parseBody(req);
  const query = (body.query || '').trim();
  if (!query) return res.status(400).json({ error: 'Missing query' });

  const strippedQuery = query.replace(/[\s-]/g, '');
  const isBarcode = /^\d+$/.test(strippedQuery);

  let productsToProcess = [];

  try {
    if (isBarcode) {
      // Direct barcode lookup
      let offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${strippedQuery}.json`, {
        headers: { 'User-Agent': 'MuncherMacros/1.0' }
      });
      let data = await offRes.json();
      
      // If not found and it's a 12 digit UPC, OFF often stores them as 13 digit EANs with a leading zero
      if (data.status === 0 && strippedQuery.length === 12) {
        offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/0${strippedQuery}.json`, {
          headers: { 'User-Agent': 'MuncherMacros/1.0' }
        });
        data = await offRes.json();
      }

      if (data.status === 1 && data.product) {
        productsToProcess = [data.product];
      }
    } else {
      // Text search
      const offUrl = 'https://world.openfoodfacts.org/cgi/search.pl'
        + '?search_terms=' + encodeURIComponent(query)
        + '&search_simple=1&action=process&json=1&page_size=50'
        + '&lc=en&cc=us'
        + '&fields=product_name,product_name_en,serving_size,serving_quantity,'
        + 'serving_quantity_unit,serving_size_unit,nutriments,brands,lang';

      const offRes = await fetch(offUrl, {
        headers: { 'User-Agent': 'MuncherMacros/1.0' }
      });
      if (!offRes.ok) return res.status(offRes.status).json({ error: 'OFF error ' + offRes.status });
      
      const data = await offRes.json();
      productsToProcess = data.products || [];
    }

    // Filter server-side to English only (unless barcode match), return top 20
    const filtered = (isBarcode ? productsToProcess : productsToProcess.filter(isEnglish)).slice(0, 20);

    const foods = filtered.map(p => {
      const n = p.nutriments || {};
      const cal = n['energy-kcal_100g'] || (n['energy-kcal_value'] || 0);
      const prot = n['proteins_100g'] || 0;
      const carb = n['carbohydrates_100g'] || 0;
      const fat = n['fat_100g'] || 0;
      const fb = n['fiber_100g'] || 0;
      const sugars = n['sugars_100g'] || 0;
      const sat = n['saturated-fat_100g'] || 0;

      return {
        name: (p.brands ? p.brands + ' ' : '') + (p.product_name_en || p.product_name || 'Unknown Item'),
        serving: '100g',
        sQty: 100,
        sUnit: 'g',
        cal: Math.round(cal),
        p: Math.round(prot * 10) / 10,
        c: Math.round(carb * 10) / 10,
        f: Math.round(fat * 10) / 10,
        fb: Math.round(fb * 10) / 10,
        sugars: Math.round(sugars * 10) / 10,
        sat: Math.round(sat * 10) / 10,
        _src: 'off'
      };
    });

    return res.status(200).json({ foods });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

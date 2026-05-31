// api/off-search.js — server-side proxy for Open Food Facts (English only)

import { setCors, handlePreflight } from './_lib/cors.js';
import { readBody } from './_lib/validate.js';

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
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readBody(req);
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
      // Text search — retry up to 3 times on failure or empty results
      const offUrl = 'https://world.openfoodfacts.org/cgi/search.pl'
        + '?search_terms=' + encodeURIComponent(query)
        + '&search_simple=1&action=process&json=1&page_size=50'
        + '&lc=en&cc=us'
        + '&fields=product_name,product_name_en,serving_size,serving_quantity,'
        + 'serving_quantity_unit,serving_size_unit,nutriments,brands,lang';
      let data = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const offRes = await fetch(offUrl, {
            headers: { 'User-Agent': 'MuncherMacros/1.0' },
            signal: AbortSignal.timeout(8000)
          });
          if (!offRes.ok) {
            if (attempt < 3) { await new Promise(r => setTimeout(r, 400 * attempt)); continue; }
            return res.status(offRes.status).json({ error: 'OFF error ' + offRes.status });
          }
          const parsed = await offRes.json();
          if ((parsed.products || []).length > 0 || attempt === 3) {
            data = parsed;
            break;
          }
          // Empty result on attempt 1 or 2 — retry
          await new Promise(r => setTimeout(r, 400 * attempt));
        } catch (fetchErr) {
          if (attempt === 3) throw fetchErr;
          await new Promise(r => setTimeout(r, 400 * attempt));
        }
      }
      productsToProcess = (data && data.products) || [];

    }

    // Filter server-side to English only (unless barcode match)
    const englishOnly = isBarcode ? productsToProcess : productsToProcess.filter(isEnglish);

    // Relevance sort: exact name match first, then starts-with, then contains, then rest
    const ql = query.toLowerCase();
    const scored = englishOnly.map(p => {
      const name = (p.product_name_en || p.product_name || '').toLowerCase().trim();
      let score = 0;
      if (name === ql) score = 4;
      else if (name.startsWith(ql)) score = 3;
      else if (name.includes(ql)) score = 2;
      else score = 1; // brand-only or indirect match
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const filtered = scored.slice(0, 20).map(s => s.p);

    const foods = filtered.map(p => {
      const n = p.nutriments || {};
      
      let servingText = '100g';
      let sQty = 100;
      let sUnit = 'g';
      let hasServingSize = false;

      if (p.serving_size) {
        servingText = p.serving_size;
        hasServingSize = true;
        
        let parenMatch = p.serving_size.match(/\(([^)]+)\)/);
        let matchText = parenMatch ? parenMatch[1] : p.serving_size;
        let weightMatch = matchText.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz|lb|kg|l)/i);
        
        if (weightMatch) {
          sQty = parseFloat(weightMatch[1]);
          sUnit = weightMatch[2].toLowerCase();
        } else {
          let numberMatch = p.serving_size.match(/(\d+(?:\.\d+)?)/);
          if (numberMatch) {
            sQty = parseFloat(numberMatch[1]);
            if (p.serving_size.toLowerCase().includes('g')) sUnit = 'g';
            else if (p.serving_size.toLowerCase().includes('ml')) sUnit = 'ml';
            else if (p.serving_size.toLowerCase().includes('oz')) sUnit = 'oz';
            else sUnit = 'serving';
          } else {
            sQty = 1;
            sUnit = 'serving';
          }
        }
      } else if (p.serving_quantity) {
        sQty = Number(p.serving_quantity);
        sUnit = p.serving_size_unit || p.serving_quantity_unit || 'g';
        servingText = `${sQty}${sUnit}`;
        hasServingSize = true;
      }

      const getVal = (baseKey, scale = 1, roundDecs = 1) => {
        const keyServing = `${baseKey}_serving`;
        const key100g = `${baseKey}_100g`;

        const r = (v) => {
          const factor = Math.pow(10, roundDecs);
          return Math.round(v * factor) / factor;
        };

        if (hasServingSize && n[keyServing] !== undefined && n[keyServing] !== null) {
          const val = Number(n[keyServing]);
          if (Number.isFinite(val)) return r(val * scale);
        }

        if (n[key100g] !== undefined && n[key100g] !== null) {
          const val100g = Number(n[key100g]);
          if (Number.isFinite(val100g)) {
            if (hasServingSize) {
              let grams = sQty;
              if (sUnit === 'oz') grams = sQty * 28.3495;
              else if (sUnit === 'lb') grams = sQty * 453.592;
              else if (sUnit === 'kg') grams = sQty * 1000;
              return r(((val100g * grams) / 100) * scale);
            }
            return r(val100g * scale);
          }
        }

        if (n[baseKey] !== undefined && n[baseKey] !== null) {
          const val = Number(n[baseKey]);
          if (Number.isFinite(val)) {
            if (hasServingSize) {
              let grams = sQty;
              if (sUnit === 'oz') grams = sQty * 28.3495;
              else if (sUnit === 'lb') grams = sQty * 453.592;
              else if (sUnit === 'kg') grams = sQty * 1000;
              return r(((val * grams) / 100) * scale);
            }
            return r(val * scale);
          }
        }

        return 0;
      };

      const cal = getVal('energy-kcal', 1, 0);
      const prot = getVal('proteins', 1, 1);
      const carb = getVal('carbohydrates', 1, 1);
      const fat = getVal('fat', 1, 1);

      return {
        name: (p.brands ? p.brands + ' ' : '') + (p.product_name_en || p.product_name || 'Unknown Item'),
        serving: servingText,
        sQty: sQty,
        sUnit: sUnit,
        cal: Math.round(cal),
        p: Math.round(prot * 10) / 10,
        c: Math.round(carb * 10) / 10,
        f: Math.round(fat * 10) / 10,
        fb: getVal('fiber', 1, 1),
        sugars: getVal('sugars', 1, 1),
        sat: getVal('saturated-fat', 1, 1),
        trans: getVal('trans-fat', 1, 1),
        mono: getVal('monounsaturated-fat', 1, 1),
        poly: getVal('polyunsaturated-fat', 1, 1),
        chol: getVal('cholesterol', 1000, 0),
        Sodium: getVal('sodium', 1000, 0),
        Potassium: getVal('potassium', 1000, 0),
        Calcium: getVal('calcium', 1000, 0),
        Iron: getVal('iron', 1000, 1),
        'Vitamin C': getVal('vitamin-c', 1000, 1),
        'Vitamin A': getVal('vitamin-a', 1000000, 0),
        'Vitamin D': getVal('vitamin-d', 1000000, 1),
        'Vitamin B1': getVal('vitamin-b1', 1000, 2),
        'Vitamin B2': getVal('vitamin-b2', 1000, 2),
        'Vitamin B3': getVal('vitamin-b3', 1000, 2),
        'Vitamin B5': getVal('vitamin-b5', 1000, 2),
        'Vitamin B6': getVal('vitamin-b6', 1000, 2),
        'Vitamin B12': getVal('vitamin-b12', 1000000, 2),
        'Vitamin E': getVal('vitamin-e', 1000, 1),
        'Vitamin K': getVal('vitamin-k', 1000000, 0),
        Magnesium: getVal('magnesium', 1000, 0),
        Zinc: getVal('zinc', 1000, 1),
        Phosphorus: getVal('phosphorus', 1000, 0),
        Manganese: getVal('manganese', 1000, 2),
        Selenium: getVal('selenium', 1000000, 0),
        Copper: getVal('copper', 1000, 3),
        barcode: p.code || p._id || (isBarcode ? strippedQuery : undefined),
        _src: 'off'
      };
    });

    return res.status(200).json({ foods });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

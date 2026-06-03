// api/off-search.js — server-side proxy for Open Food Facts (English only)

import { setCors, handlePreflight } from './_lib/cors.js';
import { readBody } from './_lib/validate.js';

function isEnglish(p) {
  // Must have a product name
  const name = p.product_name_en || p.product_name || '';
  if (!name.trim()) return false;
  // Prefer products explicitly tagged as English
  if (p.lang && p.lang !== 'en') return false;
  return true;
}

// Generate all likely plural (and singular) forms of a food query word.
// Covers: cherry→cherries, potato→potatoes, leaf→leaves, peach→peaches, apple→apples
function getPlurals(word) {
  const w = word.toLowerCase().trim();
  const forms = new Set([w]);

  // Already plural? Also derive the singular so scoring works both ways
  if (w.endsWith('ies') && w.length > 4) {
    forms.add(w.slice(0, -3) + 'y');           // cherries → cherry
  } else if (w.endsWith('ves') && w.length > 4) {
    forms.add(w.slice(0, -3) + 'f');           // leaves → leaf
    forms.add(w.slice(0, -3) + 'fe');          // knives → knife
  } else if (w.endsWith('es') && w.length > 3) {
    forms.add(w.slice(0, -2));                 // peaches → peach, potatoes → potato
    forms.add(w.slice(0, -1));                 // peaches → peache (safe fallback)
  } else if (w.endsWith('s') && w.length > 3) {
    forms.add(w.slice(0, -1));                 // apples → apple
  }

  // Generate plurals from the base
  const base = [...forms][0]; // use original word as base
  if (/[^aeiou]y$/i.test(base))          forms.add(base.slice(0, -1) + 'ies'); // cherry→cherries
  if (/([sxz]|ch|sh)$/i.test(base))      forms.add(base + 'es');               // peach→peaches
  if (/[^aeiou]o$/i.test(base))          { forms.add(base + 'es'); forms.add(base + 's'); } // potato→potatoes
  if (/[aeiou]o$/i.test(base))           forms.add(base + 's');               // avocado→avocados
  if (/[lf]f$/i.test(base))              forms.add(base.slice(0, -1) + 'ves'); // leaf→leaves
  if (/fe$/i.test(base))                 forms.add(base.slice(0, -2) + 'ves'); // knife→knives
  forms.add(base + 's');                                                        // apple→apples (default)

  return [...forms];
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
      // Text search utilizing exact query matching and plural/singular forms
      const buildUrl = (q) =>
        'https://world.openfoodfacts.org/cgi/search.pl'
        + '?search_terms=' + encodeURIComponent(q)
        + '&search_simple=1&action=process&json=1&page_size=50'
        + '&lc=en&cc=us'
        + '&fields=product_name,product_name_en,serving_size,serving_quantity,'
        + 'serving_quantity_unit,serving_size_unit,nutriments,brands,lang,nutriscore_grade,nutrient_levels';

      // Build ordered list of queries to try: exact + plural forms first
      const pluralForms = getPlurals(query);
      // queriesToTry: original query + all plural/singular variants (deduped)
      const queriesToTry = [...new Set([query, ...pluralForms])];

      const fetchQuery = async (q) => {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const offRes = await fetch(buildUrl(q), {
              headers: { 'User-Agent': 'MuncherMacros/1.0' },
              signal: AbortSignal.timeout(3000)
            });
            if (!offRes.ok) {
              if (attempt < 2) { await new Promise(r => setTimeout(r, 400)); continue; }
              return [];
            }
            const parsed = await offRes.json();
            return parsed.products || [];
          } catch {
            if (attempt === 2) return [];
            await new Promise(r => setTimeout(r, 400));
          }
        }
        return [];
      };

      // Try each query in order, merge results from all variants
      const seen = new Set();
      for (const q of queriesToTry) {
        const products = await fetchQuery(q);
        for (const p of products) {
          const key = (p.product_name_en || p.product_name || '') + (p.brands || '');
          if (!seen.has(key)) { seen.add(key); productsToProcess.push(p); }
        }
      }
    }

    // Filter server-side to English only (unless barcode match)
    const englishOnly = isBarcode ? productsToProcess : productsToProcess.filter(isEnglish);

    // Keywords that indicate a processed/packaged product — penalise these
    const processedWords = new Set([
      'chip','chips','crisp','crisps','fried','fries','baked','seasoned','flavored','flavoured',
      'flavour','flavor','instant','mix','sauce','soup','powder','extract','bar','bars',
      'snack','snacks','cookie','cookies','cracker','crackers','dip','spread','drink',
      'juice','soda','candy','chocolate','nugget','nuggets','frozen','canned','dried',
      'processed','enriched','artificial','imitation','style','coated','glazed',
      'stuffed','filled','breaded','battered','marinated','smoked','cured'
    ]);

    // Words that signal a whole / minimally-processed food — boost these
    const wholeWords = new Set([
      'raw','fresh','organic','whole','natural','plain','pure','uncooked','unseasoned'
    ]);

    const ql = query.toLowerCase();
    // All plural/singular variants of the query for scoring
    const qVariants = new Set(getPlurals(ql));

    const scored = englishOnly.map(p => {
      const name = (p.product_name_en || p.product_name || '').toLowerCase().trim();
      const words = name.split(/\s+/);
      const firstName = words[0]; // the leading word of the product name

      // Base relevance
      let score = 0;
      if (name === ql || qVariants.has(name))              score = 10; // exact or exact plural
      else if (qVariants.has(firstName))                   score = 9;  // leading word is plural form
      else if (name.startsWith(ql))                        score = 8;  // starts with query
      else if ([...qVariants].some(v => name.startsWith(v))) score = 7; // starts with plural
      else if (name.includes(ql))                          score = 4;  // contains query
      else if ([...qVariants].some(v => name.includes(v))) score = 3;  // contains plural
      else                                                 score = 1;  // indirect / brand only

      // Whole-food bonus: fewer words → closer to the raw ingredient
      if (words.length === 1)      score += 4;
      else if (words.length === 2) score += 2;
      else if (words.length >= 4)  score -= 1;

      // Processed food penalty
      const hasProcessed = words.some(w => processedWords.has(w.replace(/[^a-z]/g, '')));
      if (hasProcessed) score -= 3;

      // Whole food boost
      const hasWhole = words.some(w => wholeWords.has(w.replace(/[^a-z]/g, '')));
      if (hasWhole) score += 2;

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
        nutriscore_grade: p.nutriscore_grade,
        nutrient_levels: p.nutrient_levels,
        nutrient_percentages: p.nutriments ? {
          fat: p.nutriments.fat_100g !== undefined ? Number(p.nutriments.fat_100g) : undefined,
          'saturated-fat': p.nutriments['saturated-fat_100g'] !== undefined ? Number(p.nutriments['saturated-fat_100g']) : undefined,
          sugars: p.nutriments.sugars_100g !== undefined ? Number(p.nutriments.sugars_100g) : undefined,
          salt: p.nutriments.salt_100g !== undefined ? Number(p.nutriments.salt_100g) : undefined,
        } : undefined,
        _src: 'off'
      };
    });

    const activeFoods = foods.filter(f => {
      const isZero = f.cal === 0 && f.p === 0 && f.c === 0 && f.f === 0;
      if (!isZero) return true;
      const name = f.name.toLowerCase();
      const allowedZeroKeywords = [
        'water', 'diet', 'zero', 'tea', 'coffee', 'mustard', 'vinegar', 'spice', 
        'salt', 'stevia', 'splenda', 'sweetener', 'seasoning', 'coke 0', 'pepsi 0'
      ];
      return allowedZeroKeywords.some(kw => name.includes(kw));
    });

    return res.status(200).json({ foods: activeFoods });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

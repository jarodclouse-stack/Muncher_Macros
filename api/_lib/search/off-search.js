// api/off-search.js — server-side proxy for Open Food Facts (English only)

import { setCors, handlePreflight } from '../cors.js';
import { readBody } from '../validate.js';
import { allowGuest } from '../auth.js';

function isEnglish(p) {
  // Must have a product name
  const name = p.product_name_en || p.product_name || '';
  if (!name.trim()) return false;
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

  const user = await allowGuest(req, res);
  if (!user) return;

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
        + 'serving_quantity_unit,serving_size_unit,nutriments,brands,lang,nutriscore_grade,nutrient_levels,'
        + 'image_small_url,image_front_small_url,categories_tags';

      // Build ordered list of queries to try: exact + plural forms
      const pluralForms = getPlurals(query);
      // queriesToTry: original query first, then plural/singular variants (deduped)
      const queriesToTry = [...new Set([query, ...pluralForms])];

      // OFF's search.pl is slow (~3s typical). Since OFF results stream in
      // after DB results on the client, we can afford a generous timeout.
      // Stay within Vercel's 10s function limit: 6s original + one 3s fallback.
      const fetchQuery = async (q, timeoutMs) => {
        try {
          const offRes = await fetch(buildUrl(q), {
            headers: { 'User-Agent': 'MuncherMacros/1.0' },
            signal: AbortSignal.timeout(timeoutMs)
          });
          if (!offRes.ok) return [];
          const parsed = await offRes.json();
          return parsed.products || [];
        } catch {
          return [];
        }
      };

      const seen = new Set();
      const addProducts = (products) => {
        for (const p of products) {
          const key = (p.product_name_en || p.product_name || '') + (p.brands || '');
          if (!seen.has(key)) { seen.add(key); productsToProcess.push(p); }
        }
      };

      // Try the original query first (6s). Only fall back to ONE plural variant
      // (3s) if it returns nothing — keeps total well under Vercel's 10s limit.
      addProducts(await fetchQuery(queriesToTry[0], 6000));
      if (productsToProcess.length === 0 && queriesToTry.length > 1) {
        addProducts(await fetchQuery(queriesToTry[1], 3000));
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

      let cal = getVal('energy-kcal', 1, 0);
      const prot = getVal('proteins', 1, 1);
      const carb = getVal('carbohydrates', 1, 1);
      const fat = getVal('fat', 1, 1);

      // Many OFF products lack kcal but carry kJ ('energy'/'energy-kj') or just macros.
      if (!cal) {
        const kj = getVal('energy-kj', 1, 1) || getVal('energy', 1, 1);
        if (kj) cal = Math.round(kj / 4.184);
      }
      if (!cal) cal = Math.round(prot * 4 + carb * 4 + fat * 9);

      const mapOffCategory = (tags) => {
        if (!tags || !tags.length) return 'Other';
        const str = tags.join(' ').toLowerCase();
        
        if (str.includes('alcohol') || str.includes('beer') || str.includes('wine') || str.includes('vodka') || str.includes('liquor')) return 'Alcoholic Beverages';
        if (str.includes('fast food') || str.includes('burger') || str.includes('mcdonalds')) return 'Fast Food / Restaurant';
        if (str.includes('soup') || str.includes('stew') || str.includes('broth')) return 'Soups & Stews';
        if (str.includes('supplement') || str.includes('whey') || str.includes('protein powder') || str.includes('vitamin')) return 'Supplements & Powders';
        if (str.includes('sauce') || str.includes('condiment') || str.includes('dressing') || str.includes('ketchup') || str.includes('mayo')) return 'Condiments & Sauces';
        if (str.includes('legume') || str.includes('bean') || str.includes('lentil') || str.includes('chickpea')) return 'Legumes & Beans';
        if (str.includes('herb') || str.includes('spice') || str.includes('seasoning')) return 'Herbs & Spices';
        
        if (str.includes('vegetable')) return 'Vegetables';
        if (str.includes('fruit')) return 'Fruits';
        if (str.includes('bread') || str.includes('cereal') || str.includes('pasta') || str.includes('grain')) return 'Grains & Breads';
        if (str.includes('meat') || str.includes('poultry') || str.includes('chicken') || str.includes('beef') || str.includes('pork')) return 'Meat & Poultry';
        if (str.includes('fish') || str.includes('seafood')) return 'Fish & Seafood';
        if (str.includes('dairy') || str.includes('cheese') || str.includes('milk') || str.includes('egg') || str.includes('yogurt')) return 'Dairy & Eggs';
        if (str.includes('nut') || str.includes('seed')) return 'Nuts & Seeds';
        if (str.includes('oil') || str.includes('fat') || str.includes('butter')) return 'Fats & Oils';
        if (str.includes('snack') || str.includes('sweet') || str.includes('candy') || str.includes('chocolate') || str.includes('dessert') || str.includes('cookie') || str.includes('ice cream')) return 'Sweets & Snacks';
        if (str.includes('beverage') || str.includes('drink') || str.includes('juice') || str.includes('soda')) return 'Beverages';
        if (str.includes('meal') || str.includes('pizza') || str.includes('sandwich') || str.includes('casserole')) return 'Mixed Meals';
        
        return 'Other';
      };

      // Build a clean name: only prepend the brand if the product name doesn't already contain it
      const rawProductName = (p.product_name_en || p.product_name || 'Unknown Item').trim();
      const primaryBrand = (p.brands || '').split(',')[0].trim();
      const productLower = rawProductName.toLowerCase();
      const brandLower = primaryBrand.toLowerCase();
      let displayName = rawProductName;
      if (primaryBrand && brandLower && !productLower.includes(brandLower)) {
        displayName = primaryBrand + ' ' + rawProductName;
      }

      // Energy per 100g for sanity-checking (nothing edible exceeds ~900 kcal/100g — pure fat is 884)
      const energy100g = Number((p.nutriments || {})['energy-kcal_100g']);

      return {
        name: displayName,
        _energy100g: Number.isFinite(energy100g) ? energy100g : null,
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
        image_url: p.image_front_small_url || p.image_small_url || undefined,
        nutriscore_grade: p.nutriscore_grade,
        nutrient_levels: p.nutrient_levels,
        nutrient_percentages: p.nutriments ? {
          fat: p.nutriments.fat_100g !== undefined ? Number(p.nutriments.fat_100g) : undefined,
          'saturated-fat': p.nutriments['saturated-fat_100g'] !== undefined ? Number(p.nutriments['saturated-fat_100g']) : undefined,
          sugars: p.nutriments.sugars_100g !== undefined ? Number(p.nutriments.sugars_100g) : undefined,
          salt: p.nutriments.salt_100g !== undefined ? Number(p.nutriments.salt_100g) : undefined,
        } : undefined,
        foodGroup: mapOffCategory(p.categories_tags),
        _src: 'off'
      };
    });

    const activeFoods = foods.filter(f => {
      // Drop entries with physically-impossible energy density (broken OFF data)
      if (f._energy100g != null && f._energy100g > 900) return false;

      const isZero = f.cal === 0 && f.p === 0 && f.c === 0 && f.f === 0;
      if (!isZero) return true;
      const name = f.name.toLowerCase();
      const allowedZeroKeywords = [
        'water', 'diet', 'zero', 'tea', 'coffee', 'mustard', 'vinegar', 'spice',
        'salt', 'stevia', 'splenda', 'sweetener', 'seasoning', 'coke 0', 'pepsi 0'
      ];
      return allowedZeroKeywords.some(kw => name.includes(kw));
    }).map(f => {
      // Strip internal sanity-check field before returning
      const { _energy100g, ...clean } = f;
      return clean;
    });

    return res.status(200).json({ foods: activeFoods });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

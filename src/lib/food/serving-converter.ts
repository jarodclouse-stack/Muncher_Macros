import type { Food } from '../../types/food';
import { ALL_MICRO_KEYS, SERVING_UNITS } from '../constants';

export function round(value: number | string, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function safeNum(value?: number | string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Single source of truth for reading a food's calories regardless of which
// field name the source used (cal / calories / kcal) or whether it's a string.
export function getCal(food: any): number {
  const f = food || {};
  for (const key of ['cal', 'calories', 'kcal']) {
    if (f[key] != null) {
      const n = Number(f[key]);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  }
  return 0;
}

export function sanitizeServingAmount(input: number | string, fallback: number = 1): number {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

export const COMMON_UNITS = [
  { id: 'serving', label: 'Serving(s)', weightG: null },
  { id: 'g', label: 'Grams (g)', weightG: 1 },
  { id: 'ml', label: 'Milliliters (ml)', weightG: 1 }, // Fallback standard liquid density
  { id: 'tbsp', label: 'Tablespoons (tbsp)', weightG: 15 },
];

export function extractBaseGrams(servingStr: string): number | null {
  if (!servingStr) return null;
  
  // Try to find a weight/volume inside parentheses first (often most accurate: "1 packet (50g)")
  const parenMatch = servingStr.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const inside = parenMatch[1].toLowerCase();
    const weightMatch = inside.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz|lb|kg|l)/i);
    if (weightMatch) {
      return parseMatch(weightMatch);
    }
  }

  // Strip common metadata and search the whole string
  const cleanStr = servingStr.toLowerCase();
  const match = cleanStr.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz|lb|kg|l)/i);
  if (match) {
    return parseMatch(match);
  }
  return null;
}

function parseMatch(match: RegExpMatchArray): number {
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  switch(unit) {
    case 'g': case 'ml': return val;
    case 'oz': return val * 28.3495;
    case 'lb': return val * 453.592;
    case 'kg': return val * 1000;
    case 'l': return val * 1000;
    default: return val;
  }
}

export function getUnitFactor(unit: string): number {
  const target = unit.toLowerCase().trim();
  let normalized = target;
  if (target === 'ml' || target === 'milliliter' || target === 'milliliters') normalized = 'ml';
  else if (target === 'g' || target === 'gram' || target === 'grams') normalized = 'g';
  else if (target === 'cup' || target === 'cups') normalized = 'cup';
  else if (target === 'serving' || target === 'servings') normalized = 'serving';
  else if (target === 'piece' || target === 'pieces') normalized = 'piece';
  else if (target === 'slice' || target === 'slices') normalized = 'slice';
  else if (target === 'tbsp' || target === 'tablespoon' || target === 'tablespoons') normalized = 'tbsp';
  else if (target === 'tsp' || target === 'teaspoon' || target === 'teaspoons') normalized = 'tsp';
  else if (target === 'oz' || target === 'ounce' || target === 'ounces') normalized = 'oz';
  
  const found = SERVING_UNITS.find(u => u.v.toLowerCase() === normalized.toLowerCase());
  return found ? found.factor : 1;
}

export function parseServingString(servingStr: string): { qty: number, unit: string } | null {
  if (!servingStr) return null;
  
  const matchUnit = (unitStr: string): string => {
    const target = unitStr.toLowerCase().trim();
    if (target === 'ml' || target === 'milliliter' || target === 'milliliters') return 'ml';
    if (target === 'g' || target === 'gram' || target === 'grams') return 'g';
    if (target === 'cup' || target === 'cups') return 'cup';
    if (target === 'serving' || target === 'servings') return 'serving';
    if (target === 'piece' || target === 'pieces') return 'piece';
    if (target === 'slice' || target === 'slices') return 'slice';
    if (target === 'tbsp' || target === 'tablespoon' || target === 'tablespoons') return 'tbsp';
    if (target === 'tsp' || target === 'teaspoon' || target === 'teaspoons') return 'tsp';
    if (target === 'oz' || target === 'ounce' || target === 'ounces') return 'oz';
    
    const found = SERVING_UNITS.find(u => u.v.toLowerCase() === target);
    return found ? found.v : unitStr.trim();
  };

  // 1. Try parentheses first (e.g. "1 cup (240ml)")
  const parenMatch = servingStr.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const inside = parenMatch[1];
    const match = inside.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z\s]+)/);
    if (match) {
      return { qty: parseFloat(match[1]) || 1, unit: matchUnit(match[2]) };
    }
  }

  // 2. Search whole serving string
  const match = servingStr.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z\s]+)/);
  if (match) {
    return { qty: parseFloat(match[1]) || 1, unit: matchUnit(match[2]) };
  }
  
  // 3. Fallback: if no number, check if it's just a unit (e.g. "whole")
  const unitOnly = servingStr.trim();
  if (unitOnly) {
    return { qty: 1, unit: matchUnit(unitOnly) };
  }

  return null;
}

export function computeMultiplier(baseServingStr: string, targetUnit: string, targetQty: number): number {
  const qty = sanitizeServingAmount(targetQty, 1);
  if (targetUnit.toLowerCase() === 'serving') return qty;
  
  const parsedBase = parseServingString(baseServingStr);
  if (!parsedBase) {
    return qty; // No base serving info, return raw quantity
  }

  // If target unit matches base unit directly, simple ratio
  if (targetUnit.toLowerCase() === parsedBase.unit.toLowerCase()) {
    return qty / Math.max(0.01, parsedBase.qty);
  }

  // Otherwise convert using SERVING_UNITS factors
  const baseFactor = getUnitFactor(parsedBase.unit);
  const targetFactor = getUnitFactor(targetUnit);

  const baseTotalWeight = parsedBase.qty * baseFactor;
  const targetTotalWeight = qty * targetFactor;

  return targetTotalWeight / Math.max(0.01, baseTotalWeight);
}

export function getQuantityForUnit(baseServingStr: string, currentMultiplier: number, targetUnit: string): number {
  if (targetUnit.toLowerCase() === 'serving') {
    return currentMultiplier;
  }
  const parsedBase = parseServingString(baseServingStr);
  if (!parsedBase) {
    return currentMultiplier;
  }

  const baseFactor = getUnitFactor(parsedBase.unit);
  const targetFactor = getUnitFactor(targetUnit);

  const baseTotalWeight = parsedBase.qty * baseFactor;
  const targetTotalWeight = currentMultiplier * baseTotalWeight;

  return targetTotalWeight / Math.max(0.01, targetFactor);
}


export function scaleFoodByAmount(food: any, amount: number | string): any {
  const multiplier = sanitizeServingAmount(amount, 1);
  const f = food || {};
  return {
    ...f,
    amount: multiplier,
    calories: Math.round(safeNum(f.calories) * multiplier),
    protein: round(safeNum(f.protein) * multiplier),
    carbs: round(safeNum(f.carbs) * multiplier),
    fiber: round(safeNum(f.fiber) * multiplier),
    sugar: round(safeNum(f.sugar) * multiplier),
    fat: round(safeNum(f.fat) * multiplier),
    saturatedFat: round(safeNum(f.saturatedFat) * multiplier),
    monounsaturatedFat: round(safeNum(f.monounsaturatedFat) * multiplier),
    polyunsaturatedFat: round(safeNum(f.polyunsaturatedFat) * multiplier),
    transFat: round(safeNum(f.transFat) * multiplier),
    cholesterol: round(safeNum(f.cholesterol) * multiplier),
    sodium: round(safeNum(f.sodium) * multiplier),
    potassium: round(safeNum(f.potassium) * multiplier),
    solubleFiber: round(safeNum(f.solubleFiber || f['Soluble Fiber']) * multiplier),
    insolubleFiber: round(safeNum(f.insolubleFiber || f['Insoluble Fiber']) * multiplier),
    'Soluble Fiber': round(safeNum(f['Soluble Fiber'] || f.solubleFiber) * multiplier),
    'Insoluble Fiber': round(safeNum(f['Insoluble Fiber'] || f.insolubleFiber) * multiplier)
  };
}

export function scaleLegacyFoodByAmount(food: any, amount: number | string): any {
  const multiplier = sanitizeServingAmount(amount, 1);
  const f = food || {};
  const scaled: any = { ...f, qty: multiplier };
  
  // Scale every numeric property found in the object (Vitamins, Minerals, Macros)
  Object.keys(f).forEach(key => {
    // Avoid scaling metadata or identifiers
    if (['id', 'name', 'brand', 'serving', 'sUnit', '_src', 'raw', 'meal', 'timestamp',
         'barcode', 'stagedQty', 'stagedUnit', 'unit', 'type', 'ingredients'].includes(key)) return;
    
    const value = f[key];
    if (typeof value === 'number') {
      if (key === 'calories' || key === 'cal') {
        scaled[key] = Math.round(value * multiplier);
      } else {
        scaled[key] = round(value * multiplier);
      }
    } else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      if (key === 'calories' || key === 'cal') {
        scaled[key] = Math.round(Number(value) * multiplier);
      } else {
        scaled[key] = round(Number(value) * multiplier);
      }
    }
  });

  return enforceCalorieConsistency(scaled);
}

export function sumFoods(foodEntries: any[]): any {
  const entries = Array.isArray(foodEntries) ? foodEntries : [];
  
  // Set up dynamic initial object
  const initial: any = { 
    calories: 0, protein: 0, carbs: 0, fiber: 0, solubleFiber: 0, insolubleFiber: 0, sugar: 0, fat: 0, 
    saturatedFat: 0, monounsaturatedFat: 0, polyunsaturatedFat: 0, transFat: 0, 
    cholesterol: 0, sodium: 0, potassium: 0 
  };
  
  ALL_MICRO_KEYS.forEach(k => {
    initial[k] = 0;
    initial[k.toLowerCase()] = 0;
  });

  const totals = entries.reduce((acc, item) => {
    acc.calories += getCal(item);
    acc.protein += safeNum(item.protein != null ? item.protein : item.p);
    acc.carbs += safeNum(item.carbs != null ? item.carbs : item.c);
    acc.fiber += safeNum(item.fiber != null ? item.fiber : item.fb);
    acc.solubleFiber += safeNum(item.solubleFiber != null ? item.solubleFiber : (item.soluble_fiber != null ? item.soluble_fiber : item['Soluble Fiber']));
    acc.insolubleFiber += safeNum(item.insolubleFiber != null ? item.insolubleFiber : (item.insoluble_fiber != null ? item.insoluble_fiber : item['Insoluble Fiber']));
    acc.sugar += safeNum(item.sugar != null ? item.sugar : item.sugars);
    acc.fat += safeNum(item.fat != null ? item.fat : item.f);
    acc.saturatedFat += safeNum(item.saturatedFat != null ? item.saturatedFat : item.sat);
    acc.monounsaturatedFat += safeNum(item.monounsaturatedFat != null ? item.monounsaturatedFat : item.mono);
    acc.polyunsaturatedFat += safeNum(item.polyunsaturatedFat != null ? item.polyunsaturatedFat : item.poly);
    acc.transFat += safeNum(item.transFat != null ? item.transFat : item.trans);
    acc.cholesterol += safeNum(item.cholesterol != null ? item.cholesterol : item.chol);
    acc.sodium += safeNum(item.sodium != null ? item.sodium : item.Sodium);
    acc.potassium += safeNum(item.potassium != null ? item.potassium : item.Potassium);

    // Dynamic Micro Keys
    ALL_MICRO_KEYS.forEach(k => {
      const val = safeNum(item[k] !== undefined ? item[k] : item[k.toLowerCase()]);
      acc[k] += val;
      acc[k.toLowerCase()] += val;
    });

    return acc;
  }, initial);
  
  Object.keys(totals).forEach((k) => {
    if (k === 'calories' || k === 'cal') {
      totals[k] = Math.round(totals[k]);
    } else {
      totals[k] = round(totals[k]);
    }
  });
  return totals;
}

/**
 * Proportionally scales a food object's quantities so that a specific nutrient hits a target goal.
 * Use for "Scale to 500kcal" or "Scale to 50g Protein".
 */
export function scaleToTarget(food: any, nutrientKey: string, targetValue: number): any {
  const currentVal = safeNum(food[nutrientKey] || food[nutrientKey === 'calories' ? 'cal' : nutrientKey]);
  if (currentVal <= 0 || targetValue <= 0) return food;

  const multiplier = targetValue / currentVal;
  return scaleLegacyFoodByAmount(food, multiplier);
}

/**
 * Calculates the percentage distribution of Calories coming from P, C, and F.
 */
export function calculateMacroBalance(food: any) {
  const p = safeNum(food.p || food.protein) * 4;
  const c = safeNum(food.c || food.carbs) * 4;
  const f = safeNum(food.f || food.fat) * 9;
  const total = p + c + f;

  if (total <= 0) return { p: 0, c: 0, f: 0 };

  return {
    p: Math.round((p / total) * 100),
    c: Math.round((c / total) * 100),
    f: Math.round((f / total) * 100)
  };
}

// Helper: Ensure Calories = (P*4) + (C*4) + (F*9)
export const enforceCalorieConsistency = (food: Food): Food => {
  const p = Number(food.p) || 0;
  const c = Number(food.c) || 0;
  const f = Number(food.f) || 0;
  
  if (food.cal !== undefined && food.cal !== null && Number(food.cal) > 0) {
    return {
      ...food,
      cal: Math.round(Number(food.cal))
    };
  }

  const macroCals = Math.round(p * 4 + c * 4 + f * 9);
  return {
    ...food,
    cal: macroCals
  };
};

// Helper: Robust rounding for all nutrients (ported from index_old.html logic)
export const normalizeFoodResult = (food: any): Food => {
  const r = (val: number | string | undefined, decimals = 1) => {
    const n = Number(val) || 0;
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
  };

  const normalized = {
    ...food,
    name: food.name || 'Unknown food',
    serving: food.serving || '1 serving',
    sQty: Number(food.stagedQty != null ? food.stagedQty : (food.sQty != null ? food.sQty : 1)) || 1,
    sUnit: food.stagedUnit || food.sUnit || 'piece',
    p: r(food.p),
    c: r(food.c),
    f: r(food.f),
    fb: r(food.fb || food.Fiber || food.fiber),
    sat: r(food.sat),
    trans: r(food.trans),
    mono: r(food.mono),
    poly: r(food.poly),
    chol: Math.round(Number(food.chol) || 0),
    sugars: r(food.sugars),
    Sodium: Math.round(Number(food.Sodium || food.sodium) || 0),
    Potassium: Math.round(Number(food.Potassium || food.potassium) || 0),
    Calcium: Math.round(Number(food.Calcium || food.calcium) || 0),
    Iron: r(food.Iron || food.iron),
    'Vitamin C': r(food['Vitamin C'] || food.vitamin_c),
    'Vitamin A': Math.round(Number(food['Vitamin A'] || food.vitamin_a) || 0),
    'Vitamin D': r(food['Vitamin D'] || food.vitamin_d),
    'Vitamin B1': r(food['Vitamin B1'] || food.vitamin_b1, 2),
    'Vitamin B2': r(food['Vitamin B2'] || food.vitamin_b2, 2),
    'Vitamin B3': r(food['Vitamin B3'] || food.vitamin_b3, 2),
    'Vitamin B5': r(food['Vitamin B5'] || food.vitamin_b5, 2),
    'Vitamin B6': r(food['Vitamin B6'] || food.vitamin_b6, 2),
    'Vitamin B7': r(food['Vitamin B7'] || food.vitamin_b7, 2),
    'Vitamin B9': r(food['Vitamin B9'] || food.vitamin_b9, 2),
    'Vitamin B12': r(food['Vitamin B12'] || food.vitamin_b12, 2),
    'Vitamin E': r(food['Vitamin E'] || food.vitamin_e),
    'Vitamin K': r(food['Vitamin K'] || food.vitamin_k),
    Magnesium: Math.round(Number(food.Magnesium || food.magnesium) || 0),
    Zinc: r(food.Zinc || food.zinc),
    Phosphorus: Math.round(Number(food.Phosphorus || food.phosphorus) || 0),
    Manganese: r(food.Manganese || food.manganese, 2),
    Selenium: r(food.Selenium || food.selenium),
    Copper: r(food.Copper || food.copper, 3),
    Chloride: Math.round(Number(food.Chloride || food.chloride) || 0),
    Iodine: r(food.Iodine || food.iodine),
    Chromium: r(food.Chromium || food.chromium),
    Molybdenum: r(food.Molybdenum || food.molybdenum),
    Fluoride: r(food.Fluoride || food.fluoride),
    Fiber: r(food.Fiber || food.fiber || food.fb),
    'Soluble Fiber': r(food['Soluble Fiber'] || food.solubleFiber || food.soluble_fiber || 0),
    'Insoluble Fiber': r(food['Insoluble Fiber'] || food.insolubleFiber || food.insoluble_fiber || 0),
    solubleFiber: r(food.solubleFiber || food.soluble_fiber || food['Soluble Fiber'] || 0),
    insolubleFiber: r(food.insolubleFiber || food.insoluble_fiber || food['Insoluble Fiber'] || 0),
    // Preserve Nutri-Score and Nutrient Levels — never drop these
    nutriscore_grade: food.nutriscore_grade
      ? String(food.nutriscore_grade).toLowerCase().trim()
      : undefined,
    nutrient_levels: (typeof food.nutrient_levels === 'object' && food.nutrient_levels)
      ? food.nutrient_levels
      : undefined,
    nutrient_percentages: (typeof food.nutrient_percentages === 'object' && food.nutrient_percentages)
      ? {
          fat: food.nutrient_percentages.fat !== undefined ? Number(food.nutrient_percentages.fat) : undefined,
          'saturated-fat': (food.nutrient_percentages['saturated-fat'] || food.nutrient_percentages.saturatedFat) !== undefined ? Number(food.nutrient_percentages['saturated-fat'] || food.nutrient_percentages.saturatedFat) : undefined,
          sugars: food.nutrient_percentages.sugars !== undefined ? Number(food.nutrient_percentages.sugars) : undefined,
          salt: food.nutrient_percentages.salt !== undefined 
            ? (Number(food.nutrient_percentages.salt) > 10 ? Number(food.nutrient_percentages.salt) / 10 : Number(food.nutrient_percentages.salt))
            : undefined,
        }
      : undefined,
  };

  return enforceCalorieConsistency(normalized);
};

export interface CarbCategory {
  key: 'simple-carbs' | 'refined-carbs' | 'steady-starches' | 'sustained-energy' | 'natural-carbs' | 'hybrid-bites' | 'none';
  name: string;
  desc: string;
}

export function getCarbClassification(food: any): CarbCategory {
  const c = Number(food.c != null ? food.c : (food.carbs != null ? food.carbs : 0)) || 0;
  const s = Number(food.sugars != null ? food.sugars : (food.sugar != null ? food.sugar : 0)) || 0;
  const fb = Number(food.fb != null ? food.fb : (food.fiber != null ? food.fiber : (food.Fiber != null ? food.Fiber : 0))) || 0;
  if (c <= 0) {
    return { key: 'none', name: 'Low Carb', desc: 'Minimal carbohydrate content.' };
  }

  const isSugary = s >= 0.15 * c;
  const carbToFiberRatio = fb > 0 ? c / fb : 999;
  const passesShield = carbToFiberRatio <= 10 && fb >= 1.5;

  if (isSugary) {
    if (passesShield) {
      return {
        key: 'natural-carbs',
        name: 'Natural Carbs',
        desc: 'Whole, fiber-shielded plant sugars (fruits and sweet vegetables) that digest smoothly.'
      };
    } else {
      return {
        key: 'simple-carbs',
        name: 'Simple Carbs',
        desc: 'Fast-digesting, high-sugar refined foods (sodas, candies, syrup) with no fiber buffer.'
      };
    }
  } else {
    if (passesShield) {
      return {
        key: 'sustained-energy',
        name: 'Sustained Energy',
        desc: 'Slow-digesting, fiber-rich superfoods (oats, quinoa, lentils) offering long-lasting fuel.'
      };
    } else {
      return {
        key: 'refined-carbs',
        name: 'Refined Carbs',
        desc: 'Fast-digesting processed starches (white bread, bagels, pretzels) stripped of their natural fiber.'
      };
    }
  }
}

/**
 * Estimate a Nutri-Score grade (a–e) from any food object.
 * Returns the stored nutriscore_grade if already present (authoritative).
 * Otherwise derives it from fat, saturated fat, sugars, sodium, fiber, protein
 * using the official Santé publique France / FSA scoring model.
 *
 * `estimated: true` means it was computed — show a "~" prefix to signal approximation.
 */
export function estimateNutriScore(food: any): { grade: string; estimated: boolean } {
  if (food?.nutriscore_grade && food?._src !== 'ai') {
    const g = String(food.nutriscore_grade).toLowerCase().trim();
    if ('abcde'.includes(g) && g.length === 1) return { grade: g, estimated: false };
  }

  const cal = Number(food?.cal ?? food?.calories ?? 0);
  if (cal <= 0) return { grade: '', estimated: true };

  // Scale values to per-100g
  const sQty = Number(food?.sQty ?? food?.stagedQty ?? 1) || 1;
  const sUnit = String(food?.sUnit ?? food?.stagedUnit ?? 'g').toLowerCase();
  let gramsPerServing = 100;
  if (sUnit === 'g' || sUnit === 'ml') gramsPerServing = sQty;
  else if (sUnit === 'oz') gramsPerServing = sQty * 28.3495;
  else if (sUnit === 'lb') gramsPerServing = sQty * 453.592;
  else if (sUnit === 'kg') gramsPerServing = sQty * 1000;
  const scale = gramsPerServing > 0 ? (100 / gramsPerServing) : 1;

  const kcal100   = cal * scale;
  const sat100    = Number(food?.sat ?? food?.saturatedFat ?? 0) * scale;
  const sugar100  = Number(food?.sugars ?? food?.sugar ?? 0) * scale;
  const sodium100 = Number(food?.Sodium ?? food?.sodium ?? 0) * scale; // mg
  const fiber100  = Number(food?.fb ?? food?.fiber ?? food?.Fiber ?? 0) * scale;
  const prot100   = Number(food?.p ?? food?.protein ?? 0) * scale;
  const kj100     = kcal100 * 4.184;

  // Detect if food is a beverage
  const name = String(food?.name ?? '').toLowerCase();
  const brand = String(food?.brand ?? '').toLowerCase();
  const ingredients = String(food?.ingredients ?? '').toLowerCase();
  const serving = String(food?.serving ?? '').toLowerCase();

  const isMlUnit = sUnit === 'ml' || serving.includes('ml') || serving.includes(' l ') || serving.includes('fl oz') || serving.includes('floz');
  const hasBeverageTag = Array.isArray(food?.tags) && food.tags.some((t: string) => {
    const lt = t.toLowerCase();
    return lt === 'beverage' || lt === 'drink' || lt === 'beverages' || lt === 'drinks' || lt === 'liquid';
  });

  const beverageKeywords = [
    'coke', 'cola', 'pepsi', 'soda', 'pop', 'juice', 'water', 'tea', 'coffee', 'milk', 'sprite', 
    'dr pepper', 'fanta', 'gatorade', 'powerade', 'smoothie', 'nesquik', 'lemonade', 'punch', 'cider', 
    'latte', 'cappuccino', 'espresso', 'brew', 'shake', 'beverage', 'drink', 'beer', 'wine', 'syrup',
    'mountain dew', 'ginger ale', 'root beer', 'capri sun', 'sunny d', 'tropicana', 'minute maid', 
    'monster energy', 'red bull', 'yakult', 'fizz'
  ];
  const hasBeverageKeyword = beverageKeywords.some(keyword => name.includes(keyword) || brand.includes(keyword));

  const isBeverage = isMlUnit || hasBeverageTag || hasBeverageKeyword;

  if (isBeverage) {
    // Pure water is the only beverage that can get 'a'
    const isPureWater = kcal100 === 0 && sugar100 === 0 && sat100 === 0 && prot100 === 0 &&
      (name.includes('water') || name.includes('aqua') || name.includes('seltzer') || name.includes('club soda') || name.includes('sparkling water'));
    if (isPureWater) {
      return { grade: 'a', estimated: true };
    }

    // Beverage negative points (2024 update rules)
    // Energy (kJ/100mL)
    let eP = 0;
    if (kj100 > 570) eP = 10;
    else if (kj100 > 510) eP = 9;
    else if (kj100 > 450) eP = 8;
    else if (kj100 > 390) eP = 7;
    else if (kj100 > 330) eP = 6;
    else if (kj100 > 270) eP = 5;
    else if (kj100 > 210) eP = 4;
    else if (kj100 > 150) eP = 2;
    else if (kj100 > 90) eP = 2; // Non-linear scale values: 0-30=0, 31-90=1, 91-150=2
    else if (kj100 > 30) eP = 1;

    // Sugar (g/100mL) - Stricter scale (max 15 points)
    let suP = 0;
    if (sugar100 > 0.5) {
      suP = Math.min(Math.floor((sugar100 - 0.5) / 1.0) + 1, 15);
    }

    // Saturated Fat (g/100mL)
    const sP = sat100 < 1 ? 0 : sat100 < 2 ? 1 : sat100 < 3 ? 2 : sat100 < 4 ? 3 : sat100 < 5 ? 4 : sat100 < 6 ? 5 : sat100 < 7 ? 6 : sat100 < 8 ? 7 : sat100 < 9 ? 8 : sat100 < 10 ? 9 : 10;

    // Sodium (mg/100mL)
    const naP = sodium100 < 90 ? 0 : sodium100 < 180 ? 1 : sodium100 < 270 ? 2 : sodium100 < 360 ? 3 : sodium100 < 450 ? 4 : sodium100 < 540 ? 5 : sodium100 < 630 ? 6 : sodium100 < 720 ? 7 : sodium100 < 810 ? 8 : sodium100 < 900 ? 9 : 10;

    // Sweeteners Penalty (+4 points)
    const sweetenerKeywords = [
      'aspartame', 'sucralose', 'stevia', 'erythritol', 'monk fruit', 'acesulfame', 
      'saccharin', 'xylitol', 'sorbitol', 'diet', 'zero sugar', 'sugar free', 
      'no sugar', 'zero calorie', 'coke zero', 'pepsi max', 'pepsi zero'
    ];
    const sweetenerP = sweetenerKeywords.some(kw => name.includes(kw) || brand.includes(kw) || ingredients.includes(kw)) ? 4 : 0;

    // Positive points (0-7 for protein)
    let prP = 0;
    if (prot100 > 3.0) prP = 7;
    else if (prot100 > 2.7) prP = 6;
    else if (prot100 > 2.4) prP = 5;
    else if (prot100 > 2.1) prP = 4;
    else if (prot100 > 1.8) prP = 3;
    else if (prot100 > 1.5) prP = 2;
    else if (prot100 > 1.2) prP = 1;

    let fvP = 0;
    const isJuiceOrSmoothie = name.includes('juice') || name.includes('smoothie') || name.includes('cider');
    if (isJuiceOrSmoothie) {
      fvP = 4; // Fruit juice estimate points
    }

    const negativePoints = eP + sP + suP + naP + sweetenerP;
    let score = negativePoints - fvP;

    // Protein penalty for beverages (ignore if negative points without sweeteners >= 11)
    if ((negativePoints - sweetenerP) < 11 || fvP >= 5) {
      score -= prP;
    }

    // Grade Mapping for beverages: B (score <= 2), C (score <= 6), D (score <= 10), E (score > 10)
    const grade = score <= 2 ? 'b' : score <= 6 ? 'c' : score <= 10 ? 'd' : 'e';
    return { grade, estimated: true };
  }

  // General food scoring (General Foods algorithm)
  // Negative points (0–10 each)
  const eP  = kj100   < 335  ? 0 : kj100   < 670  ? 1 : kj100   < 1005 ? 2 : kj100   < 1340 ? 3 : kj100   < 1675 ? 4 : kj100   < 2010 ? 5 : kj100   < 2345 ? 6 : kj100   < 2680 ? 7 : kj100   < 3015 ? 8 : kj100   < 3350 ? 9 : 10;
  const sP  = sat100  < 1    ? 0 : sat100  < 2    ? 1 : sat100  < 3    ? 2 : sat100  < 4    ? 3 : sat100  < 5    ? 4 : sat100  < 6    ? 5 : sat100  < 7    ? 6 : sat100  < 8    ? 7 : sat100  < 9    ? 8 : sat100  < 10   ? 9 : 10;
  const suP = sugar100 < 4.5 ? 0 : sugar100 < 9   ? 1 : sugar100 < 13.5? 2 : sugar100 < 18  ? 3 : sugar100 < 22.5? 4 : sugar100 < 27  ? 5 : sugar100 < 31  ? 6 : sugar100 < 36  ? 7 : sugar100 < 40  ? 8 : sugar100 < 45  ? 9 : 10;
  const naP = sodium100 < 90 ? 0 : sodium100 < 180 ? 1 : sodium100 < 270? 2 : sodium100 < 360? 3 : sodium100 < 450? 4 : sodium100 < 540? 5 : sodium100 < 630? 6 : sodium100 < 720? 7 : sodium100 < 810? 8 : sodium100 < 900? 9 : 10;

  // Positive points (0–5 each)
  const fbP = fiber100 < 0.9 ? 0 : fiber100 < 1.9 ? 1 : fiber100 < 2.8 ? 2 : fiber100 < 3.7 ? 3 : fiber100 < 4.7 ? 4 : 5;
  const prP = prot100  < 1.6 ? 0 : prot100  < 3.2 ? 1 : prot100  < 4.8 ? 2 : prot100  < 6.4 ? 3 : prot100  < 8   ? 4 : 5;

  const negativePoints = eP + sP + suP + naP;
  let score = negativePoints - fbP;
  if (negativePoints < 11) {
    score -= prP;
  }
  const grade = score <= 0 ? 'a' : score <= 2 ? 'b' : score <= 8 ? 'c' : score <= 18 ? 'd' : 'e';
  return { grade, estimated: true };
}

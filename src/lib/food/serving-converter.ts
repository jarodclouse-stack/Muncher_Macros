export function round(value: number | string, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function safeNum(value?: number | string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function sanitizeServingAmount(input: number | string, fallback: number = 1): number {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

export const COMMON_UNITS = [
  { id: 'serving', label: 'Serving(s)', weightG: null },
  { id: 'g', label: 'Grams (g)', weightG: 1 },
  { id: 'oz', label: 'Ounces (oz)', weightG: 28.3495 },
  { id: 'lb', label: 'Pounds (lb)', weightG: 453.592 },
  { id: 'kg', label: 'Kilograms (kg)', weightG: 1000 },
  { id: 'ml', label: 'Milliliters (ml)', weightG: 1 }, // Fallback standard liquid density
  { id: 'cup', label: 'Cups', weightG: 240 }, // Fallback volume
  { id: 'tbsp', label: 'Tablespoons', weightG: 15 },
  { id: 'tsp', label: 'Teaspoons', weightG: 5 },
];

export function extractBaseGrams(servingStr: string): number | null {
  if (!servingStr) return null;
  const match = servingStr.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz)/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'g' || unit === 'ml') return val;
    if (unit === 'oz') return val * 28.3495;
  }
  return null;
}

export function computeMultiplier(baseServingStr: string, targetUnit: string, targetQty: number): number {
  if (targetUnit === 'serving') return targetQty;
  
  const baseGrams = extractBaseGrams(baseServingStr);
  const targetUnitDef = COMMON_UNITS.find(u => u.id === targetUnit);
  
  // If we can't determine the gram weight of the base food, we can't convert strictly to mass.
  // Fallback: assume scale factor 1 if no base weight exists
  if (!baseGrams || !targetUnitDef || !targetUnitDef.weightG) return targetQty;

  const targetTotalGrams = targetQty * targetUnitDef.weightG;
  return targetTotalGrams / baseGrams;
}

export function scaleFoodByAmount(food: any, amount: number | string): any {
  const multiplier = sanitizeServingAmount(amount, 1);
  const f = food || {};
  return {
    ...f,
    amount: multiplier,
    calories: round(safeNum(f.calories) * multiplier),
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
    potassium: round(safeNum(f.potassium) * multiplier)
  };
}

export function scaleLegacyFoodByAmount(food: any, amount: number | string): any {
  const multiplier = sanitizeServingAmount(amount, 1);
  const f = food || {};
  const scaled: any = { ...f, qty: multiplier };
  
  // Scale every numeric property found in the object (Vitamins, Minerals, Macros)
  Object.keys(f).forEach(key => {
    // Avoid scaling metadata or identifiers
    if (['id', 'name', 'brand', 'serving', 'sUnit', '_src', 'raw', 'meal', 'timestamp'].includes(key)) return;
    
    const value = f[key];
    if (typeof value === 'number') {
      scaled[key] = round(value * multiplier);
    } else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      scaled[key] = round(Number(value) * multiplier);
    }
  });

  return scaled;
}

export function sumFoods(foodEntries: any[]): any {
  const entries = Array.isArray(foodEntries) ? foodEntries : [];
  const totals = entries.reduce((acc, item) => {
    acc.calories += safeNum(item.calories != null ? item.calories : item.cal);
    acc.protein += safeNum(item.protein != null ? item.protein : item.p);
    acc.carbs += safeNum(item.carbs != null ? item.carbs : item.c);
    acc.fiber += safeNum(item.fiber != null ? item.fiber : item.fb);
    acc.sugar += safeNum(item.sugar != null ? item.sugar : item.sugars);
    acc.fat += safeNum(item.fat != null ? item.fat : item.f);
    acc.saturatedFat += safeNum(item.saturatedFat != null ? item.saturatedFat : item.sat);
    acc.monounsaturatedFat += safeNum(item.monounsaturatedFat != null ? item.monounsaturatedFat : item.mono);
    acc.polyunsaturatedFat += safeNum(item.polyunsaturatedFat != null ? item.polyunsaturatedFat : item.poly);
    acc.transFat += safeNum(item.transFat != null ? item.transFat : item.trans);
    acc.cholesterol += safeNum(item.cholesterol != null ? item.cholesterol : item.chol);
    acc.sodium += safeNum(item.sodium != null ? item.sodium : item.Sodium);
    acc.potassium += safeNum(item.potassium != null ? item.potassium : item.Potassium);
    return acc;
  }, { calories:0, protein:0, carbs:0, fiber:0, sugar:0, fat:0, saturatedFat:0, monounsaturatedFat:0, polyunsaturatedFat:0, transFat:0, cholesterol:0, sodium:0, potassium:0 });
  
  Object.keys(totals).forEach((k) => { totals[k] = round(totals[k]); });
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

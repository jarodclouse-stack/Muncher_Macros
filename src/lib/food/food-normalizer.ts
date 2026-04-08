export function buildId(raw: any): string {
  return raw.id || raw.fdcId || raw.foodId || ('food-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9));
}

export function num(value: any, fallback: number = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeFoodItem(raw: any = {}): any {
  const servingAmount = num(raw.servingAmount != null ? raw.servingAmount : (raw.servingSize != null ? raw.servingSize : (raw.householdServingAmount != null ? raw.householdServingAmount : (raw.sQty != null ? raw.sQty : 1))), 1);
  const servingUnit = raw.servingUnit || raw.householdServingUnit || raw.servingSizeUnit || raw.sUnit || 'serving';
  return {
    id: buildId(raw),
    source: raw.source || raw._src || 'unknown',
    name: raw.name || raw.description || 'Unnamed Food',
    brandName: raw.brandName || raw.brandOwner || raw.brand || '',
    servingAmount: servingAmount,
    servingUnit: servingUnit,
    amount: num(raw.amount, 1),
    serving: raw.serving || (String(servingAmount) + String(servingUnit)),
    calories: num(raw.calories != null ? raw.calories : (raw.cal != null ? raw.cal : (raw.energy != null ? raw.energy : (raw.kcal != null ? raw.kcal : raw.nutrients && raw.nutrients.calories))), 0),
    protein: num(raw.protein != null ? raw.protein : (raw.p != null ? raw.p : raw.nutrients && raw.nutrients.protein), 0),
    carbs: num(raw.carbs != null ? raw.carbs : (raw.c != null ? raw.c : (raw.carbohydrates != null ? raw.carbohydrates : raw.nutrients && raw.nutrients.carbs)), 0),
    fiber: num(raw.fiber != null ? raw.fiber : (raw.fb != null ? raw.fb : raw.nutrients && raw.nutrients.fiber), 0),
    sugar: num(raw.sugar != null ? raw.sugar : (raw.sugars != null ? raw.sugars : raw.nutrients && raw.nutrients.sugar), 0),
    fat: num(raw.fat != null ? raw.fat : (raw.f != null ? raw.f : (raw.totalFat != null ? raw.totalFat : raw.nutrients && raw.nutrients.fat)), 0),
    saturatedFat: num(raw.saturatedFat != null ? raw.saturatedFat : (raw.sat != null ? raw.sat : raw.nutrients && raw.nutrients.saturatedFat), 0),
    monounsaturatedFat: num(raw.monounsaturatedFat != null ? raw.monounsaturatedFat : (raw.mono != null ? raw.mono : raw.nutrients && raw.nutrients.monounsaturatedFat), 0),
    polyunsaturatedFat: num(raw.polyunsaturatedFat != null ? raw.polyunsaturatedFat : (raw.poly != null ? raw.poly : raw.nutrients && raw.nutrients.polyunsaturatedFat), 0),
    transFat: num(raw.transFat != null ? raw.transFat : (raw.trans != null ? raw.trans : raw.nutrients && raw.nutrients.transFat), 0),
    cholesterol: num(raw.cholesterol != null ? raw.cholesterol : (raw.chol != null ? raw.chol : raw.nutrients && raw.nutrients.cholesterol), 0),
    sodium: num(raw.sodium != null ? raw.sodium : (raw.Sodium != null ? raw.Sodium : raw.nutrients && raw.nutrients.sodium), 0),
    potassium: num(raw.potassium != null ? raw.potassium : (raw.Potassium != null ? raw.Potassium : raw.nutrients && raw.nutrients.potassium), 0),
    raw: raw
  };
}

export function toLegacyFood(normalized: any = {}): any {
  return {
    id: normalized.id,
    name: normalized.name,
    brand: normalized.brandName || '',
    serving: normalized.serving || (String(normalized.servingAmount || 1) + String(normalized.servingUnit || 'serving')),
    sQty: num(normalized.servingAmount, 1),
    sUnit: normalized.servingUnit || 'serving',
    cal: num(normalized.calories),
    p: num(normalized.protein),
    c: num(normalized.carbs),
    f: num(normalized.fat),
    fb: num(normalized.fiber),
    sugars: num(normalized.sugar),
    sat: num(normalized.saturatedFat),
    trans: num(normalized.transFat),
    mono: num(normalized.monounsaturatedFat),
    poly: num(normalized.polyunsaturatedFat),
    chol: num(normalized.cholesterol),
    Sodium: num(normalized.sodium),
    Potassium: num(normalized.potassium),
    _src: normalized.source || 'unknown'
  };
}

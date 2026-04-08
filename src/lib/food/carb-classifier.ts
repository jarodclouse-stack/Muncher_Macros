export function safeNum(value?: number | string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function includesAny(text: string, words: string[]): boolean {
  const lowerText = String(text || '').toLowerCase();
  return (words || []).some(word => lowerText.indexOf(word) !== -1);
}

export interface CarbClassificationResult {
  totalCarbs: number;
  simpleCarbs: number;
  complexCarbs: number;
  fiber: number;
  sugar: number;
  label: 'none' | 'complex-dominant' | 'simple-dominant' | 'mixed';
}

export function classifyCarbs(food: any): CarbClassificationResult {
  const foodItem = food || {};
  const carbs = safeNum(foodItem.carbs != null ? foodItem.carbs : foodItem.c);
  const fiber = safeNum(foodItem.fiber != null ? foodItem.fiber : foodItem.fb);
  const sugar = safeNum(foodItem.sugar != null ? foodItem.sugar : foodItem.sugars);
  const name = String((foodItem.name || '') + ' ' + (foodItem.brandName || foodItem.brand || '')).toLowerCase();

  const wholeFoodComplexHints = ['brown rice','oats','oatmeal','quinoa','lentil','lentils','beans','bean','black beans','kidney beans','chickpea','chickpeas','sweet potato','potato','yam','whole wheat','whole grain','barley'];
  const simpleCarbHints = ['juice','soda','candy','syrup','sugar','jam','jelly','honey','sports drink','energy drink'];

  if (carbs <= 0) {
    return { totalCarbs: 0, simpleCarbs: 0, complexCarbs: 0, fiber, sugar, label: 'none' };
  }

  if (includesAny(name, wholeFoodComplexHints)) {
    const simpleA = Math.min(sugar, carbs);
    return { totalCarbs: carbs, simpleCarbs: simpleA, complexCarbs: Math.max(0, carbs - simpleA), fiber, sugar, label: 'complex-dominant' };
  }

  if (includesAny(name, simpleCarbHints)) {
    const simpleB = Math.min(carbs, Math.max(sugar, carbs * 0.7));
    return { totalCarbs: carbs, simpleCarbs: simpleB, complexCarbs: Math.max(0, carbs - simpleB), fiber, sugar, label: 'simple-dominant' };
  }

  if (fiber >= 3 && sugar <= fiber * 2) {
    const simpleC = Math.min(sugar, carbs);
    return { totalCarbs: carbs, simpleCarbs: simpleC, complexCarbs: Math.max(0, carbs - simpleC), fiber, sugar, label: 'complex-dominant' };
  }

  if (sugar >= 8 && fiber < 2) {
    const simpleD = Math.min(carbs, Math.max(sugar, carbs * 0.65));
    return { totalCarbs: carbs, simpleCarbs: simpleD, complexCarbs: Math.max(0, carbs - simpleD), fiber, sugar, label: 'simple-dominant' };
  }

  const simple = Math.min(carbs, sugar);
  return { totalCarbs: carbs, simpleCarbs: simple, complexCarbs: Math.max(0, carbs - simple), fiber, sugar, label: 'mixed' };
}

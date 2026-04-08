// api/carbClassifier.js

function safeNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function includesAny(text, words) {
  const lowerText = String(text || '').toLowerCase();
  return (words || []).some(word => lowerText.indexOf(word) !== -1);
}

function classifyCarbs(food) {
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

const API_KEY = process.env.USDA_API_KEY || '';

async function searchFood(query) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('USDA API request failed');
  const data = await res.json();
  return data.foods || [];
}

function extractCarbData(food) {
  let carbs = 0;
  let sugars = 0;
  let fiber = 0;
  for (const nutrient of food.foodNutrients || []) {
    const name = String(nutrient.nutrientName || nutrient.nutrient?.name || '').toLowerCase();
    const value = Number(nutrient.value ?? nutrient.amount ?? 0) || 0;
    switch (name) {
      case 'carbohydrate, by difference':
      case 'carbohydrates':
      case 'total carbohydrate':
        carbs = value;
        break;
      case 'sugars, total including nleal':
      case 'sugars, total':
      case 'total sugars':
        sugars = value;
        break;
      case 'fiber, total dietary':
      case 'dietary fiber':
      case 'fiber':
        fiber = value;
        break;
    }
  }
  return { carbs, sugars, fiber };
}

async function classifyFood(query) {
  const foods = await searchFood(query);
  if (foods.length === 0) return { error: 'No foods found for that search term.' };

  const food = foods[0];
  const nutrientData = extractCarbData(food);
  const classification = classifyCarbs({
    name: food.description,
    carbs: nutrientData.carbs,
    sugar: nutrientData.sugars,
    fiber: nutrientData.fiber
  });

  return {
    foodName: food.description,
    nutrients: nutrientData,
    classification: classification.label,
    split: {
      simpleCarbs: classification.simpleCarbs,
      complexCarbs: classification.complexCarbs
    }
  };
}

module.exports = { classifyFood, extractCarbData };

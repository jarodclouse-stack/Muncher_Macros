// api/carbClassifier.js
const { classifyCarbs } = require('../lib/food/carb-classifier');

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

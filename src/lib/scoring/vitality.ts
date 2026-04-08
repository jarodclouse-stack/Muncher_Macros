import { ALL_MICRO_KEYS, DEFAULT_MICRO } from '../constants';

export interface VitalityResult {
  score: number;
  label: string;
  color: string;
  insights: string[];
}

export function calculateVitalityScore(food: any): VitalityResult {
  let score = 50;
  const insights: string[] = [];
  
  const cals = food.calories || food.cal || 0;
  if (cals === 0) return { score: 100, label: 'Pure Nutrient', color: '#92FE9D', insights: ['Non-caloric nutrient density.'] };

  const calFactor = cals / 100; // normalized per 100kcal

  // 1. Fiber Bonus
  const fiber = food.fiber || food.fb || 0;
  if (fiber / calFactor > 3) {
    score += 15;
    insights.push('High Fiber density (Digestive Vitality)');
  } else if (fiber / calFactor > 1.5) {
    score += 7;
  }

  // 2. Protein Quality
  const protein = food.p || food.protein || 0;
  const proteinCals = protein * 4;
  const proteinPct = proteinCals / cals;
  if (proteinPct > 0.3) {
    score += 15;
    insights.push('Premium Protein Ratio (Muscle Support)');
  } else if (proteinPct > 0.15) {
    score += 5;
  }

  // 3. Sugar Penalty
  const sugars = food.sugars || 0;
  const sugarCals = sugars * 4;
  const sugarPct = sugarCals / cals;
  if (sugarPct > 0.25) {
    score -= 20;
    insights.push('High Glycemic Load (Insulin Stress)');
  } else if (sugarPct > 0.1) {
    score -= 10;
  }

  // 4. Saturated Fat Penalty
  const sat = food.sat || food.saturated || 0;
  const satCals = sat * 9;
  const satPct = satCals / cals;
  if (satPct > 0.2) {
    score -= 10;
    insights.push('High Saturated Fat (Lipid Impact)');
  }

  // 5. Sodium/Potassium Balance
  const sodium = food.Sodium || food.sodium || 0;
  const potassium = food.Potassium || food.potassium || 0;
  if (potassium > sodium * 1.5) {
    score += 10;
    insights.push('Optimal Electrolyte Balance');
  } else if (sodium / calFactor > 300) {
    score -= 10;
    insights.push('High Sodium Density');
  }

  // 6. Micro Density Bonus
  let microCount = 0;
  ALL_MICRO_KEYS.forEach(k => {
    const val = food[k] || 0;
    const rda = DEFAULT_MICRO[k] || 100;
    // If 100kcal provides > 10% of RDA
    if (val / calFactor > rda * 0.1) {
      microCount++;
    }
  });
  
  if (microCount > 5) {
    score += 15;
    insights.push('Exceptional Micronutrient Profile');
  } else if (microCount > 2) {
    score += 5;
  }

  // Bound the score
  score = Math.max(0, Math.min(100, score));

  let label = 'Standard';
  let color = '#8b8b9b';

  if (score >= 90) { labeled('Elite Bio-Fuel', '#92FE9D'); }
  else if (score >= 75) { labeled('Premium Fuel', '#00C9FF'); }
  else if (score >= 50) { labeled('Functional', '#FCC419'); }
  else if (score >= 30) { labeled('Metabolic Load', '#FF922B'); }
  else { labeled('Low Vitality', '#FF6B6B'); }

  function labeled(l: string, c: string) {
    label = l;
    color = c;
  }

  return { score, label, color, insights };
}

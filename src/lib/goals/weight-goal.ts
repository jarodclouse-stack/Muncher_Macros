function round(value?: number | string): number {
  return Math.round(Number(value || 0));
}

export interface WeightGoalResult {
  tdee: number;
  weeklyRate: number;
  rawCalorieAdjustment: number;
  calorieAdjustment: number;
  targetCalories: number;
}

export function calculateWeightGoalCalories(tdee?: number | string, ratePerWeek?: number | string, unit: 'kg' | 'lb' = 'lb'): WeightGoalResult {
  const numericRate = Number(ratePerWeek || 0);
  
  // 1 lb of fat ~= 3500 kcal -> 500 cal/day adjustment for 1lb/week
  // 1 kg of fat ~= 7716 kcal -> 1102 cal/day adjustment for 1kg/week
  const multiplier = unit === 'kg' ? 1102 : 500;
  const rawAdjustment = numericRate * multiplier;
  
  // Deficit is slightly scaled to be conservative
  const adjustedCalorieChange = rawAdjustment * 0.8;
  
  return {
    tdee: round(tdee),
    weeklyRate: numericRate,
    rawCalorieAdjustment: round(rawAdjustment),
    calorieAdjustment: round(adjustedCalorieChange),
    targetCalories: round(Number(tdee || 0) + adjustedCalorieChange)
  };
}

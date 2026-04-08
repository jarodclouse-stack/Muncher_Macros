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

export function calculateWeightGoalCalories(tdee?: number | string, rateLbsPerWeek?: number | string): WeightGoalResult {
  const numericRate = Number(rateLbsPerWeek || 0);
  const rawAdjustment = numericRate * 500;
  
  // They scale the deficit by 0.8 to be conservative
  const adjustedCalorieChange = rawAdjustment * 0.8;
  
  return {
    tdee: round(tdee),
    weeklyRate: numericRate,
    rawCalorieAdjustment: round(rawAdjustment),
    calorieAdjustment: round(adjustedCalorieChange),
    targetCalories: round(Number(tdee || 0) + adjustedCalorieChange)
  };
}

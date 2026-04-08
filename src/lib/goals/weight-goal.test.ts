import { expect, test } from 'vitest';
import { calculateWeightGoalCalories } from './weight-goal';

test('calculates correct target calories for deficit', () => {
  // 1 lb/week deficit = -500 cals/day. At 80% adjustment scale = -400.
  // 2000 - 400 = 1600.
  const result = calculateWeightGoalCalories(2000, -1);
  expect(result.rawCalorieAdjustment).toBe(-500);
  expect(result.calorieAdjustment).toBe(-400);
  expect(result.targetCalories).toBe(1600);
});

test('handles surplus correctly', () => {
  const result = calculateWeightGoalCalories(2500, 0.5);
  expect(result.targetCalories).toBe(2700); // 0.5 * 500 = 250, 250*0.8 = 200
  expect(result.calorieAdjustment).toBe(200);
});

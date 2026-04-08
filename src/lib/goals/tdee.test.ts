import { expect, test } from 'vitest';
import { calculateTDEE } from './tdee';

test('calculates TDEE using correct multiplier', () => {
  // Moderate is the default if not provided (multiplier 1.55)
  // 1000 * 1.55 = 1550
  expect(calculateTDEE(1000)).toBe(1550);
  expect(calculateTDEE(1000, 'sedentary')).toBe(1200);
  expect(calculateTDEE(1000, 'athlete')).toBe(1900);
});

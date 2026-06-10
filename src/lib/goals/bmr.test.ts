import { expect, test } from 'vitest';
import { calculateBMR } from './bmr';

test('calculates male BMR correctly', () => {
  const bmr = calculateBMR({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 });
  // Classic Harris-Benedict: 66.47 + (13.75 * 80) + (5.0 * 180) - (6.8 * 30) = 1862.47 -> 1862
  expect(bmr).toBe(1862);
});

test('calculates female BMR correctly', () => {
  const bmr = calculateBMR({ sex: 'female', weightKg: 65, heightCm: 165, age: 25 });
  // Classic Harris-Benedict: 665.0 + (9.6 * 65) + (1.8 * 165) - (4.7 * 25) = 1468.5 -> 1469
  expect(bmr).toBe(1469);
});

test('returns 0 for missing values', () => {
  expect(calculateBMR({ sex: 'male', weightKg: 0, heightCm: 0, age: 0 })).toBe(0);
});

import { expect, test } from 'vitest';
import { calculateBMR } from './bmr';

test('calculates male BMR correctly', () => {
  const bmr = calculateBMR({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 });
  // Harris-Benedict revised: 88.362 + (13.397 * 80) + (4.799 * 180) - (5.677 * 30) = 1853.632 -> 1854
  expect(bmr).toBe(1854);
});

test('calculates female BMR correctly', () => {
  const bmr = calculateBMR({ sex: 'female', weightKg: 65, heightCm: 165, age: 25 });
  // Harris-Benedict revised: 447.593 + (9.247 * 65) + (3.098 * 165) - (4.330 * 25) = 1451.568 -> 1452
  expect(bmr).toBe(1452);
});

test('returns 0 for missing values', () => {
  expect(calculateBMR({ sex: 'male', weightKg: 0, heightCm: 0, age: 0 })).toBe(0);
});

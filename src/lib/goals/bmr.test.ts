import { expect, test } from 'vitest';
import { calculateBMR } from './bmr';

test('calculates male BMR correctly', () => {
  const bmr = calculateBMR({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 });
  // (10 * 80) + (6.25 * 180) - (5 * 30) + 5 = 800 + 1125 - 150 + 5 = 1780
  expect(bmr).toBe(1780);
});

test('calculates female BMR correctly', () => {
  const bmr = calculateBMR({ sex: 'female', weightKg: 65, heightCm: 165, age: 25 });
  // 650 + 1031.25 - 125 - 161 = 1395.25 -> 1395
  expect(bmr).toBe(1395);
});

test('returns 0 for missing values', () => {
  expect(calculateBMR({ sex: 'male', weightKg: 0, heightCm: 0, age: 0 })).toBe(0);
});

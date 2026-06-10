import { expect, test } from 'vitest';
import {
  getCal,
  enforceCalorieConsistency,
  normalizeFoodResult,
  scaleLegacyFoodByAmount,
  sumFoods
} from './serving-converter';

// --- getCal ---

test('getCal prefers cal over calories and kcal', () => {
  expect(getCal({ cal: 100, calories: 200, kcal: 300 })).toBe(100);
});

test('getCal falls back to calories, then kcal', () => {
  expect(getCal({ calories: 200, kcal: 300 })).toBe(200);
  expect(getCal({ kcal: 300 })).toBe(300);
});

test('getCal coerces numeric strings', () => {
  expect(getCal({ cal: '255.5' })).toBe(255.5);
});

test('getCal skips invalid values and uses the next field', () => {
  expect(getCal({ cal: 'abc', calories: 150 })).toBe(150);
  expect(getCal({ cal: -50, calories: 150 })).toBe(150);
});

test('getCal returns 0 for missing/NaN/negative-only inputs', () => {
  expect(getCal({})).toBe(0);
  expect(getCal(null)).toBe(0);
  expect(getCal({ cal: NaN })).toBe(0);
  expect(getCal({ cal: -10 })).toBe(0);
});

test('getCal returns a genuine 0 without falling through', () => {
  expect(getCal({ cal: 0, calories: 500 })).toBe(0);
});

// --- enforceCalorieConsistency ---

test('preserves a valid provided cal even with zero macros', () => {
  const result = enforceCalorieConsistency({ name: 'Soda', cal: 250, p: 0, c: 0, f: 0 } as any);
  expect(result.cal).toBe(250);
});

test('preserves label cal that deviates from 4/4/9 macros', () => {
  const result = enforceCalorieConsistency({ name: 'Fiber Bar', cal: 350, p: 20, c: 30, f: 8 } as any);
  expect(result.cal).toBe(350);
});

test('computes from macros when cal is missing', () => {
  const result = enforceCalorieConsistency({ name: 'X', p: 20, c: 30, f: 8 } as any);
  expect(result.cal).toBe(Math.round(20 * 4 + 30 * 4 + 8 * 9));
});

test('computes from macros when cal is 0 or invalid', () => {
  expect(enforceCalorieConsistency({ name: 'X', cal: 0, p: 10, c: 0, f: 0 } as any).cal).toBe(40);
  expect(enforceCalorieConsistency({ name: 'X', cal: NaN, p: 10, c: 0, f: 0 } as any).cal).toBe(40);
});

// --- normalizeFoodResult ---

test('normalizeFoodResult rounds a string cal', () => {
  expect(normalizeFoodResult({ name: 'X', cal: '255.5' }).cal).toBe(256);
});

test('normalizeFoodResult derives cal from macros when missing', () => {
  const food = normalizeFoodResult({ name: 'X', p: 10, c: 10, f: 10 });
  expect(food.cal).toBe(Math.round(10 * 4 + 10 * 4 + 10 * 9));
});

test('normalizeFoodResult treats negative cal as missing', () => {
  const food = normalizeFoodResult({ name: 'X', cal: -100, p: 10, c: 0, f: 0 });
  expect(food.cal).toBe(40);
});

// --- scaleLegacyFoodByAmount ---

test('scales numeric values and numeric strings', () => {
  const scaled = scaleLegacyFoodByAmount({ name: 'X', cal: 100, p: '10' }, 2);
  expect(scaled.cal).toBe(200);
  expect(scaled.p).toBe(20);
});

test('does not scale barcode or staged metadata', () => {
  const scaled = scaleLegacyFoodByAmount(
    { name: 'X', cal: 100, p: 5, c: 5, f: 5, barcode: '0123456789012', stagedQty: '1', stagedUnit: 'g' },
    2
  );
  expect(scaled.barcode).toBe('0123456789012');
  expect(scaled.stagedQty).toBe('1');
  expect(scaled.stagedUnit).toBe('g');
});

test('preserves the scaled provided cal instead of recomputing from macros', () => {
  const scaled = scaleLegacyFoodByAmount({ name: 'Soda', cal: 250, p: 0, c: 0, f: 0 }, 0.5);
  expect(scaled.cal).toBe(125);
});

// --- sumFoods ---

test('sums calories across mixed field names', () => {
  const total = sumFoods([
    { cal: 100 },
    { calories: 50 },
    { cal: '25' },
    { cal: undefined }
  ]);
  expect(total.calories).toBe(175);
});

test('sums macros with legacy short-key fallbacks', () => {
  const total = sumFoods([
    { protein: 10, c: 20, f: 5, cal: 0 },
    { p: 5, carbs: 10, fat: 5, cal: 0 }
  ]);
  expect(total.protein).toBe(15);
  expect(total.carbs).toBe(30);
  expect(total.fat).toBe(10);
});

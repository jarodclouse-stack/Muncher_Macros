export const KG_PER_LB = 0.453592;
export const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise. E.g., desk job, sitting most of the day, light walking.', ratioKg: 1.1, tdee: 1.20 },
  { id: 'light', label: 'Lightly active', desc: 'Light exercise or sports 1–3 days/week. E.g., walking, casual cycling, yoga.', ratioKg: 1.30, tdee: 1.375 },
  { id: 'moderate', label: 'Moderately active', desc: 'Moderate exercise 3–5 days/week. E.g., jogging, swimming, consistent resistance training.', ratioKg: 1.5, tdee: 1.55 },
  { id: 'active', label: 'Very active', desc: 'Hard exercise 6–7 days/week. E.g., heavy weightlifting, competitive sports, daily intense cardio.', ratioKg: 1.8, tdee: 1.725 },
  { id: 'athlete', label: 'Athlete', desc: 'Twice daily or intense training. E.g., professional athletes, marathon prep, multiple daily sessions.', ratioKg: 2.0, tdee: 1.90 },
  { id: 'bodybuilder', label: 'Bodybuilder / max muscle', desc: 'Dedicated hyper-load program. Heavy lifting 5-6 days/week tailored for max muscle hypertrophy.', ratioKg: 2.2, tdee: 1.90 },
];

export const MICRO_CATEGORIES = [
  {
    cat: 'Water-soluble vitamins', keys: [
      { k: 'Vitamin C', u: 'mg', rda_m: 90, rda_f: 75, exercise_sensitive: true },
      { k: 'Vitamin B1', u: 'mg', rda_m: 1.2, rda_f: 1.1, exercise_sensitive: true },
      { k: 'Vitamin B2', u: 'mg', rda_m: 1.3, rda_f: 1.1, exercise_sensitive: true },
      { k: 'Vitamin B3', u: 'mg', rda_m: 16, rda_f: 14, exercise_sensitive: true },
      { k: 'Vitamin B5', u: 'mg', rda_m: 5, rda_f: 5, exercise_sensitive: false },
      { k: 'Vitamin B6', u: 'mg', rda_m: 1.3, rda_f: 1.3, exercise_sensitive: true },
      { k: 'Vitamin B7', u: 'mcg', rda_m: 30, rda_f: 30, exercise_sensitive: false },
      { k: 'Vitamin B9', u: 'mcg', rda_m: 400, rda_f: 400, exercise_sensitive: false },
      { k: 'Vitamin B12', u: 'mcg', rda_m: 2.4, rda_f: 2.4, exercise_sensitive: false },
    ]
  },
  {
    cat: 'Fat-soluble vitamins', keys: [
      { k: 'Vitamin A', u: 'mcg', rda_m: 900, rda_f: 700, exercise_sensitive: false },
      { k: 'Vitamin D', u: 'mcg', rda_m: 15, rda_f: 15, exercise_sensitive: false },
      { k: 'Vitamin E', u: 'mg', rda_m: 15, rda_f: 15, exercise_sensitive: true },
      { k: 'Vitamin K', u: 'mcg', rda_m: 120, rda_f: 90, exercise_sensitive: false },
    ]
  },
  {
    cat: 'Macro minerals', keys: [
      { k: 'Calcium', u: 'mg', rda_m: 1000, rda_f: 1000, exercise_sensitive: false },
      { k: 'Phosphorus', u: 'mg', rda_m: 700, rda_f: 700, exercise_sensitive: false },
      { k: 'Magnesium', u: 'mg', rda_m: 410, rda_f: 315, exercise_sensitive: true },
      { k: 'Sodium', u: 'mg', rda_m: 1500, rda_f: 1500, exercise_sensitive: true },
      { k: 'Potassium', u: 'mg', rda_m: 3400, rda_f: 2600, exercise_sensitive: true },
      { k: 'Chloride', u: 'mg', rda_m: 2300, rda_f: 2300, exercise_sensitive: true },
    ]
  },
  {
    cat: 'Trace minerals', keys: [
      { k: 'Iron', u: 'mg', rda_m: 8, rda_f: 18, exercise_sensitive: true },
      { k: 'Zinc', u: 'mg', rda_m: 11, rda_f: 8, exercise_sensitive: false },
      { k: 'Copper', u: 'mcg', rda_m: 900, rda_f: 900, exercise_sensitive: false },
      { k: 'Manganese', u: 'mg', rda_m: 2.3, rda_f: 1.8, exercise_sensitive: false },
      { k: 'Selenium', u: 'mcg', rda_m: 55, rda_f: 55, exercise_sensitive: false },
      { k: 'Iodine', u: 'mcg', rda_m: 150, rda_f: 150, exercise_sensitive: false },
      { k: 'Chromium', u: 'mcg', rda_m: 35, rda_f: 25, exercise_sensitive: false },
      { k: 'Molybdenum', u: 'mcg', rda_m: 45, rda_f: 45, exercise_sensitive: false },
      { k: 'Fluoride', u: 'mg', rda_m: 4, rda_f: 3, exercise_sensitive: false },
    ]
  },
  {
    cat: 'Dietary Fiber', keys: [
      { k: 'Fiber', u: 'g', rda_m: 38, rda_f: 25, exercise_sensitive: false },
    ]
  },
];

export const ACTIVITY_TIER: Record<string, string> = {
  sedentary: 'sedentary',
  light: 'sedentary',
  moderate: 'moderate',
  active: 'intense',
  athlete: 'intense',
  bodybuilder: 'intense',
};

export const ACTIVITY_MULTIPLIER: Record<string, number> = { sedentary: 1.00, moderate: 1.15, intense: 1.25 };
export const EXERCISE_BONUS: Record<string, number> = { sedentary: 1.00, moderate: 1.05, intense: 1.10 };

export const MICRO_UNITS: Record<string, string> = {};
export const DEFAULT_MICRO: Record<string, number> = {};

MICRO_CATEGORIES.forEach((c) => {
  c.keys.forEach((item) => {
    MICRO_UNITS[item.k] = item.u;
    DEFAULT_MICRO[item.k] = item.rda_m;
  });
});

export const ALL_MICRO_KEYS = Object.keys(DEFAULT_MICRO);

export const SERVING_UNITS = [
  { v: 'g', factor: 1 }, { v: 'oz', factor: 28.3495 }, { v: 'lb', factor: 453.592 }, { v: 'kg', factor: 1000 },
  { v: 'mL', factor: 1 }, { v: 'L', factor: 1000 }, { v: 'fl oz', factor: 29.5735 }, { v: 'cup', factor: 240 },
  { v: 'tbsp', factor: 14.7868 }, { v: 'tsp', factor: 4.92892 }, { v: 'pint', factor: 473.176 },
  { v: 'quart', factor: 946.353 }, { v: 'gallon', factor: 3785.41 }, { v: 'pinch', factor: 0.36 }, { v: 'dash', factor: 0.62 },
  { v: 'piece', factor: 100 }, { v: 'slice', factor: 30 }, { v: 'whole', factor: 150 },
  { v: 'small', factor: 80 }, { v: 'medium', factor: 120 }, { v: 'large', factor: 160 },
  { v: 'scoop', factor: 30 }, { v: 'serving', factor: 100 }, { v: 'handful', factor: 40 },
];

export const FOOD_DB = [
  { name: 'Chicken breast (cooked)', serving: '100g', sUnit: 'g', sQty: 100, cal: 165, p: 31, c: 0, f: 3.6, fb: 0, sat: 0.9, trans: 0, chol: 85, mono: 1.5, poly: 0.8, sugars: 0, Sodium: 74, Potassium: 256, Calcium: 15, Iron: 1 },
  { name: 'Ground beef 80/20 (cooked)', serving: '100g', sUnit: 'g', sQty: 100, cal: 254, p: 26, c: 0, f: 17, fb: 0, sat: 6.5, trans: 0.7, chol: 87, mono: 7.5, poly: 0.6, sugars: 0, Sodium: 75, Potassium: 318, Iron: 2.6, Zinc: 5.4 },
  { name: 'Egg (large)', serving: '1 whole', sUnit: 'whole', sQty: 1, cal: 72, p: 6, c: 0.4, f: 5, fb: 0, sat: 1.6, trans: 0, chol: 186, mono: 1.9, poly: 0.7, sugars: 0.2, Sodium: 71, Potassium: 69, Calcium: 28, 'Vitamin D': 1.1, 'Vitamin B12': 0.6, 'Vitamin A': 75 },
  { name: 'Banana', serving: '1 medium (118g)', sUnit: 'medium', sQty: 1, cal: 105, p: 1.3, c: 27, f: 0.3, fb: 3.1, sat: 0.1, trans: 0, chol: 0, mono: 0, poly: 0.1, sugars: 14.4, Sodium: 1, Potassium: 422, Vitamin_C: 10.3, Magnesium: 32 },
  { name: 'Oatmeal (cooked)', serving: '1 cup', sUnit: 'cup', sQty: 1, cal: 158, p: 6, c: 27, f: 3.2, fb: 4, sat: 0.5, trans: 0, chol: 0, mono: 1, poly: 1.1, sugars: 1.1, Sodium: 115, Potassium: 143, Iron: 2.1 },
  { name: 'Greek Yogurt (plain, nonfat)', serving: '170g', sUnit: 'g', sQty: 170, cal: 100, p: 17, c: 6, f: 0.7, fb: 0, sat: 0.2, trans: 0, chol: 9, mono: 0.1, poly: 0, sugars: 6, Sodium: 61, Potassium: 240, Calcium: 187 },
  { name: 'Rice (white, cooked)', serving: '1 cup (158g)', sUnit: 'cup', sQty: 1, cal: 205, p: 4.3, c: 45, f: 0.4, fb: 0.6, sat: 0.1, trans: 0, chol: 0, mono: 0.1, poly: 0.1, sugars: 0.1, Sodium: 2, Potassium: 55, Iron: 1.9 },
  { name: 'Broccoli (steamed)', serving: '1 cup (156g)', sUnit: 'cup', sQty: 1, cal: 55, p: 3.7, c: 11.2, f: 0.6, fb: 5.1, sat: 0.1, trans: 0, chol: 0, mono: 0, poly: 0.3, sugars: 2.2, Sodium: 64, Potassium: 456, Vitamin_C: 101, Vitamin_K: 220 },
  { name: 'Almonds', serving: '1 oz (28g)', sUnit: 'oz', sQty: 1, cal: 164, p: 6, c: 6, f: 14, fb: 3.5, sat: 1.1, trans: 0, chol: 0, mono: 9, poly: 3.4, sugars: 1.2, Sodium: 0, Potassium: 208, Calcium: 76, Magnesium: 76, Vitamin_E: 7.3 }
];

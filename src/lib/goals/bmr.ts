export interface BMRInput {
  sex?: 'male' | 'female' | string;
  weightKg?: number | string;
  heightCm?: number | string;
  age?: number | string;
}

export function calculateBMR(input?: BMRInput): number {
  if (!input) return 0;
  const sex = input.sex;
  const weightKg = Number(input.weightKg);
  const heightCm = Number(input.heightCm);
  const age = Number(input.age);

  if (!weightKg || !heightCm || !age) return 0;

  // Harris-Benedict revised (Roza & Shizgal 1984):
  // Men:   88.362 + (13.397 x kg) + (4.799 x cm) - (5.677 x age)
  // Women: 447.593 + (9.247 x kg) + (3.098 x cm) - (4.330 x age)
  if (sex === 'female') {
    return Math.round(447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age));
  } else {
    return Math.round(88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age));
  }
}

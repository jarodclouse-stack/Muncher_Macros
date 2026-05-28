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

  // Classic Harris-Benedict (for adults):
  // Men:   66.47 + (13.75 x kg) + (5.0 x cm) - (6.8 x age)
  // Women: 665.0 + (9.6 x kg) + (1.8 x cm) - (4.7 x age)
  if (sex === 'female') {
    return Math.round(665.0 + (9.6 * weightKg) + (1.8 * heightCm) - (4.7 * age));
  } else {
    return Math.round(66.47 + (13.75 * weightKg) + (5.0 * heightCm) - (6.8 * age));
  }
}

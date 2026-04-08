export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  lightly_active: 1.375,
  moderate: 1.55,
  moderately_active: 1.55,
  active: 1.725,
  very_active: 1.725,
  athlete: 1.9,
  extra_active: 1.9,
  bodybuilder: 1.9
};

export function calculateTDEE(bmr?: number | string, activityLevel?: string): number {
  const level = activityLevel || 'moderate';
  const multiplier = ACTIVITY_MULTIPLIERS[level] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(Number(bmr || 0) * multiplier);
}

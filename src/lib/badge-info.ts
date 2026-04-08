export interface Badge {
  day: number;
  title: string;
  tier: string;
  color: string;
  icon?: string;
}

export const BADGE_TIERS = {
  EARLY: { name: 'Early Momentum', color: '#00C9FF' },
  CONSISTENCY: { name: 'Building Consistency', color: '#92FE9D' },
  DISCIPLINE: { name: 'Serious Discipline', color: '#FFD700' },
  ELITE: { name: 'Elite Tier', color: '#EC008C' },
  LEGENDARY: { name: 'Legendary Tier', color: '#FF416C' }
};

export const BADGES: Badge[] = [
  // Early Momentum
  { day: 1, title: 'First Bite', tier: BADGE_TIERS.EARLY.name, color: BADGE_TIERS.EARLY.color },
  { day: 2, title: 'Getting Warm', tier: BADGE_TIERS.EARLY.name, color: BADGE_TIERS.EARLY.color },
  { day: 3, title: 'On Track', tier: BADGE_TIERS.EARLY.name, color: BADGE_TIERS.EARLY.color },
  { day: 5, title: 'Momentum Builder', tier: BADGE_TIERS.EARLY.name, color: BADGE_TIERS.EARLY.color },
  { day: 7, title: 'Week Warrior', tier: BADGE_TIERS.EARLY.name, color: BADGE_TIERS.EARLY.color },
  
  // Building Consistency
  { day: 10, title: 'Routine Starter', tier: BADGE_TIERS.CONSISTENCY.name, color: BADGE_TIERS.CONSISTENCY.color },
  { day: 14, title: 'Consistency Rising', tier: BADGE_TIERS.CONSISTENCY.name, color: BADGE_TIERS.CONSISTENCY.color },
  { day: 21, title: 'Habit Locked', tier: BADGE_TIERS.CONSISTENCY.name, color: BADGE_TIERS.CONSISTENCY.color },
  { day: 30, title: 'Monthly Master', tier: BADGE_TIERS.CONSISTENCY.name, color: BADGE_TIERS.CONSISTENCY.color },
  
  // Serious Discipline
  { day: 45, title: 'Discipline Builder', tier: BADGE_TIERS.DISCIPLINE.name, color: BADGE_TIERS.DISCIPLINE.color },
  { day: 60, title: 'Macro Machine', tier: BADGE_TIERS.DISCIPLINE.name, color: BADGE_TIERS.DISCIPLINE.color },
  { day: 75, title: 'Dialed In', tier: BADGE_TIERS.DISCIPLINE.name, color: BADGE_TIERS.DISCIPLINE.color },
  { day: 90, title: 'Relentless', tier: BADGE_TIERS.DISCIPLINE.name, color: BADGE_TIERS.DISCIPLINE.color },
  
  // Elite Tier
  { day: 120, title: 'Precision Tracker', tier: BADGE_TIERS.ELITE.name, color: BADGE_TIERS.ELITE.color },
  { day: 150, title: 'Unstoppable', tier: BADGE_TIERS.ELITE.name, color: BADGE_TIERS.ELITE.color },
  { day: 180, title: 'Half-Year Hero', tier: BADGE_TIERS.ELITE.name, color: BADGE_TIERS.ELITE.color },
  { day: 200, title: 'Iron Will', tier: BADGE_TIERS.ELITE.name, color: BADGE_TIERS.ELITE.color },
  
  // Legendary Tier
  { day: 250, title: 'Elite Consistency', tier: BADGE_TIERS.LEGENDARY.name, color: BADGE_TIERS.LEGENDARY.color },
  { day: 300, title: 'Macro Legend', tier: BADGE_TIERS.LEGENDARY.name, color: BADGE_TIERS.LEGENDARY.color },
  { day: 365, title: '1 Year Beast', tier: BADGE_TIERS.LEGENDARY.name, color: BADGE_TIERS.LEGENDARY.color },
  { day: 500, title: 'Unbreakable', tier: BADGE_TIERS.LEGENDARY.name, color: BADGE_TIERS.LEGENDARY.color },
  { day: 730, title: '2 Year Titan', tier: BADGE_TIERS.LEGENDARY.name, color: BADGE_TIERS.LEGENDARY.color },
];

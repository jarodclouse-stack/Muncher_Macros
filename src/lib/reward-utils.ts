/**
 * Streak and Gem logic:
 * - 1 active day = 1 streak point.
 * - 1 active day = 1 gem.
 * - Weekly Bonus: Every 7 days, bonus = (weeks * streak) gems.
 * An active day is defined as having food logs, water, or a weight entry.
 */

import { getDailyGemReward } from './gamification/gems';

const isDayComplete = (day: any) => {
  if (!day) return false;
  const hasFood = day.foodLog && day.foodLog.length > 0;
  const hasWater = day.water && day.water > 0;
  const hasWeight = day.weight && day.weight > 0;
  return hasFood || hasWater || hasWeight;
};

export const calculateStreak = (cache: any): number => {
  const dates = Object.keys(cache)
    .filter(k => k.match(/^\d{4}-\d{2}-\d{2}$/) && isDayComplete(cache[k]))
    .sort()
    .reverse();
    
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // If the most recent complete date isn't today or yesterday, the streak is broken.
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let count = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const curr = new Date(dates[i]);
    const prev = new Date(dates[i + 1]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

export const calculateTotalGems = (cache: any): number => {
  const dates = Object.keys(cache)
    .filter(k => k.match(/^\d{4}-\d{2}-\d{2}$/) && isDayComplete(cache[k]))
    .sort();

  if (dates.length === 0) return 0;

  let totalGems = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  dates.forEach((dateStr) => {
    const currDate = new Date(dateStr);
    
    // Check if consecutive
    if (lastDate) {
      const diff = (currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    
    // 1. Daily Gem (Scaled by streak)
    totalGems += getDailyGemReward(currentStreak);
    
    // 2. Weekly Bonus: Every 7 days (7, 14, 21, ...)
    if (currentStreak % 7 === 0) {
      const weeks = currentStreak / 7;
      totalGems += Math.round(weeks * currentStreak);
    }
    
    lastDate = currDate;
  });

  return totalGems;
};

export const getRewardBreakdown = (cache: any) => {
  const streak = calculateStreak(cache);
  const totalGems = calculateTotalGems(cache);
  
  const weeks = Math.floor(streak / 7);
  const daysUntilNextMilestone = 7 - (streak % 7);
  
  // Next bonus calculation (based on formula in calculateTotalGems)
  const nextStreakMilestone = streak + daysUntilNextMilestone;
  const nextWeeks = nextStreakMilestone / 7;
  const potentialBonus = Math.round(nextWeeks * nextStreakMilestone);

  return {
    streak,
    totalGems,
    weeks,
    daysUntilNextMilestone,
    nextMilestoneStreak: nextStreakMilestone,
    potentialBonus
  };
};

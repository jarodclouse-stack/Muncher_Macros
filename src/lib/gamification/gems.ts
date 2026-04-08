/**
 * Calculates the daily gem reward based on the current streak length.
 * 
 * Rules:
 * - 0-6 days: 1 gem
 * - 7-13 days: 2 gems
 * - 14-27 days: 3 gems
 * - 28-55 days: 4 gems
 * - 56-111 days: 5 gems
 * - 112+ days: 6 gems (Max Cap)
 * 
 * Each milestone follows a doubling pattern (7 * 2^k).
 * Max cap at 32 weeks (224 days), with a final max reward of 6 gems/day.
 * 
 * @param streakDays Current consecutive active days
 * @returns Number of gems rewarded for the current day
 */
export const getDailyGemReward = (streakDays: number): number => {
  if (streakDays < 1) return 0;
  if (streakDays < 7) return 1;

  // Use log2 to find the doubling milestone stage
  // 7 * 2^k <= streakDays  =>  2^k <= streakDays / 7  =>  k <= log2(streakDays / 7)
  const milestoneStage = Math.floor(Math.log2(streakDays / 7));
  
  // Reward starts at 2 gems for the first milestone (7 days)
  const reward = milestoneStage + 2;

  // Cap at 6 gems/day (which is reached at 112 days and maintained through 224+ days)
  return Math.min(6, reward);
};

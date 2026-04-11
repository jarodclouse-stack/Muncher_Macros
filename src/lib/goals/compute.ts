import { ACTIVITY_LEVELS, ACTIVITY_TIER, ACTIVITY_MULTIPLIER, EXERCISE_BONUS, MICRO_CATEGORIES, KG_PER_LB } from '../constants';
import { calculateBMR } from './bmr';
import { calculateTDEE } from './tdee';
import { calculateWeightGoalCalories } from './weight-goal';

export function computeNutrientGoals(sex: string, activityId: string) {
  const tier = ACTIVITY_TIER[activityId] || 'sedentary';
  const am = ACTIVITY_MULTIPLIER[tier] || 1.0;
  const eb = EXERCISE_BONUS[tier] || 1.0;
  const isFemale = (sex === 'f' || sex === 'female');
  const result: any = {};
  
  MICRO_CATEGORIES.forEach((cat) => {
    cat.keys.forEach((item) => {
      const base = isFemale ? item.rda_f : item.rda_m;
      const multiplier = item.exercise_sensitive ? am * eb : am;
      let val = base * multiplier;
      
      if (item.u === 'mcg') val = Math.round(val * 10) / 10;
      else if (base >= 10) val = Math.round(val);
      else val = Math.round(val * 100) / 100;
      
      result[item.k] = val;
    });
  });
  return result;
}

export function computeGoals(g: any) {
  const units = g.units || { weight: 'lb', height: 'in' };
  const act = ACTIVITY_LEVELS.find((a) => a.id === g.activityId) || ACTIVITY_LEVELS[2];
  const proteinAct = ACTIVITY_LEVELS.find((a) => a.id === (g.proteinLevelId || g.activityId)) || act;
  
  // Normalize weight to LBS for protein ratio logic if stored in KG
  const wtLb = units.weight === 'kg' ? g.weight / KG_PER_LB : (g.weight || 175);
  const ratioLb = g.customRatioLb || (proteinAct.ratioKg * KG_PER_LB);
  const proteinG = Math.round(wtLb * ratioLb);
  
  const sex = g.sex === 'f' ? 'female' : 'male';
  const activityId = g.activityId || 'moderate';

  let bmr = 0, tdee = 0, targetCal = 2000, calAdj = 0;
  if (g.weight && g.height && g.age) {
    // Normalize to Metric for original math
    const kg = units.weight === 'kg' ? g.weight : g.weight * KG_PER_LB;
    const cm = units.height === 'cm' ? g.height : g.height * 2.54;
    
    bmr = calculateBMR({ sex, weightKg: kg, heightCm: cm, age: g.age });
    tdee = calculateTDEE(bmr, activityId);
    
    if (g.goalType === 'lose') {
      calAdj = -Math.abs(calculateWeightGoalCalories(0, g.rate || 0, units.weight).calorieAdjustment || 0);
    } else if (g.goalType === 'gain') {
      calAdj = Math.abs(calculateWeightGoalCalories(0, g.rate || 0, units.weight).calorieAdjustment || 0);
    }
    targetCal = tdee + calAdj;
  }

  const pctP = Math.min(60, Math.round(((proteinG * 4) / targetCal) * 100)) || 30;
  const remainder = 100 - pctP;
  
  let pctC = g.macroC || 45;
  let pctF = g.macroF || 25;
  if (pctC + pctF !== remainder) {
    const sum = pctC + pctF > 0 ? (pctC + pctF) : 1;
    pctC = Math.round((pctC / sum) * remainder);
    pctF = remainder - pctC;
  }
  
  const carbG = Math.round((pctC / 100) * targetCal / 4);
  const fatG  = Math.round((pctF / 100) * targetCal / 9);

  const baseMicros = computeNutrientGoals(sex, activityId);
  const computedMicros = { ...baseMicros, ...(g.customMicros || {}) };

  return { 
    proteinG, targetCal, carbG, fatG, tdee, bmr, 
    macroP: pctP, macroC: pctC, macroF: pctF,
    computedMicros, micros: g.customMicros || null 
  };
}

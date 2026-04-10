import React, { useState, useMemo } from 'react';
import { useDiary } from '../context/DiaryContext';
import { sumFoods } from '../lib/food/serving-converter';
import { computeGoals } from '../lib/goals/compute';
import { Utensils, Trash2, Sparkles, Droplets, Minus, Plus, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Scale, Activity } from 'lucide-react';
import { MEALS, ALL_MICRO_KEYS, MICRO_UNITS } from '../lib/constants';
import { NUTRIENT_BENEFITS } from '../lib/nutrient-info';
import { AddFoodModal } from './AddFoodModal';
import { PortionEditModal } from './PortionEditModal';



export const DiaryView: React.FC = () => {
  const { localCache, currentDate, changeDate, removeFoodLog, updateDayData, moveFoodLog } = useDiary();
  const [searchOpenFor, setSearchOpenFor] = useState<string | null>(null);
  const [editingPortion, setEditingPortion] = useState<{ meal: string, idx: number, food: any } | null>(null);

  // Derive Daily Data
  const dayData = localCache[currentDate] || {};
  const foodLog = dayData.foodLog || [];
  const goals = localCache.goals || {};
  
  const computed = computeGoals(goals);
  const totals = sumFoods(foodLog.map((l: any) => l.f));
  
  const remainingCals = computed.targetCal - totals.calories;
  
  const waterGoal = goals.waterGoal || 120;
  const currentWater = dayData.water || 0;
  
  const handleAddWater = (oz: number) => {
    updateDayData(currentDate, { water: Math.max(0, (currentWater || 0) + oz) });
  };

  const generateDailyStatus = () => {
    let text = '';
    const diff = remainingCals;
    
    if (foodLog.length === 0) return "Ready for a legendary day of fueling? Log your first meal to start! 🚀";

    if (diff > 0) {
        text += `Excellent! You still have ~${Math.round(diff)} kcal left to power your goals today. ⚡️ `;
    } else if (diff === 0) {
        text += `Absolute bulls-eye! You hit your target exactly. Legendary discipline! 🎯✨ `;
    } else {
        text += `A little extra fuel today! You're ${Math.round(Math.abs(diff))} kcal over, but focus on keeping your macros clean now! 🍏 `;
    }

    const proDiff = (computed.proteinG || 150) - totals.protein;
    if (proDiff > 0) {
        text += `Just ${Math.round(proDiff)}g more protein to reach peak muscle support! 💪`;
    } else {
        text += `Protein goal crushed! Your muscles are thanking you. 🔥🏆`;
    }
    return text;
  };

  const cheers = [
    "Consistency is the secret sauce! Keep crushing it! ✨",
    "You are becoming the best version of yourself, one meal at a time. 🏆",
    "Small wins lead to massive results. Keep that momentum! 🚀",
    "Your future self will thank you for today's discipline. 💪",
    "Fueling your body with intention. Great work so far! 💎",
    "Legendary progress! You're making it look easy. 🌈",
    "Stay focused, stay fueled, stay awesome! ⚡️",
    "Clean fuel, clear mind, unstoppable energy! 🎯"
  ];
  
  const [randomCheer] = useState(() => cheers[Math.floor(Math.random() * cheers.length)]);

  const displayDate = useMemo(() => {
    const d = new Date(currentDate + 'T12:00:00');
    const today = new Date();
    today.setHours(12,0,0,0);
    const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === -1) return 'Yesterday';
    if (diff === 1) return 'Tomorrow';
    
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [currentDate]);

  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      
      {/* Daily Cheer Banner */}
      <div style={{ background: 'var(--theme-accent-dim, rgba(255,215,0,0.05))', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ fontSize: '18px' }}>✨</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-accent, #FFD700)', fontStyle: 'italic' }}>{randomCheer}</span>
      </div>

      {/* Daily Summary Card */}
      <div className="section" style={{ background: 'linear-gradient(145deg, var(--theme-panel) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, justifyContent: 'center' }}>
            <button onClick={() => changeDate(-1)} style={{ background: 'var(--theme-panel)', border: 'none', color: 'var(--theme-text)', cursor: 'pointer', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} /></button>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--theme-text)' }}>{displayDate}</h2>
              <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Personal Diary</div>
            </div>
            <button onClick={() => changeDate(1)} style={{ background: 'var(--theme-panel)', border: 'none', color: 'var(--theme-text)', cursor: 'pointer', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', padding: '16px', borderRadius: '16px' }}>
            <span style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '12px', marginBottom: '4px' }}>Consumed</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--theme-text)' }}>{totals.calories}</span>
            <span style={{ color: 'var(--theme-accent, #00C9FF)', fontSize: '11px', marginTop: '4px' }}>kcal</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', padding: '16px', borderRadius: '16px' }}>
            <span style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '12px', marginBottom: '4px' }}>Remaining</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: remainingCals >= 0 ? 'var(--theme-success, #92FE9D)' : 'var(--theme-error, #FF6B6B)' }}>{Math.abs(remainingCals)}</span>
            <span style={{ color: remainingCals >= 0 ? 'var(--theme-success, #92FE9D)' : 'var(--theme-error, #FF6B6B)', fontSize: '11px', marginTop: '4px' }}>{remainingCals < 0 ? 'kcal over' : 'kcal'}</span>
          </div>
        </div>

        <div style={{ 
          background: 'var(--theme-accent-dim, rgba(0,201,255,0.05))', 
          border: '1px solid rgba(0,201,255,0.1)',
          borderLeft: '4px solid var(--theme-accent, #00C9FF)', 
          padding: '16px 20px', 
          borderRadius: '16px', 
          marginBottom: '24px', 
          fontSize: '14px', 
          lineHeight: '1.5',
          color: 'var(--theme-text)', 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '12px',
          margin: '0 4px 24px 4px'
        }}>
          <Sparkles size={18} color="var(--theme-accent, #00C9FF)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontWeight: '600' }}>{generateDailyStatus()}</span>
        </div>

        {/* Macros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
          <MacroCard label="Protein" value={totals.protein} total={computed.proteinG || 150} color="var(--theme-error, #FF6B6B)" icon={<Utensils size={14} />} />
          <MacroCard label="Carbs" value={totals.carbs} total={computed.carbG || 200} color="var(--theme-accent, #4DABF7)" icon={<Utensils size={14} />} />
          <MacroCard label="Fat" value={totals.fat} total={computed.fatG || 60} color="var(--theme-warning, #FCC419)" icon={<Utensils size={14} />} />
          <MacroCard label="Fiber" value={totals.fiber} total={38} color="var(--theme-success, #92FE9D)" icon={<Scale size={14} />} />
        </div>

        <HydrationCard 
          current={currentWater} 
          goal={waterGoal} 
          onAdd={handleAddWater} 
        />
      </div>


      {/* Meals Log List */}
      {MEALS.map(meal => {
        const mealFoods = foodLog.filter((l: any) => l.meal === meal);
        const mealTotals = sumFoods(mealFoods.map((l:any) => l.f));
        const mealCals = mealTotals.calories;
        


        return (
          <div key={meal} className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--theme-text)' }}>{meal}</h3>
              </div>
              <span style={{ fontSize: '14px', color: 'var(--theme-accent)', fontWeight: '600' }}>{mealCals} kcal</span>
            </div>
            
            {mealFoods.map((log: any, idx: number) => (
              <DiaryEntryItem 
                key={idx} 
                log={log} 
                onRemove={() => removeFoodLog(meal, idx)} 
                onEditPortion={() => setEditingPortion({ meal, idx, food: log.f })}
                onMove={(newMeal: string) => moveFoodLog(meal, idx, newMeal)}
              />
            ))}

            <button 
              onClick={() => setSearchOpenFor(meal)}
              style={{ width: '100%', padding: '12px', background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', color: 'var(--theme-accent, #00C9FF)', border: '1px dashed var(--theme-border, rgba(0,201,255,0.3))', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', marginTop: '8px' }}>
              + Add Food
            </button>
          </div>
        );
      })}

      {editingPortion && (
        <PortionEditModal 
          meal={editingPortion.meal}
          idx={editingPortion.idx}
          originalFood={editingPortion.food}
          onClose={() => setEditingPortion(null)}
        />
      )}

      {searchOpenFor && (
        <AddFoodModal meal={searchOpenFor} onClose={() => setSearchOpenFor(null)} />
      )}
      <div style={{ marginTop: '20px' }}>
        <WeeklyReport localCache={localCache} currentDate={currentDate} targetCal={computed.targetCal} />
      </div>
    </div>
  );
};

const NutrientDetailRow = ({ label, value, unit, benefit }: any) => {
  const [showBenefit, setShowBenefit] = useState(false);
  
  return (
    <div style={{ padding: '12px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', borderRadius: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.03))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--theme-text)' }}>{label}</span>
          {benefit && (
            <button 
              onClick={() => setShowBenefit(!showBenefit)} 
              style={{ background: 'none', border: 'none', color: showBenefit ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #5b5b6b)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
              <Info size={14} />
            </button>
          )}
        </div>
        <span style={{ fontWeight: '800', fontSize: '12px', color: 'var(--theme-accent, #00C9FF)' }}>{value}{unit}</span>
      </div>
      
      {showBenefit && benefit && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', lineHeight: '1.4', fontStyle: 'italic', marginBottom: '8px' }}>
            {benefit.summary}
          </div>
          {benefit.points && benefit.points.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {benefit.points.map((p: string, pi: number) => (
                <div key={pi} style={{ display: 'flex', gap: '6px', fontSize: '10px', color: 'var(--theme-text-dim, #c0c0d0)', lineHeight: '1.3' }}>
                  <span style={{ color: 'var(--theme-accent, #00C9FF)' }}>•</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DiaryEntryItem = ({ log, onRemove, onEditPortion, onMove }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const f = log.f;

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', borderRadius: '12px', transition: 'all 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            style={{ 
              background: isOpen ? 'var(--theme-accent-dim, rgba(0,201,255,0.1))' : 'var(--theme-panel-dim, rgba(255,255,255,0.05))', 
              border: 'none', 
              color: isOpen ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #8b8b9b)', 
              cursor: 'pointer', 
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isOpen ? 'HIDE' : 'DETAILS'}
          </button>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--theme-text)' }}>
              {f.name} <span style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)', marginLeft: '6px', fontWeight: '400' }}>(P:{f.p}g C:{f.c}g F:{f.f}g)</span>
            </div>
            <div style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {f.serving}
              <button onClick={onEditPortion} style={{ background: 'none', border: 'none', color: 'var(--theme-accent, #00C9FF)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 4px', borderRadius: '4px' }}>
                <Scale size={10} /> Choose Portion
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--theme-text)' }}>{Math.round(f.calories || f.cal || 0)} <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--theme-text-dim, #8b8b9b)' }}>kcal</span></div>
          <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--theme-error, #FF6B6B)', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
        </div>
      </div>
      
      {isOpen && (
        <div style={{ margin: '4px 12px 12px 12px', padding: '20px', background: 'var(--theme-panel, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-accent, #00C9FF)', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>Nutrition Intelligence</div>
          
          {/* Main Macros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <NutrientMiniCard label="Protein" value={f.p} unit="g" color="var(--theme-error, #FF6B6B)" />
            <NutrientMiniCard label="Carbs" value={f.c} unit="g" color="var(--theme-accent, #4DABF7)" />
            <NutrientMiniCard label="Fat" value={f.f} unit="g" color="var(--theme-warning, #FCC419)" />
          </div>

          {/* Micro Intelligence List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Protein', 'Complex Carbs', 'Simple (Sugars)', 'Saturated', 'Monounsaturated', 'Polyunsaturated', ...ALL_MICRO_KEYS].map(k => {
               const val = f[k];
               if (val !== undefined && val !== 0) {
                 const benefit = (NUTRIENT_BENEFITS as any)[k];
                 const unit = (MICRO_UNITS as any)[k] || 'g';
                 return (
                   <NutrientDetailRow 
                    key={k}
                    label={k}
                    value={val}
                    unit={unit}
                    benefit={benefit}
                   />
                 );
               }
               return null;
            })}
          </div>

          {/* Move to another meal */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
            <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--theme-accent, #00C9FF)', letterSpacing: '2px', marginBottom: '10px', textTransform: 'uppercase' }}>Correction & Adjustments</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {MEALS.filter(m => m !== log.meal).map(m => (
                <button
                  key={m}
                  onClick={() => onMove(m)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Move to {m}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Section */}
          {f.ingredients && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--theme-accent, #00C9FF)', letterSpacing: '2px', marginBottom: '10px', textTransform: 'uppercase' }}>Ingredients Label</div>
              <div style={{ 
                fontSize: '11px', 
                color: 'var(--theme-text-dim, #c0c0d0)', 
                lineHeight: '1.6', 
                background: 'var(--theme-panel-dim, rgba(255,255,255,0.03))', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid var(--theme-border, rgba(255,255,255,0.02))',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                {f.ingredients}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NutrientMiniCard = ({ label, value, unit, color }: any) => (
  <div style={{ textAlign: 'center', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '10px', borderRadius: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.02))' }}>
    <div style={{ fontSize: '9px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontWeight: '800', color: color, fontSize: '16px' }}>{value || 0}<span style={{ fontSize: '10px', marginLeft: '1px' }}>{unit}</span></div>
  </div>
);

const MacroCard = ({ label, value, total, color, icon }: any) => {
  const pct = Math.min(100, (value / (total || 1)) * 100);
  return (
    <div style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '8px' }}>
        {icon} {label}
      </span>
      <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px', color: 'var(--theme-text)' }}>{Math.round(value)}g <span style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '400' }}>/ {Math.round(total)}g</span></div>
      <div style={{ height: '4px', background: 'var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px' }} />
      </div>
    </div>
  );
};

const WeeklyReport = ({ localCache, currentDate, targetCal }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const days = useMemo(() => {
    const d = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(currentDate + 'T12:00:00');
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().split('T')[0];
      const dayData = localCache[key] || {};
      const foodLog = dayData.foodLog || [];
      const totals = sumFoods(foodLog.map((l: any) => l.f));
        d.push({
          label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dt.toLocaleDateString('en-US', { weekday: 'short' }),
          cal: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          fiber: totals.fiber,
          logged: foodLog.length > 0,
          dateKey: key
        });
    }
    return d;
  }, [localCache, currentDate]);

  const loggedDays = days.filter(d => d.logged);
  if (loggedDays.length === 0) return null;

  const avgCal = Math.round(loggedDays.reduce((s, d) => s + d.cal, 0) / loggedDays.length);
  const avgP = Math.round((loggedDays.reduce((s, d) => s + d.protein, 0) / loggedDays.length) * 10) / 10;
  const avgC = Math.round((loggedDays.reduce((s, d) => s + d.carbs, 0) / loggedDays.length) * 10) / 10;
  const avgF = Math.round((loggedDays.reduce((s, d) => s + d.fat, 0) / loggedDays.length) * 10) / 10;
  const avgFiber = Math.round((loggedDays.reduce((s, d) => s + d.fiber, 0) / loggedDays.length) * 10) / 10;
  
  // Legacy Performance Metrics
  const onTarget = loggedDays.filter(d => d.cal >= targetCal * 0.85 && d.cal <= targetCal * 1.15).length;
  const calDiff = avgCal - targetCal;
  
  const bestDay = loggedDays.reduce((a, b) => Math.abs(a.cal - targetCal) < Math.abs(b.cal - targetCal) ? a : b);
  const worstDay = loggedDays.reduce((a, b) => Math.abs(a.cal - targetCal) > Math.abs(b.cal - targetCal) ? a : b);
  
  const variance = loggedDays.reduce((s, d) => s + Math.pow(d.cal - avgCal, 2), 0) / loggedDays.length;
  const stdDev = Math.round(Math.sqrt(variance));

  const consistencyColor = stdDev < 150 ? 'var(--theme-success, #92FE9D)' : stdDev < 300 ? 'var(--theme-warning, #FCC419)' : 'var(--theme-error, #FF6B6B)';

  return (
    <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.02))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '20px', overflow: 'hidden' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isOpen ? 'var(--theme-panel-dim, rgba(255,255,255,0.03))' : 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--theme-accent, #00C9FF)" />
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--theme-text)' }}>This Week</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isOpen && <span style={{ fontSize: '11px', color: consistencyColor, fontWeight: '700', textTransform: 'uppercase' }}>{stdDev} σ Consistency</span>}
          {isOpen ? <ChevronUp size={18} color="var(--theme-text-dim, #8b8b9b)" /> : <ChevronDown size={18} color="var(--theme-text-dim, #8b8b9b)" />}
        </div>
      </div>
      
      {isOpen && (
        <div style={{ padding: '20px', borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>Avg Calories</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: Math.abs(calDiff) < 150 ? 'var(--theme-success, #92FE9D)' : calDiff > 0 ? 'var(--theme-error, #FF6B6B)' : 'var(--theme-accent, #4DABF7)' }}>{avgCal}</div>
              <p style={{ fontSize: '13px', color: '#8b8b9b', textAlign: 'center', maxWidth: '280px', lineHeight: '1.4' }}>
                Scans **Nutrition Labels**, **Barcodes**, and **QR Codes**. Take a clear photo for best results.
              </p>
            </div>
            <div style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>On Target</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--theme-success, #92FE9D)' }}>{onTarget}/{loggedDays.length}</div>
              <div style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)', marginTop: '4px' }}>days ±15%</div>
            </div>
          </div>

          {/* Deep Insights Row */}
          <div style={{ background: 'var(--theme-accent-dim, rgba(0,201,255,0.03))', border: '1px solid var(--theme-border, rgba(0,201,255,0.1))', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', color: 'var(--theme-accent, #00C9FF)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Deep Dietary Intelligence</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '4px' }}>Variation</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: consistencyColor }}>±{stdDev} <span style={{ fontSize: '10px', fontWeight: '400' }}>kcal</span></div>
              </div>
              <div style={{ borderLeft: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingLeft: '8px' }}>
                <div style={{ fontSize: '9px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '4px' }}>Best Day</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-success, #92FE9D)' }}>{bestDay.label}</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingLeft: '8px' }}>
                <div style={{ fontSize: '9px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '4px' }}>Worst Day</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-error, #FF6B6B)' }}>{worstDay.label}</div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
             <WeeklyMacro label="P" val={avgP} color="#FF6B6B" />
             <WeeklyMacro label="C" val={avgC} color="#4DABF7" />
             <WeeklyMacro label="F" val={avgF} color="#FCC419" />
             <WeeklyMacro label="Fb" val={avgFiber} color="#92FE9D" />
          </div>

          {/* New Weekly Nutrient Aggregates Section */}
          <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.02))', padding: '16px', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>7-Day Nutrient Averages</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { k: 'Sodium', u: 'mg' },
                { k: 'Potassium', u: 'mg' },
                { k: 'Magnesium', u: 'mg' },
                { k: 'Zinc', u: 'mg' },
                { k: 'Vitamin C', u: 'mg' },
                { k: 'Iron', u: 'mg' }
              ].map(n => {
                const total = loggedDays.reduce((sum, d) => {
                  const dayLog = localCache[d.dateKey]?.foodLog || [];
                  return sum + dayLog.reduce((acc: number, log: any) => acc + (log.f[n.k.toLowerCase()] || log.f[n.k] || 0), 0);
                }, 0);
                const avg = Math.round(total / loggedDays.length);
                return (
                  <div key={n.k} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--theme-text-dim, #5b5b6b)', marginBottom: '2px' }}>{n.k}</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--theme-text)' }}>{avg}{n.u}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '60px', gap: '8px' }}>
            {days.map((d, i) => {
              const height = d.logged ? Math.min(100, (d.cal / (targetCal * 1.5)) * 100) : 5;
              const isTarget = Math.abs(d.cal - targetCal) < (targetCal * 0.15);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '100%', height: '40px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${height}%`, background: d.logged ? (isTarget ? 'var(--theme-success, #92FE9D)' : 'var(--theme-accent, #4DABF7)') : 'var(--theme-panel, rgba(255,255,255,0.05))', transition: 'height 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '700' }}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const WeeklyMacro = ({ label, val, color }: any) => (
  <div style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.02))', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--theme-border, rgba(255,255,255,0.03))' }}>
    <div style={{ fontSize: '9px', color: color, fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--theme-text)' }}>{Math.round(val)}g</div>
  </div>
);

const HydrationCard = ({ current, goal, onAdd }: { current: number, goal: number, onAdd: (v: number) => void }) => {
  const pct = Math.min(100, (current / (goal || 120)) * 100);
  const [customVal, setCustomVal] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  
  const handleCustomAdd = () => {
    const val = parseFloat(customVal);
    if (!isNaN(val) && val > 0) {
      onAdd(mode === 'add' ? val : -val);
      setCustomVal('');
      setIsCustom(false);
    }
  };

  const handleQuickAdd = (val: number) => {
    onAdd(mode === 'add' ? val : -val);
  };

  return (
    <div style={{ marginTop: '24px', position: 'relative', overflow: 'hidden', background: 'var(--theme-accent-dim, rgba(0,201,255,0.03))', border: '1px solid var(--theme-border, rgba(0,201,255,0.1))', borderRadius: '24px', padding: '24px' }}>
      {/* Wave Background */}
      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: `${Math.min(100, pct)}%`, 
        background: 'var(--theme-accent-wave, linear-gradient(180deg, rgba(0,201,255,0.2) 0%, rgba(0,201,255,0.1) 100%))',
        transition: 'height 1s cubic-bezier(0.19, 1, 0.22, 1)',
        zIndex: 0,
        borderTop: pct > 0 ? '1px solid var(--theme-accent-dim, rgba(0,201,255,0.3))' : 'none'
      }}>
        {/* Simple Animated Wave Indicator */}
        {pct > 0 && pct < 100 && (
          <div style={{
            position: 'absolute',
            top: -10,
            left: 0,
            width: '200%',
            height: '20px',
            background: 'radial-gradient(circle at 50% 100%, var(--theme-accent-dim, rgba(0,201,255,0.15)) 0%, transparent 70%)',
            opacity: 0.5
          }} />
        )}
      </div>

      {/* Overflow Spill Effect */}
      {current > goal && (
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid var(--theme-accent, #00C9FF)',
          borderRadius: '24px',
          pointerEvents: 'none',
          animation: 'water-pulse 2s infinite',
          zIndex: 0,
          overflow: 'hidden'
        }}>
          {/* Top Lip Overflow Glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '12px',
            background: 'linear-gradient(180deg, var(--theme-accent, #00C9FF) 0%, transparent 100%)',
            filter: 'blur(6px)',
            opacity: 0.9,
            animation: 'spill-flow 2s infinite ease-in-out'
          }} />

          {/* Dripping Droplets */}
          {[15, 45, 75, 90].map((left, i) => (
            <div 
              key={i}
              style={{
                position: 'absolute',
                top: -10,
                left: `${left}%`,
                width: '4px',
                height: '14px',
                background: 'var(--theme-accent, #00C9FF)',
                borderRadius: '50% 50% 2px 2px',
                filter: 'blur(1px)',
                opacity: 0.6,
                animation: `drip ${2 + i * 0.5}s infinite ease-in`,
                animationDelay: `${i * 0.7}s`
              }} 
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes water-pulse {
          0% { box-shadow: 0 0 0 0 rgba(0,201,255,0.4); border-color: rgba(0,201,255,1); }
          70% { box-shadow: 0 0 0 15px rgba(0,201,255,0); border-color: rgba(0,201,255,0.5); }
          100% { box-shadow: 0 0 0 0 rgba(0,201,255,0); border-color: rgba(0,201,255,1); }
        }
        @keyframes spill-flow {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.5; }
          50% { transform: translateY(2px) scaleX(1.1); opacity: 0.8; }
        }
        @keyframes drip {
          0% { transform: translateY(0) scaleY(1); opacity: 0; }
          10% { opacity: 0.7; }
          70% { transform: translateY(120px) scaleY(1.5); opacity: 0.3; }
          100% { transform: translateY(150px) scaleY(0.5); opacity: 0; }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-accent, #00C9FF)', marginBottom: '4px' }}>
              <Droplets size={20} />
              <span style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Hydration Station</span>
            </div>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '2px', borderRadius: '8px', width: 'fit-content' }}>
               <button 
                  onClick={() => setMode('add')} 
                  style={{ background: mode === 'add' ? 'var(--theme-accent, #00C9FF)' : 'transparent', color: mode === 'add' ? '#000' : 'var(--theme-text-dim, #8b8b9b)', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                  ADD
               </button>
               <button 
                  onClick={() => setMode('remove')} 
                  style={{ background: mode === 'remove' ? 'var(--theme-error, #FF6B6B)' : 'transparent', color: mode === 'remove' ? '#fff' : 'var(--theme-text-dim, #8b8b9b)', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                  REMOVE
               </button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--theme-text)' }}>{(current || 0).toFixed(1)} <span style={{ fontSize: '14px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '500' }}>oz</span></div>
            <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '700' }}>GOAL: {goal} oz</div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
           <WaterBtn icon="🥤" label={mode === 'add' ? "+8 oz" : "-8 oz"} onClick={() => handleQuickAdd(8)} color={mode === 'remove' ? 'var(--theme-error-dim, rgba(255,107,107,0.05))' : undefined} />
           <WaterBtn icon="🍾" label={mode === 'add' ? "+16.9 oz" : "-16.9 oz"} onClick={() => handleQuickAdd(16.9)} color={mode === 'remove' ? 'var(--theme-error-dim, rgba(255,107,107,0.1))' : 'var(--theme-accent-dim, rgba(0,201,255,0.1))'} />
           {isCustom ? (
             <div style={{ gridColumn: 'span 2', display: 'flex', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', borderRadius: '14px', padding: '4px', border: mode === 'add' ? '1px solid var(--theme-accent, #00C9FF)' : '1px solid var(--theme-error, #FF6B6B)' }}>
                 <input 
                   autoFocus
                   type="number" 
                   placeholder={mode === 'add' ? "Add oz" : "Remove oz"} 
                   value={customVal} 
                   onChange={e => setCustomVal(e.target.value)} 
                   onBlur={() => !customVal && setIsCustom(false)}
                   onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
                   style={{ flex: 1, background: 'none', border: 'none', color: 'var(--theme-text)', padding: '0 8px', width: '100%', outline: 'none', fontSize: '14px' }} 
                 />
               <button onClick={handleCustomAdd} style={{ background: mode === 'add' ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-error, #FF6B6B)', border: 'none', borderRadius: '10px', color: mode === 'add' ? '#000' : '#fff', padding: '0 12px', fontWeight: 'bold', cursor: 'pointer' }}>{mode === 'add' ? 'Add' : 'Remove'}</button>
             </div>
           ) : (
             <>
               <WaterBtn icon="🥤" label="Custom" onClick={() => setIsCustom(true)} color={mode === 'remove' ? 'var(--theme-error-dim, rgba(255,107,107,0.15))' : 'var(--theme-accent-dim, rgba(0,201,255,0.15))'} />
               <button 
                 onClick={() => onAdd(mode === 'add' ? -8 : 8)}
                 style={{ background: 'var(--theme-panel, rgba(255,255,255,0.05))', border: 'none', borderRadius: '14px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 0', gap: '4px', cursor: 'pointer' }}>
                 {mode === 'add' ? <Minus size={14} /> : <Plus size={14} />}
                 <span style={{ fontSize: '10px', fontWeight: '700' }}>8 oz</span>
               </button>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

const WaterBtn = ({ icon, label, onClick, color = 'var(--theme-panel-dim, rgba(255,255,255,0.05))' }: any) => (
  <button 
    onClick={onClick}
    style={{ 
      background: color, 
      border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', 
      borderRadius: '14px', 
      color: 'var(--theme-text)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '12px 0', 
      gap: '4px', 
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}
    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <span style={{ fontSize: '18px' }}>{icon}</span>
    <span style={{ fontSize: '11px', fontWeight: '800' }}>{label}</span>
  </button>
);

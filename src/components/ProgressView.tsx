import React, { useState, useMemo } from 'react';
import { useDiary } from '../context/DiaryContext';
import { ACTIVITY_LEVELS, MICRO_CATEGORIES } from '../lib/constants';
import { computeGoals } from '../lib/goals/compute';
import { sumFoods } from '../lib/food/serving-converter';
import { Flame, Activity, Save, Scale, Droplet, User, PieChart, Info, Check } from 'lucide-react';
import { HistoryCalendar } from './HistoryCalendar';
import { WeightHistoryChart } from './WeightHistoryChart';

export const ProgressView: React.FC<{ setActiveTab: (tab: any) => void }> = ({ setActiveTab }) => {
  const { localCache, updateGoals, updateDayData, currentDate, goToDate } = useDiary();
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
  const goals = localCache.goals || {};
  const currentDayData = localCache[currentDate] || {};
  
  const [dailyWeight, setDailyWeight] = useState<number>(Number(currentDayData.weight) || 0);
  const [sex, setSex] = useState(goals.sex || 'male');
  const [age, setAge] = useState(goals.age || 30);
  const [heightIn, setHeightIn] = useState(goals.height || 70);
  const [weightLb, setWeightLb] = useState(goals.weight || 175);
  
  const [goalType, setGoalType] = useState(goals.goalType || 'maintain');
  const [goalRate, setGoalRate] = useState(goals.rate || 0.5);
  const [targetWeight, setTargetWeight] = useState(goals.targetWeight || 165);

  const [activityId, setActivityId] = useState(goals.activityId || 'moderate');
  const [proteinLevelId, setProteinLevelId] = useState(goals.proteinLevelId || 'custom');
  
  const [customRatioLb, setCustomRatioLb] = useState(goals.customRatioLb || (ACTIVITY_LEVELS.find((a: any) => a.id === 'moderate')?.ratioKg || 1.5) * 0.453592);

  const computed = computeGoals({
    sex, age, height: heightIn, weight: weightLb, 
    goalType, rate: goalRate, activityId, proteinLevelId, customRatioLb,
    macroP: goals.macroP, macroC: goals.macroC, macroF: goals.macroF,
    customMicros: goals.customMicros
  });

  const [waterGoal, setWaterGoal] = useState(goals.waterGoal || 120);

  // Macro splits
  const macroP = computed.macroP;
  const [macroC, setMacroC] = useState(computed.macroC || 45);
  const [macroF, setMacroF] = useState(computed.macroF || 25);

  const [editingMicro, setEditingMicro] = useState('');
  const [customMicroValue, setCustomMicroValue] = useState('');

  const saveCustomMicro = (k: string) => {
    updateGoals({ customMicros: { ...(goals.customMicros || {}), [k]: Number(customMicroValue) } });
    setEditingMicro('');
  };

  const handleSaveBodyAndGoal = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoals({ sex, age: Number(age), height: Number(heightIn), weight: Number(weightLb), goalType, rate: Number(goalRate), targetWeight: Number(targetWeight) });
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoals({ activityId, proteinLevelId, customRatioLb: proteinLevelId === 'custom' ? Number(customRatioLb) : undefined });
  };

  const handleSaveMacrosAndWater = () => {
    if (macroP + macroC + macroF !== 100) return alert("Macros must equal exactly 100%");
    updateGoals({ macroC, macroF, waterGoal });
  };

  const handleSaveWaterOnly = () => {
    updateGoals({ waterGoal });
  };


  const handleSaveDailyWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(dailyWeight);
    if (!isNaN(w) && w > 0) {
      updateDayData(currentDate, { weight: w });
      updateGoals({ weight: w });
      setWeightLb(w); // sync form visually
    }
  };


  const calAdj = computed.targetCal - computed.tdee;
  const currentAct = ACTIVITY_LEVELS.find((a: any) => a.id === activityId) || ACTIVITY_LEVELS[2];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ padding: '8px 12px', background: 'var(--theme-accent-dim, rgba(0, 201, 255, 0.1))', color: 'var(--theme-accent, #00C9FF)', borderRadius: '8px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>Your targets power everything in the app. Updates save automatically when you confirm them.</span>
      </div>

      {/* 1. Weight Goal Weight (Target) */}
      <div className="card weight-goal-card" style={{ background: 'linear-gradient(135deg, var(--theme-accent-dim, rgba(0,201,255,0.05)), var(--theme-success-dim, rgba(146,254,157,0.05)))' }}>
        <div className="card-header"><Flame size={18} color="var(--theme-error, #FF6B6B)" /> Weight Goal Weight</div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="lbl">Target Body Weight (lbs)</label>
            <input type="number" step="0.1" className="inp" value={targetWeight} onChange={e => setTargetWeight(parseFloat(e.target.value) || 0)} style={{ fontSize: '18px', fontWeight: '800' }} />
          </div>
          <button 
            onClick={() => updateGoals({ targetWeight: Number(targetWeight) })} 
            className="btn" 
            style={{ background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', marginTop: '0', height: '48px', minWidth: '120px', fontSize: '14px' }}>
            Set Goal
          </button>
        </div>
      </div>

      {/* 2. Monthly History (Calendar) */}
      <div>
        <HistoryCalendar onSelectDate={(d: string) => {
          setSelectedHistoryDate(d);
        }} />
      </div>

      {selectedHistoryDate && localCache[selectedHistoryDate] && (
        <HistoryReviewCard 
          date={selectedHistoryDate} 
          data={localCache[selectedHistoryDate]} 
          onClose={() => setSelectedHistoryDate(null)}
          onGoToDiary={() => {
            goToDate(selectedHistoryDate);
            setActiveTab('diary');
          }}
        />
      )}

      {/* 3. Legacy-style Weight History Chart */}
      <WeightHistoryChart localCache={localCache} targetWeight={Number(targetWeight)} />

      {/* 4. Progress to Goal Visualization */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="card-header"><Activity size={18} color="var(--theme-success, #92FE9D)" /> Progress to Goal Visualization</div>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--theme-text)', lineHeight: 1 }}>
            {Math.abs(weightLb - targetWeight).toFixed(1)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>lbs remaining to {targetWeight} lbs goal</div>
        </div>

        <div style={{ padding: '0 10px' }}>
          <div style={{ height: '12px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', padding: '3px' }}>
            <div style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--theme-accent, #00C9FF), var(--theme-success, #92FE9D))', 
              borderRadius: '10px',
              width: `${Math.max(5, Math.min(100, (1 - Math.abs(weightLb - targetWeight) / 25) * 100))}%`,
              transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', marginTop: '12px' }}>
            <span>Current: {weightLb} lbs</span>
            <span>Target: {targetWeight} lbs</span>
          </div>
        </div>
      </div>

      {/* 5. Weight Tools (Manual Entry) */}
      <div className="card">
        <div className="card-header"><Scale size={18} color="var(--theme-accent, #4DABF7)" /> Log Today's Weight</div>
        <form onSubmit={handleSaveDailyWeight} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <input type="number" step="0.1" className="inp" placeholder="Log weight for day..." value={dailyWeight} onChange={e => setDailyWeight(parseFloat(e.target.value) || 0)} />
            <div style={{ fontSize: '11px', color: 'var(--theme-accent, #00C9FF)', marginTop: '6px', fontWeight: '500' }}>💡 Note: Logging weight here updates your body stats & TDEE app-wide.</div>
          </div>
          <button type="submit" className="btn" style={{ marginTop: 0, padding: '0 24px' }}><Check size={16} /> Save Weight</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

        {/* 4. Body Stats & Goal Configuration */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><User size={18} color="var(--theme-accent, #00C9FF)" /> Body Stats & TDEE Configuration</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <form onSubmit={handleSaveBodyAndGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontWeight: '600', color: 'var(--theme-text)', borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.1))', paddingBottom: '8px' }}>Your physical details</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Sex</label>
                  <select className="inp" value={sex} onChange={e => setSex(e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Age</label>
                  <input type="number" className="inp" value={age} onChange={e => setAge(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Height (in)</label>
                  <input type="number" className="inp" value={heightIn} onChange={e => setHeightIn(parseFloat(e.target.value) || 0)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Weight (lb)</label>
                  <input type="number" className="inp" value={weightLb} onChange={e => setWeightLb(parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div style={{ fontWeight: '600', color: 'var(--theme-text)', borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.1))', paddingBottom: '8px', marginTop: '8px' }}>Weight Management Goal</div>
              <div>
                <label className="lbl">Goal Mode</label>
                <select className="inp" value={goalType} onChange={e => setGoalType(e.target.value)}>
                  <option value="lose">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Muscle/Weight</option>
                </select>
              </div>
              {goalType !== 'maintain' && (
                <div>
                  <label className="lbl">Rate (lbs per week)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" step="0.25" min="0" max="1.25" className="inp" value={goalRate} onChange={e => {
                      const val = Math.min(1.25, Math.max(0, Number(e.target.value)));
                      setGoalRate(val);
                    }} />
                  </div>
                </div>
              )}
              <div style={{ marginTop: '16px' }}>
                <button type="submit" className="btn" style={{ background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, black)' }}><Save size={14} /> Update Body & Goal Settings</button>
              </div>
            </form>

            <div style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', lineHeight: '1.6' }}>
              Keep your body stats up-to-date to ensure your TDEE (Total Daily Energy Expenditure) calculation remains accurate as you progress toward your goals.
            </div>
          </div>
        </div>

        {/* 3. Activity Level */}
        <div className="card">
          <div className="card-header"><Activity size={18} color="var(--theme-warning, #FCC419)" /> Activity & Protein Target</div>
          <form onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="lbl">Activity Level</label>
              <select className="inp" value={activityId} onChange={e => setActivityId(e.target.value)}>
                {ACTIVITY_LEVELS.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.label} (×{a.tdee} PAL)</option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', marginTop: '4px' }}>{currentAct?.desc}</div>
            </div>
            <div>
              <label className="lbl">Protein Target Level</label>
              <select className="inp" value={proteinLevelId} onChange={e => setProteinLevelId(e.target.value)}>
                {ACTIVITY_LEVELS.map((a: any) => (
                  <option key={`p-${a.id}`} value={a.id}>{a.label} ({Math.round(a.ratioKg * 0.453592 * 100)/100}g / lb)</option>
                ))}
                <option value="custom">Custom target</option>
              </select>
            </div>
            {proteinLevelId === 'custom' && (
              <div>
                <label className="lbl">Custom Protein (g per lb of bodyweight)</label>
                <input type="number" step="0.05" className="inp" value={customRatioLb} onChange={e => setCustomRatioLb(parseFloat(e.target.value) || 0)} />
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--theme-accent, #00C9FF)', marginTop: '4px', textAlign: 'right' }}>
              Final Target: {Math.round(computed.proteinG)}g / day
            </div>
            <button type="submit" className="btn"><Save size={14} /> Save Activity</button>
          </form>
        </div>

        {/* 4. Calorie Breakdown Visual */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><Flame size={18} color="var(--theme-error, #FF6B6B)" /> TDEE Calculator Breakdown</div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', padding: '16px', borderRadius: '16px', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)' }}>Base Metabolic Rate (BMR)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--theme-text)' }}>{Math.round(computed.bmr)}</div>
            </div>
            
            <div style={{ fontSize: '24px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: 'bold' }}>⟶</div>
            
            <div style={{ background: 'var(--theme-warning-dim, rgba(252, 196, 25, 0.1))', padding: '16px', borderRadius: '16px', border: '1px solid var(--theme-warning, rgba(252,196,25,0.2))', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '12px', color: 'var(--theme-warning, #FCC419)' }}>TDEE (includes PAL ×{currentAct?.tdee})</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--theme-warning, #FCC419)' }}>{Math.round(computed.tdee)}</div>
            </div>

            <div style={{ fontSize: '24px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: 'bold' }}>{calAdj >= 0 ? '+' : '-'}</div>
            
            <div style={{ background: 'var(--theme-accent-dim, rgba(0, 201, 255, 0.1))', padding: '16px', borderRadius: '16px', border: '1px solid var(--theme-accent-dim, rgba(0,201,255,0.2))' }}>
              <div style={{ fontSize: '12px', color: 'var(--theme-accent, #00C9FF)' }}>Goal Adjustment</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--theme-accent, #00C9FF)' }}>{Math.abs(Math.round(calAdj))}</div>
            </div>

            <div style={{ fontSize: '24px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: 'bold' }}>=</div>
            
            <div style={{ background: 'var(--theme-success-dim, rgba(146, 254, 157, 0.1))', padding: '16px', borderRadius: '16px', border: '1px solid var(--theme-success-dim, rgba(146,254,157,0.3))', flex: 2, minWidth: '200px' }}>
              <div style={{ fontSize: '12px', color: 'var(--theme-success, #92FE9D)' }}>Daily Target Calories</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--theme-success, #92FE9D)' }}>{Math.round(computed.targetCal)}</div>
            </div>
          </div>
        </div>

        {/* 5. Macro Split & Water Goal */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><PieChart size={18} color="var(--theme-accent, #B197FC)" /> Macro Split & Daily Fluids</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginTop: '16px' }}>
            
            <div>
              <div style={{ marginBottom: '16px' }}>Customize your calorie ratio. Must equal exactly 100%.</div>
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginBottom: '16px',
                  flexDirection: window.innerWidth < 600 ? 'column' : 'row'
                }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="lbl" style={{ color: 'var(--theme-error, #FF6B6B)' }}>Protein % (Locked by Diet)</label>
                  <input type="number" className="inp" value={macroP} disabled style={{ borderLeft: '3px solid var(--theme-error, #FF6B6B)', opacity: 0.6 }} />
                  <input type="range" min="0" max="100" value={macroP} disabled style={{ accentColor: 'var(--theme-error, #FF6B6B)', opacity: 0.6 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="lbl">Carbs % (Dynamic)</label>
                  <input type="number" className="inp" value={macroC} onChange={e => {
                      let c = Number(e.target.value);
                      const max = 100 - macroP;
                      if (c > max) c = max;
                      if (c < 0) c = 0;
                      setMacroC(c);
                      setMacroF(max - c);
                  }} style={{ borderLeft: '3px solid var(--theme-accent, #4DABF7)' }} />
                  <input type="range" min="0" max={100 - macroP} value={macroC} onChange={e => {
                      let c = Number(e.target.value);
                      setMacroC(c);
                      setMacroF(100 - macroP - c);
                  }} style={{ accentColor: 'var(--theme-accent, #4DABF7)' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="lbl">Fat % (Dynamic)</label>
                  <input type="number" className="inp" value={macroF} onChange={e => {
                      let f = Number(e.target.value);
                      const max = 100 - macroP;
                      if (f > max) f = max;
                      if (f < 0) f = 0;
                      setMacroF(f);
                      setMacroC(max - f);
                  }} style={{ borderLeft: '3px solid var(--theme-warning, #FCC419)' }} />
                  <input type="range" min="0" max={100 - macroP} value={macroF} onChange={e => {
                      let f = Number(e.target.value);
                      setMacroF(f);
                      setMacroC(100 - macroP - f);
                  }} style={{ accentColor: 'var(--theme-warning, #FCC419)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: (macroP + macroC + macroF) === 100 ? 'var(--theme-success, #92FE9D)' : 'var(--theme-error, #FF6B6B)', fontWeight: 'bold' }}>
                  Total: {macroP + macroC + macroF}%
                </span>
                <button onClick={handleSaveMacrosAndWater} className="btn" style={{ padding: '8px 16px', marginTop: '0' }} disabled={(macroP + macroC + macroF) !== 100}>
                  <Check size={14} /> Apply Macros
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: '600', color: 'var(--theme-accent, #00C9FF)' }}><Droplet size={18} /> Daily Water Goal</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="lbl">Target (fl oz)</label>
                  <input type="number" className="inp" value={waterGoal} onChange={e => setWaterGoal(Number(e.target.value))} />
                  <input type="range" min="0" max="250" step="5" value={waterGoal} onChange={e => setWaterGoal(Number(e.target.value))} style={{ accentColor: 'var(--theme-accent, #00C9FF)' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
                  <button onClick={handleSaveWaterOnly} className="btn" style={{ width: '100%', marginTop: '22px' }}>
                    <Check size={14} /> Apply Water
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', marginTop: '12px' }}>Standard recommendation is half your bodyweight in oz (e.g. {Math.round(weightLb / 2)} oz).</div>
            </div>

          </div>
        </div>


        {/* 7. Micro Nutrients Targets */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <div style={{ fontSize: '13px', color: 'var(--theme-text-dim, #8b8b9b)' }}>Based on your stats and activity level, here are your daily targets:</div>
             <button 
               onClick={() => updateGoals({ customMicros: {} })}
               style={{ background: 'var(--theme-error-dim, rgba(255,107,107,0.1))', border: 'none', color: 'var(--theme-error, #FF6B6B)', fontSize: '11px', fontWeight: '700', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
               RESET ALL TO DEFAULTS
             </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {MICRO_CATEGORIES.map((cat: any, i: number) => (
              <div key={i}>
                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--theme-accent, #00C9FF)', textTransform: 'uppercase', marginBottom: '8px' }}>{cat.cat}</div>
                {cat.keys.map((nutrient: any) => {
                  const isEnhanced = nutrient.exercise_sensitive && computed.computedMicros[nutrient.k] > (sex === 'f' || sex === 'female' ? nutrient.rda_f : nutrient.rda_m);
                  return (
                    <div key={nutrient.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.05))', fontSize: '13px' }}>
                      <span style={{ color: 'var(--theme-text-dim, #c0c0d0)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {nutrient.k} {isEnhanced && <span title="Activity Boost" style={{ fontSize: '12px' }}>🔥</span>}
                      </span>
                      {editingMicro === nutrient.k ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            type="number" 
                            step="0.1" 
                            autoFocus 
                            className="inp" 
                            value={customMicroValue} 
                            onChange={e => setCustomMicroValue(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && saveCustomMicro(nutrient.k)}
                            style={{ width: '80px', padding: '4px 8px' }} 
                          />
                          <button onClick={() => saveCustomMicro(nutrient.k)} className="btn" style={{ margin: 0, padding: '4px 8px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)' }}><Check size={14} /></button>
                        </div>
                      ) : (
                        <span 
                          style={{ fontWeight: '600', cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.3)', paddingBottom: '2px' }}
                          onClick={() => {
                            setEditingMicro(nutrient.k);
                            setCustomMicroValue(String(computed.computedMicros[nutrient.k]));
                          }}
                          title="Click to override target"
                        >
                          {(computed.computedMicros as any)[nutrient.k]} {nutrient.u}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>
      
      <style>{`
        .card { background: var(--theme-panel, rgba(255,255,255,0.02)); border: 1px solid var(--theme-border, rgba(255,255,255,0.05)); border-radius: 20px; padding: 24px; }
        .card-header { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin-bottom: 20px; color: var(--theme-text); }
        .lbl { font-size: 12px; color: var(--theme-text-dim, #8b8b9b); margin-bottom: 6px; display: block; font-weight: 500; }
        .inp { width: 100%; box-sizing: border-box; background: var(--theme-input-bg, rgba(0,0,0,0.4)); border: 1px solid var(--theme-border, rgba(255,255,255,0.1)); padding: 10px 14px; border-radius: 10px; color: var(--theme-text); outline: none; transition: border-color 0.2s; font-family: inherit; }
        .inp:focus { border-color: var(--theme-accent, #00C9FF); }
        .btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--theme-panel-dim, rgba(255,255,255,0.1)); color: var(--theme-text); border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 8px; font-family: inherit; }
        .btn:hover:not(:disabled) { background: var(--theme-panel, rgba(255,255,255,0.2)); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Light Theme Overrides for Weight Goal section */
        .theme-light-surface .weight-goal-card .card-header,
        .theme-light-surface .weight-goal-card .lbl,
        .theme-light-surface .weight-goal-card .inp {
          color: var(--theme-text) !important;
        }
        .theme-light-surface .weight-goal-card .lbl {
          color: var(--theme-text-dim) !important;
        }
      `}</style>
    </div>
  );
};

const HistoryReviewCard = ({ date, data, onClose, onGoToDiary }: any) => {
  const { totals } = useMemo(() => {
    const foodLog = data.foodLog || [];
    return { totals: sumFoods(foodLog.map((l: any) => l.f)) };
  }, [data]);

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric' 
  });

  return (
    <div className="card" style={{ border: '1px solid var(--theme-accent, #00C9FF)', background: 'var(--theme-accent-dim, rgba(0,201,255,0.05))', position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--theme-text-dim, #8b8b9b)', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: 'var(--theme-accent, #00C9FF)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Daily History Review</div>
        <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--theme-text)' }}>{displayDate}</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '16px', borderRadius: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '4px' }}>Calories</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--theme-text)' }}>{totals.calories} <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--theme-text-dim, #555)' }}>kcal</span></div>
        </div>
        <div style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--theme-error, #FF6B6B)' }}>P: {totals.protein}g</span>
              <span style={{ color: 'var(--theme-accent, #4DABF7)' }}>C: {totals.carbs}g</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--theme-warning, #FCC419)' }}>F: {totals.fat}g</span>
              <span style={{ color: 'var(--theme-success, #92FE9D)' }}>Fb: {totals.fiber}g</span>
           </div>
        </div>
      </div>

      <div style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Micronutrient Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
          {['Fiber', 'Sodium', 'Potassium', 'Magnesium', 'Zinc', 'Vitamin C'].map(k => {
            const val = totals[k.toLowerCase()] || 0;
            return (
              <div key={k} style={{ padding: '8px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '2px' }}>{k}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: val > 0 ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #555)' }}>{Math.round(val)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '800', marginBottom: '8px' }}>FOODS LOGGED ({data.foodLog?.length || 0})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(data.foodLog || []).map((l: any, i: number) => (
            <div key={i} style={{ fontSize: '11px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', color: 'var(--theme-text)' }}>
              <div style={{ fontWeight: '600' }}>{l.f.name}</div>
              <div style={{ fontSize: '9px', color: '#8b8b9b' }}>{l.f.cal} kcal</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onGoToDiary} className="btn" style={{ background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', width: '100%', padding: '12px' }}>
        Go to Diary for this Day
      </button>
    </div>
  );
};

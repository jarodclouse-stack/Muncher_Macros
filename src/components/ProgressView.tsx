import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { ACTIVITY_LEVELS, MICRO_CATEGORIES } from '../lib/constants';
import { computeGoals } from '../lib/goals/compute';
import { Flame, Activity, Save, Scale, Droplet, User, PieChart, Info, Check } from 'lucide-react';
import { WeightHistoryChart } from './WeightHistoryChart';

export const ProgressView: React.FC = () => {
  const { localCache, updateGoals, updateDayData, currentDate } = useDiary();
  const goals = localCache.goals || {};
  const currentDayData = localCache[currentDate] || {};
  
  const cleanNumInput = (v: string) => {
    if (v.length > 1 && v.startsWith('0') && !v.startsWith('0.')) return v.substring(1);
    return v;
  };
  
  const [dailyWeight, setDailyWeight] = useState<string>(currentDayData.weight?.toString() || '');
  const [logDate, setLogDate] = useState<string>(currentDate);
  const [sex, setSex] = useState(goals.sex || 'male');
  const [age, setAge] = useState(goals.age?.toString() || '30');
  const [heightIn, setHeightIn] = useState(goals.height?.toString() || '70');
  const [weightLb, setWeightLb] = useState(goals.weight?.toString() || '175');
  
  const [goalType, setGoalType] = useState(goals.goalType || 'maintain');
  const [goalRate, setGoalRate] = useState(goals.rate?.toString() || '0.5');
  
  // Auto-convert all body stats when units change
  React.useEffect(() => {
    const unitWeight = localCache.settings?.units?.weight || 'lb';
    const unitHeight = localCache.settings?.units?.height || 'in';
    const lastUnitWeight = (window as any).__lastUnitWeight;
    const lastUnitHeight = (window as any).__lastUnitHeight;

    if (lastUnitWeight && lastUnitWeight !== unitWeight) {
        // Convert weight-based fields
        const conv = unitWeight === 'kg' ? 0.453592 : (1 / 0.453592);
        setWeightLb((prev: string) => {
            const v = parseFloat(prev);
            return isNaN(v) ? prev : (v * conv).toFixed(1);
        });
        setTargetWeight((prev: string) => {
            const v = parseFloat(prev);
            return isNaN(v) ? prev : (v * conv).toFixed(1);
        });
        setGoalRate((prev: string) => {
            const v = parseFloat(prev);
            return isNaN(v) ? prev : (v * conv).toFixed(2);
        });
        setDailyWeight((prev: string) => {
            const v = parseFloat(prev);
            return isNaN(v) ? prev : (v * conv).toFixed(1);
        });
    }
    
    if (lastUnitHeight && lastUnitHeight !== unitHeight) {
        // Convert height
        const conv = unitHeight === 'cm' ? 2.54 : (1 / 2.54);
        setHeightIn((prev: string) => {
            const v = parseFloat(prev);
            return isNaN(v) ? prev : (v * conv).toFixed(1);
        });
    }

    (window as any).__lastUnitWeight = unitWeight;
    (window as any).__lastUnitHeight = unitHeight;
  }, [localCache.settings?.units?.weight, localCache.settings?.units?.height]);

  const [targetWeight, setTargetWeight] = useState(goals.targetWeight?.toString() || '165');

  const [activityId, setActivityId] = useState(goals.activityId || 'moderate');
  const [proteinLevelId, setProteinLevelId] = useState(goals.proteinLevelId || 'custom');
  
  const [customRatioLb, setCustomRatioLb] = useState(goals.customRatioLb || (ACTIVITY_LEVELS.find((a: any) => a.id === 'moderate')?.ratioKg || 1.5) * 0.453592);

  const unitWeight = localCache.settings?.units?.weight || 'lb';
  const unitHeight = localCache.settings?.units?.height || 'in';
  const isMetric = unitWeight === 'kg';

  const computed = computeGoals({
    sex, age, height: heightIn, weight: weightLb, 
    goalType, rate: goalRate, activityId, proteinLevelId, customRatioLb,
    macroP: goals.macroP, macroC: goals.macroC, macroF: goals.macroF,
    customMicros: goals.customMicros,
    units: { weight: unitWeight, height: unitHeight }
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
    updateGoals({ activityId, proteinLevelId, customRatioLb: proteinLevelId === 'custom' ? parseFloat(customRatioLb.toString()) : undefined });
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
    const w = parseFloat(dailyWeight);
    if (!isNaN(w) && w > 0) {
      updateDayData(logDate, { weight: w });
      // If logging for today, sync to global goals immediately
      if (logDate === currentDate) {
        updateGoals({ weight: w });
        setWeightLb(w.toString()); // sync form visually
      }
      alert(`Weight record saved for ${logDate}!`);
    }
  };


  const calAdj = computed.targetCal - computed.tdee;
  const currentAct = ACTIVITY_LEVELS.find((a: any) => a.id === activityId) || ACTIVITY_LEVELS[2];

  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      
      <div style={{ padding: 'var(--space-md)', background: 'var(--theme-accent-dim, rgba(0, 201, 255, 0.1))', color: 'var(--theme-accent)', borderRadius: 'var(--radius-md)', fontSize: '13px', display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', border: '1px solid var(--theme-border)' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>Your targets power everything in the app. Updates save automatically when you confirm them.</span>
      </div>

      {/* 3. Legacy-style Weight History Chart */}
      <WeightHistoryChart localCache={localCache} targetWeight={Number(targetWeight)} />

      {/* 4. Progress to Goal Visualization */}
      <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}><Activity size={18} color="var(--theme-success, #92FE9D)" /> Progress to Goal Visualization</div>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)', padding: '0 var(--space-xl)' }}>
          <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--theme-text)', lineHeight: 1 }}>
            {Math.abs(parseFloat(weightLb.toString()) - parseFloat(targetWeight.toString())).toFixed(1)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 'var(--space-xs)', maxWidth: '400px', margin: 'var(--space-xs) auto 0' }}>
            {unitWeight} remaining to Reach Your {targetWeight} {unitWeight} goal
          </div>
        </div>

        <div style={{ padding: '0 var(--space-xs)' }}>
          <div style={{ height: '12px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--theme-border)', padding: '3px' }}>
            <div style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--theme-accent), var(--theme-success))', 
              borderRadius: '10px',
              width: `${Math.max(5, Math.min(100, (1 - Math.abs(weightLb - targetWeight) / 25) * 100))}%`,
              transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: 'var(--space-md)' }}>
            <span>Current: {weightLb} {unitWeight}</span>
            <span>Target: {targetWeight} {unitWeight}</span>
          </div>
        </div>
      </div>

      {/* 5. Weight Tools (Manual Entry) */}
      <div className="section" id="weight-logging" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}><Scale size={18} color="var(--theme-accent, #4DABF7)" /> Weight Record & History</div>
        <form onSubmit={handleSaveDailyWeight} style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="lbl">Record Date</label>
            <input type="date" className="inp" value={logDate} onChange={e => setLogDate(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="lbl">Body Weight ({unitWeight})</label>
            <input type="number" step="0.1" className="inp" placeholder="Enter weight..." value={dailyWeight} onChange={e => setDailyWeight(cleanNumInput(e.target.value))} />
          </div>
          <button type="submit" className="btn" style={{ height: '42px', marginTop: 0, padding: '0 24px', background: 'var(--theme-accent)', color: '#000' }}><Check size={16} /> Save Weight Record</button>
        </form>
        <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '12px', fontWeight: '500' }}>💡 Tip: Logging weight for today updates your body stats & TDEE app-wide. Historical logs update your chart only.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

        {/* 4. Body Stats & Goal Configuration */}
        <div className="section" style={{ gridColumn: '1 / -1', background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}><User size={18} color="var(--theme-accent, #00C9FF)" /> Body Stats & TDEE Configuration</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
            <form onSubmit={handleSaveBodyAndGoal} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ fontWeight: '600', color: 'var(--theme-text)', borderBottom: '1px solid var(--theme-border)', paddingBottom: 'var(--space-xs)' }}>Your physical details</div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Sex</label>
                  <select className="inp" value={sex} onChange={e => setSex(e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Age</label>
                  <input type="number" className="inp" value={age} onChange={e => setAge(cleanNumInput(e.target.value))} />
                </div>
              </div>
               <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Height ({unitHeight})</label>
                  <input type="number" className="inp" value={heightIn} onChange={e => setHeightIn(cleanNumInput(e.target.value))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Weight ({unitWeight})</label>
                  <input type="number" className="inp" value={weightLb} onChange={e => setWeightLb(cleanNumInput(e.target.value))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Goal Weight (Target)</label>
                  <input type="number" step="0.1" className="inp" value={targetWeight} onChange={e => setTargetWeight(cleanNumInput(e.target.value))} style={{ color: 'var(--theme-accent)' }} />
                </div>
              </div>

              <div style={{ fontWeight: '600', color: 'var(--theme-text)', borderBottom: '1px solid var(--theme-border)', paddingBottom: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>Weight Management Goal</div>
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
                  <label className="lbl">Rate ({unitWeight} per week)</label>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                    <input type="number" step={isMetric ? 0.05 : 0.25} min="0" max={isMetric ? 1 : 2} className="inp" value={goalRate} onChange={e => {
                      setGoalRate(cleanNumInput(e.target.value));
                    }} />
                    <span style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '700' }}>{unitWeight}/wk</span>
                  </div>
                </div>
              )}
              <div style={{ marginTop: 'var(--space-md)' }}>
                <button type="submit" className="btn" style={{ background: 'var(--theme-accent)', color: 'var(--theme-panel-base, black)', width: '100%' }}><Save size={14} /> Update Body & Goal Settings</button>
              </div>
            </form>

            <div style={{ fontSize: '12px', color: 'var(--theme-text-dim)', lineHeight: '1.6' }}>
              Keep your body stats up-to-date to ensure your TDEE (Total Daily Energy Expenditure) calculation remains accurate as you progress toward your goals.
            </div>
          </div>
        </div>

        {/* 3. Activity Level */}
        <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}><Activity size={18} color="var(--theme-warning, #FCC419)" /> Activity & Protein Target</div>
          <form onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label className="lbl">Activity Level</label>
              <select className="inp" value={activityId} onChange={e => setActivityId(e.target.value)}>
                {ACTIVITY_LEVELS.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.label} (×{a.tdee} PAL)</option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '4px' }}>{currentAct?.desc}</div>
            </div>
            <div>
              <label className="lbl">Protein Target Level</label>
              <select className="inp" value={proteinLevelId} onChange={e => setProteinLevelId(e.target.value)}>
                {ACTIVITY_LEVELS.map((a: any) => (
                  <option key={`p-${a.id}`} value={a.id}>{a.label} ({isMetric ? Math.round(a.ratioKg * 100)/100 : Math.round(a.ratioKg * 0.453592 * 100)/100}g / {unitWeight})</option>
                ))}
                <option value="custom">Custom target</option>
              </select>
            </div>
            {proteinLevelId === 'custom' && (
              <div>
                <label className="lbl">Custom Protein (g per {unitWeight} of bodyweight)</label>
                <input type="number" step="0.05" className="inp" value={customRatioLb} onChange={e => setCustomRatioLb(parseFloat(e.target.value) || 0)} />
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--theme-accent)', marginTop: '4px', textAlign: 'right', fontWeight: '800' }}>
              Final Target: {Math.round(computed.proteinG)}g / day
            </div>
            <button type="submit" className="btn" style={{ background: 'var(--theme-accent)', color: '#000' }}><Save size={14} /> Save Activity</button>
          </form>
        </div>

        {/* 4. Calorie Breakdown Visual */}
        <div className="section" style={{ gridColumn: '1 / -1', background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}><Flame size={18} color="var(--theme-error, #FF6B6B)" /> TDEE Calculator Breakdown</div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', marginTop: 'var(--space-md)' }}>
            <div style={{ background: 'var(--theme-panel-dim)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', flex: 1, minWidth: '140px', border: '1px solid var(--theme-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--theme-text-dim)' }}>Base Metabolic Rate (BMR)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--theme-text)' }}>{Math.round(computed.bmr)}</div>
            </div>
            
            <div style={{ fontSize: '24px', color: 'var(--theme-text-dim)', fontWeight: 'bold' }}>⟶</div>
            
            <div style={{ background: 'var(--theme-warning-dim, rgba(252, 196, 25, 0.1))', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--theme-warning)', flex: 1, minWidth: '140px' }}>
              <div style={{ fontSize: '12px', color: 'var(--theme-warning)' }}>TDEE (includes PAL ×{currentAct?.tdee})</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--theme-warning)' }}>{Math.round(computed.tdee)}</div>
            </div>

            <div style={{ fontSize: '24px', color: 'var(--theme-text-dim)', fontWeight: 'bold' }}>{calAdj >= 0 ? '+' : '-'}</div>
            
            <div style={{ background: 'var(--theme-accent-dim)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--theme-accent)' }}>
              <div style={{ fontSize: '12px', color: 'var(--theme-accent)' }}>Goal Adjustment</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--theme-accent)' }}>{Math.abs(Math.round(calAdj))}</div>
            </div>

            <div style={{ fontSize: '24px', color: 'var(--theme-text-dim)', fontWeight: 'bold' }}>=</div>
            
            <div style={{ background: 'var(--theme-success-dim)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--theme-success)', flex: 2, minWidth: '200px' }}>
              <div style={{ fontSize: '12px', color: 'var(--theme-success)' }}>Daily Target Calories</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--theme-success)' }}>{Math.round(computed.targetCal)}</div>
            </div>
          </div>
        </div>

        {/* 5. Macro Split & Water Goal */}
        <div className="section" style={{ gridColumn: '1 / -1', background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}><PieChart size={18} color="var(--theme-accent, #B197FC)" /> Macro Split & Daily Fluids</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)', marginTop: 'var(--space-md)' }}>
            
            <div>
              <div style={{ marginBottom: 'var(--space-md)', fontSize: '13px', color: 'var(--theme-text-dim)' }}>Customize your calorie ratio. Must equal exactly 100%.</div>
              <div 
                style={{ 
                  display: 'flex', 
                  gap: 'var(--space-md)', 
                  marginBottom: 'var(--space-md)',
                  flexDirection: 'column'
                }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <label className="lbl" style={{ color: 'var(--theme-error)' }}>Protein % (Locked by Diet)</label>
                  <input type="number" className="inp" value={macroP} disabled style={{ borderLeft: '3px solid var(--theme-error)', opacity: 0.6 }} />
                  <input type="range" min="0" max="100" value={macroP} disabled style={{ accentColor: 'var(--theme-error)', opacity: 0.6 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <label className="lbl">Carbs % (Dynamic)</label>
                  <input type="number" className="inp" value={macroC} onChange={e => {
                      let c = Number(e.target.value);
                      const max = 100 - macroP;
                      if (c > max) c = max;
                      if (c < 0) c = 0;
                      setMacroC(c);
                      setMacroF(max - c);
                  }} style={{ borderLeft: '3px solid var(--theme-accent)' }} />
                  <input type="range" min="0" max={100 - macroP} value={macroC} onChange={e => {
                      let c = Number(e.target.value);
                      setMacroC(c);
                      setMacroF(100 - macroP - c);
                  }} style={{ accentColor: 'var(--theme-accent)' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <label className="lbl">Fat % (Dynamic)</label>
                  <input type="number" className="inp" value={macroF} onChange={e => {
                      let f = Number(e.target.value);
                      const max = 100 - macroP;
                      if (f > max) f = max;
                      if (f < 0) f = 0;
                      setMacroF(f);
                      setMacroC(max - f);
                  }} style={{ borderLeft: '3px solid var(--theme-warning)' }} />
                  <input type="range" min="0" max={100 - macroP} value={macroF} onChange={e => {
                      let f = Number(e.target.value);
                      setMacroF(f);
                      setMacroC(100 - macroP - f);
                  }} style={{ accentColor: 'var(--theme-warning)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: (macroP + macroC + macroF) === 100 ? 'var(--theme-success)' : 'var(--theme-error)', fontWeight: 'bold' }}>
                  Total: {macroP + macroC + macroF}%
                </span>
                <button onClick={handleSaveMacrosAndWater} className="btn" style={{ padding: '8px 16px', marginTop: '0', background: 'var(--theme-accent)', color: '#000' }} disabled={(macroP + macroC + macroF) !== 100}>
                  <Check size={14} /> Apply Macros
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--theme-accent)' }}><Droplet size={18} /> Daily Water Goal</div>
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexDirection: 'column' }}>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <label className="lbl">Target (fl oz)</label>
                  <input type="number" className="inp" value={waterGoal} onChange={e => setWaterGoal(Number(e.target.value))} />
                  <input type="range" min="0" max="250" step="5" value={waterGoal} onChange={e => setWaterGoal(Number(e.target.value))} style={{ accentColor: 'var(--theme-accent)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <button onClick={handleSaveWaterOnly} className="btn" style={{ width: '100%', marginTop: '0', background: 'var(--theme-accent)', color: '#000' }}>
                    <Check size={14} /> Apply Water
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '4px' }}>Standard recommendation is half your bodyweight in oz (e.g. {Math.round((isMetric ? weightLb * 2.20462 : Number(weightLb)) / 2)} oz).</div>
            </div>

          </div>
        </div>


        {/* 7. Micro Nutrients Targets */}
        <div className="section" style={{ gridColumn: '1 / -1', background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
             <div style={{ fontSize: '13px', color: 'var(--theme-text-dim)' }}>Based on your stats and activity level, here are your daily targets:</div>
             <button 
               onClick={() => updateGoals({ customMicros: {} })}
               style={{ background: 'var(--theme-error-dim)', border: 'none', color: 'var(--theme-error)', fontSize: '11px', fontWeight: '700', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
               RESET ALL TO DEFAULTS
             </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
            {MICRO_CATEGORIES.map((cat: any, i: number) => (
              <div key={i}>
                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--theme-accent)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>{cat.cat}</div>
                {cat.keys.map((nutrient: any) => {
                  const isEnhanced = nutrient.exercise_sensitive && computed.computedMicros[nutrient.k] > (sex === 'f' || sex === 'female' ? nutrient.rda_f : nutrient.rda_m);
                  return (
                    <div key={nutrient.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--theme-border)', fontSize: '13px' }}>
                      <span style={{ color: 'var(--theme-text-dim)', display: 'flex', gap: '4px', alignItems: 'center' }}>
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
                          <button onClick={() => saveCustomMicro(nutrient.k)} className="btn" style={{ margin: 0, padding: '4px 8px', background: 'var(--theme-accent)', color: '#000' }}><Check size={14} /></button>
                        </div>
                      ) : (
                        <span 
                          style={{ fontWeight: '600', cursor: 'pointer', borderBottom: '1px dashed var(--theme-border)', paddingBottom: '2px', color: 'var(--theme-text)' }}
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

export default ProgressView;

import React, { useState } from 'react';
import { Toast } from './Toast';
import { useDiary } from '../context/DiaryContext';
import { ACTIVITY_LEVELS, MICRO_CATEGORIES } from '../lib/constants';
import { computeGoals } from '../lib/goals/compute';
import { Flame, Save, Droplet, User, PieChart, Info, Check, Edit2, ChevronDown, Leaf, Dna, Lightbulb, Watch, RefreshCw, Link2, LinkSlash } from 'lucide-react';

export const ProgressView: React.FC = () => {
  const { localCache, updateGoals } = useDiary();
  const goals = localCache.goals || {};
  
  const cleanNumInput = (v: string) => {
    if (v.length > 1 && v.startsWith('0') && !v.startsWith('0.')) return v.substring(1);
    return v;
  };
  
  const [sex, setSex] = useState(goals.sex || 'male');
  const [age, setAge] = useState(goals.age?.toString() || '30');
  const [heightIn, setHeightIn] = useState(goals.height?.toString() || '70');
  const [weightLb, setWeightLb] = useState(goals.weight?.toString() || '175');
  
  const [goalType, setGoalType] = useState(goals.goalType || 'maintain');
  const [goalRate, setGoalRate] = useState(goals.rate?.toString() || '0.5');
  const [targetWeight, setTargetWeight] = useState(goals.targetWeight?.toString() || '165');
  const [toastMsg, setToastMsg] = useState('');
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isBioEditing, setIsBioEditing] = useState(false);


  // Auto-convert all body stats when units change
  React.useEffect(() => {
    const unitWeight = localCache.settings?.units?.weight || 'lb';
    const unitHeight = localCache.settings?.units?.height || 'in';
    const win = window as unknown as Record<string, string>;
    const lastUnitWeight = win.__lastUnitWeight;
    const lastUnitHeight = win.__lastUnitHeight;

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
    }

    if (lastUnitHeight && lastUnitHeight !== unitHeight) {
        // Convert height
        const conv = unitHeight === 'cm' ? 2.54 : (1 / 2.54);
        setHeightIn((prev: string) => {
            const v = parseFloat(prev);
            return isNaN(v) ? prev : (v * conv).toFixed(1);
        });
    }

    win.__lastUnitWeight = unitWeight;
    win.__lastUnitHeight = unitHeight;
  }, [localCache.settings?.units?.weight, localCache.settings?.units?.height]);

  React.useEffect(() => {
    if (goals.weight) {
      setWeightLb(goals.weight.toString());
    }
  }, [goals.weight]);


  const [activityId, setActivityId] = useState(goals.activityId || 'moderate');
  const [proteinLevelId, setProteinLevelId] = useState(goals.proteinLevelId || goals.activityId || 'moderate');
  
  const customRatioLb = goals.customRatioLb || (ACTIVITY_LEVELS.find((a: { id: string; ratioKg: number }) => a.id === 'moderate')?.ratioKg || 1.5) * 0.453592;

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
  const OZ_TO_ML = 29.5735;
  const waterUnit = isMetric ? 'mL' : 'fl oz';
  const displayWaterGoal = isMetric ? Math.round(waterGoal * OZ_TO_ML) : waterGoal;
  const setDisplayWaterGoal = (val: number) => setWaterGoal(isMetric ? val / OZ_TO_ML : val);
  const waterSliderMax = isMetric ? 7500 : 250;
  const waterSliderStep = isMetric ? 50 : 5;

  // Macro splits
  const macroP = computed.macroP;
  const [macroC, setMacroC] = useState(computed.macroC || 45);
  const [macroF, setMacroF] = useState(computed.macroF || 25);

  const [isMicrosOpen, setIsMicrosOpen] = useState(false);
  const [editingMicro, setEditingMicro] = useState('');
  const [customMicroValue, setCustomMicroValue] = useState('');

  // Fitness tracker integration state
  const [trackerStatus, setTrackerStatus] = useState<Record<string, any>>({ fitbit: { connected: false }, google_fit: { connected: false } });
  const [trackerSyncing, setTrackerSyncing] = useState<string | null>(null);
  const [useTrackerTDEE, setUseTrackerTDEE] = useState<boolean>(goals.useTrackerTDEE || false);
  const [trackerToast, setTrackerToast] = useState('');

  // Load tracker connection status + check for OAuth callback result
  React.useEffect(() => {
    const token = (window as any).__supabaseToken || localStorage.getItem('sb-access-token') || '';
    if (!token) return;

    fetch('/api/tracker-status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setTrackerStatus(data))
      .catch(() => {});

    // Check if we just returned from an OAuth callback
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('tracker_connected');
    const error = params.get('tracker_error');
    if (connected) {
      setTrackerToast(`✅ ${connected === 'fitbit' ? 'Fitbit' : 'Google Fit'} connected!`);
      window.history.replaceState({}, '', window.location.pathname);
      // Reload status after connect
      fetch('/api/tracker-status', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setTrackerStatus).catch(() => {});
    } else if (error) {
      setTrackerToast(`⚠️ Connection failed: ${error.replace(/_/g, ' ')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const connectTracker = async (provider: 'fitbit' | 'google_fit') => {
    const token = (window as any).__supabaseToken || localStorage.getItem('sb-access-token') || '';
    const endpoint = provider === 'fitbit' ? '/api/fitbit-auth' : '/api/google-fit-auth';
    try {
      const r = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setTrackerToast('Failed to start OAuth flow');
    }
  };

  const disconnectTracker = async (provider: 'fitbit' | 'google_fit') => {
    const token = (window as any).__supabaseToken || localStorage.getItem('sb-access-token') || '';
    await fetch('/api/tracker-disconnect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    setTrackerStatus(prev => ({ ...prev, [provider]: { connected: false } }));
    if (goals.trackerSource === provider) {
      updateGoals({ useTrackerTDEE: false, trackerTDEE: null, trackerSource: null });
      setUseTrackerTDEE(false);
    }
  };

  const syncTracker = async (provider: 'fitbit' | 'google_fit') => {
    setTrackerSyncing(provider);
    const token = (window as any).__supabaseToken || localStorage.getItem('sb-access-token') || '';
    const endpoint = provider === 'fitbit' ? '/api/fitbit-sync' : '/api/google-fit-sync';
    try {
      const r = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      if (data.caloriesBurned) {
        setTrackerStatus((prev: any) => ({
          ...prev,
          [provider]: { ...prev[provider], last_calories_burned: data.caloriesBurned, last_synced_at: new Date().toISOString() }
        }));
        if (useTrackerTDEE && goals.trackerSource === provider) {
          updateGoals({ trackerTDEE: data.caloriesBurned });
        }
        setTrackerToast(`Synced ${data.caloriesBurned.toLocaleString()} kcal burned today`);
      } else if (data.code === 'RECONNECT_REQUIRED') {
        setTrackerToast('Session expired — please reconnect your tracker');
        setTrackerStatus((prev: any) => ({ ...prev, [provider]: { connected: false } }));
      }
    } catch {
      setTrackerToast('Sync failed — try again');
    } finally {
      setTrackerSyncing(null);
    }
  };

  const handleUseTrackerTDEE = (enabled: boolean, provider: 'fitbit' | 'google_fit') => {
    setUseTrackerTDEE(enabled);
    const cal = trackerStatus[provider]?.last_calories_burned || null;
    updateGoals({
      useTrackerTDEE: enabled,
      trackerTDEE: enabled ? cal : null,
      trackerSource: enabled ? provider : null,
    });
  };

  const saveCustomMicro = (k: string) => {
    updateGoals({ customMicros: { ...(goals.customMicros || {}), [k]: Number(customMicroValue) } });
    setEditingMicro('');
  };

  const handleSaveBodyAndGoal = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoals({ sex, age: Number(age), height: Number(heightIn), goalType, rate: Number(goalRate), targetWeight: Number(targetWeight), activityId, proteinLevelId });
    setIsBioEditing(false);
  };

  const handleSaveMacrosAndWater = () => {
    if (macroP + macroC + macroF !== 100) { setToastMsg('Macros must equal exactly 100%'); return; }
    updateGoals({ macroC, macroF, waterGoal });
  };

  const handleSaveWaterOnly = () => {
    updateGoals({ waterGoal });
  };


  const calAdj = computed.targetCal - computed.tdee;
  const currentAct = ACTIVITY_LEVELS.find((a: { id: string; desc?: string; tdee?: number }) => a.id === activityId) || ACTIVITY_LEVELS[2];

  return (
    <div id="page-progress" className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      
      <div style={{ padding: 'var(--space-md)', background: 'var(--theme-accent-dim, rgba(0, 201, 255, 0.1))', color: 'var(--theme-accent)', borderRadius: 'var(--radius-md)', fontSize: '13px', display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', border: '1px solid var(--theme-border)' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>Your targets power everything in the app. Updates save automatically when you confirm them.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>

        {/* 4. Body Stats & Goal Configuration */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}><User size={18} color="var(--theme-accent, #00C9FF)" /> Body Stats & TDEE Configuration</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>
            <form onSubmit={handleSaveBodyAndGoal} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ fontWeight: '600', color: 'var(--theme-text)', borderBottom: '1px solid var(--theme-border)', paddingBottom: 'var(--space-xs)' }}>Your physical details</div>
              
              <div>
                <label className="lbl">Goal Weight (Target)</label>
                <input type="number" step="0.1" className="inp" value={targetWeight} onChange={e => setTargetWeight(cleanNumInput(e.target.value))} />
              </div>

              {/* Collapsible Biological Profile */}
              <div className="glass-card" style={{ 
                border: '1px solid var(--theme-border)', 
                borderRadius: 'var(--radius-md)', 
                overflow: 'hidden', 
                background: 'var(--theme-panel-dim, rgba(255, 255, 255, 0.02))',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginTop: 'var(--space-xs)'
              }}>
                <div 
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  style={{ 
                    padding: 'var(--space-sm) var(--space-md)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: 'var(--theme-panel-base, rgba(0, 0, 0, 0.05))',
                    borderBottom: isBioExpanded ? '1px solid var(--theme-border)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Dna size={14} color="var(--theme-accent)" /> Biological Profile (Sex, Age, Height)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronDown 
                      size={16} 
                      style={{ 
                        transform: isBioExpanded ? 'rotate(180deg)' : 'none', 
                        transition: 'transform 0.3s ease',
                        color: 'var(--theme-text-dim)' 
                      }} 
                    />
                  </div>
                </div>

                {isBioExpanded && (
                  <div style={{ 
                    padding: 'var(--space-md)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-sm)',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontStyle: 'italic' }}>
                        These stats are locked to prevent accidental changes.
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsBioEditing(!isBioEditing);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: isBioEditing ? 'var(--theme-accent)' : 'transparent',
                          color: isBioEditing ? 'var(--theme-panel-base, #000)' : 'var(--theme-accent)',
                          border: '1px solid var(--theme-accent)',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isBioEditing ? (
                          <>
                            <Check size={10} /> Done
                          </>
                        ) : (
                          <>
                            <Edit2 size={10} /> Edit
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <div style={{ flex: 1 }}>
                        <label className="lbl" style={{ opacity: isBioEditing ? 1 : 0.6 }}>Sex</label>
                        <select 
                          className="inp" 
                          value={sex} 
                          onChange={e => setSex(e.target.value)}
                          disabled={!isBioEditing}
                          style={{ 
                            opacity: isBioEditing ? 1 : 0.7, 
                            cursor: isBioEditing ? 'default' : 'not-allowed',
                            background: isBioEditing ? 'var(--theme-panel-base)' : 'var(--theme-panel-dim)'
                          }}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="lbl" style={{ opacity: isBioEditing ? 1 : 0.6 }}>Age</label>
                        <input 
                          type="number" 
                          className="inp" 
                          value={age} 
                          onChange={e => setAge(cleanNumInput(e.target.value))}
                          disabled={!isBioEditing}
                          style={{ 
                            opacity: isBioEditing ? 1 : 0.7, 
                            cursor: isBioEditing ? 'text' : 'not-allowed',
                            background: isBioEditing ? 'var(--theme-panel-base)' : 'var(--theme-panel-dim)'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="lbl" style={{ opacity: isBioEditing ? 1 : 0.6 }}>Height ({unitHeight})</label>
                      <input 
                        type="number" 
                        className="inp" 
                        value={heightIn} 
                        onChange={e => setHeightIn(cleanNumInput(e.target.value))}
                        disabled={!isBioEditing}
                        style={{ 
                          opacity: isBioEditing ? 1 : 0.7, 
                          cursor: isBioEditing ? 'text' : 'not-allowed',
                          background: isBioEditing ? 'var(--theme-panel-base)' : 'var(--theme-panel-dim)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontWeight: '600', color: 'var(--theme-text)', borderBottom: '1px solid var(--theme-border)', paddingBottom: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>Weight Management Goal</div>
              <div>
                <label className="lbl">Goal Mode</label>
                <select className="inp" value={goalType} onChange={e => {
                  const newType = e.target.value;
                  setGoalType(newType);
                  if (newType === 'gain' && (goalRate === '2.0' || parseFloat(goalRate) > 1.5)) {
                    setGoalRate('1.5');
                  } else if (newType === 'lose' && parseFloat(goalRate) > 2.0) {
                    setGoalRate('2.0');
                  }
                }}>
                  <option value="lose">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Muscle/Weight</option>
                </select>
              </div>
              {goalType !== 'maintain' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <label className="lbl">
                    {goalType === 'gain' ? 'Weight Gain Rate' : 'Weight Loss Rate'} ({unitWeight} per week)
                  </label>
                  {goalType === 'gain' ? (
                    <select 
                      className="inp" 
                      value={goalRate} 
                      onChange={e => setGoalRate(e.target.value)}
                    >
                      <option value="0.5">0.5 {unitWeight}/wk</option>
                      <option value="1.0">1.0 {unitWeight}/wk</option>
                      <option value="1.5">1.5 {unitWeight}/wk</option>
                    </select>
                  ) : (
                    <select 
                      className="inp" 
                      value={goalRate} 
                      onChange={e => setGoalRate(e.target.value)}
                    >
                      <option value="0.5">0.5 {unitWeight}/wk</option>
                      <option value="1.0">1.0 {unitWeight}/wk</option>
                      <option value="1.5">1.5 {unitWeight}/wk</option>
                      <option value="2.0">2.0 {unitWeight}/wk</option>
                    </select>
                  )}
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '10px 12px', 
                    background: 'var(--theme-panel-dim, rgba(255, 255, 255, 0.02))', 
                    border: '1px solid var(--theme-border)', 
                    borderRadius: 'var(--radius-sm, 6px)',
                    fontSize: '12px', 
                    color: 'var(--theme-accent)', 
                    lineHeight: '1.4',
                    fontWeight: '550',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center'
                  }}>
                    <Lightbulb size={14} color="var(--theme-accent)" style={{ flexShrink: 0 }} />
                    <span>
                      {goalType === 'gain' 
                        ? 'Building muscle successfully requires consistent nutrition and dedicated, persistent effort.' 
                        : 'Losing weight successfully requires consistent nutrition tracking and dedicated daily habits.'}
                    </span>
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

        {/* 4. Calorie Breakdown Visual */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)' }}>
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

          {/* Decoupled Activity & Protein Selectors */}
          <div style={{ marginTop: 'var(--space-lg)', borderTop: '1px solid var(--theme-border)', paddingTop: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            {/* 1. Daily Activity Level (Calorie Target) */}
            <div>
              <label className="lbl" style={{ marginBottom: 'var(--space-xs)', display: 'block' }}>Daily Activity Level (Calorie Burn)</label>
              <select className="inp" value={activityId} onChange={e => {
                const id = e.target.value;
                setActivityId(id);
                updateGoals({ activityId: id });
              }}>
                {ACTIVITY_LEVELS.map((a: { id: string; label: string; tdee: number }) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — (PAL multiplier ×{a.tdee})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '12px', color: 'var(--theme-text-dim)', marginTop: '6px', padding: '10px 12px', background: 'var(--theme-panel-dim)', borderRadius: 'var(--radius-md)', border: '1px solid var(--theme-border)', lineHeight: '1.5' }}>
                {currentAct?.desc}
              </div>
            </div>

            {/* 2. Protein Target Level */}
            <div>
              <label className="lbl" style={{ marginBottom: 'var(--space-xs)', display: 'block' }}>Protein Intake Level</label>
              <select className="inp" value={proteinLevelId} onChange={e => {
                const id = e.target.value;
                setProteinLevelId(id);
                updateGoals({ proteinLevelId: id });
              }}>
                {ACTIVITY_LEVELS.map((a: { id: string; label: string; ratioKg: number }) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {isMetric ? Math.round(a.ratioKg * 100)/100 : Math.round(a.ratioKg * 0.453592 * 100)/100}g/{unitWeight}
                  </option>
                ))}
                <option value="custom">Custom Target...</option>
              </select>
            </div>

            {/* 3. Custom Ratio Input (Shown only when Custom is selected) */}
            {proteinLevelId === 'custom' && (
              <div style={{ 
                padding: 'var(--space-md)', 
                background: 'var(--theme-panel-dim, rgba(255, 255, 255, 0.02))', 
                border: '1px solid var(--theme-border)', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'var(--space-xs)',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <label className="lbl">Custom Ratio (grams per {unitWeight})</label>
                <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0.1"
                    max="3.0"
                    className="inp" 
                    value={isMetric ? Number((customRatioLb / 0.453592).toFixed(2)) : Number(customRatioLb.toFixed(2))} 
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        const newRatioLb = isMetric ? val * 0.453592 : val;
                        updateGoals({ customRatioLb: newRatioLb });
                      }
                    }} 
                  />
                  <span style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '700' }}>
                    g/{unitWeight}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontStyle: 'italic', marginTop: '2px' }}>
                  Standard muscle preservation ratio is around 0.68 to 1.0 g/lb.
                </div>
              </div>
            )}

            {/* Dynamic Summary bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--theme-panel-base, rgba(0, 0, 0, 0.05))', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--theme-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--theme-text-dim)' }}>
                Target Protein Summary:
              </span>
              <span style={{ fontSize: '15px', color: 'var(--theme-accent)', fontWeight: '800' }}>
                {Math.round(computed.proteinG)}g / day
              </span>
            </div>
          </div>
        </div>

        {/* Fitness Tracker Integration */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: 'var(--theme-text)' }}>
            <Watch size={18} color="var(--theme-accent)" /> Fitness Tracker Integration
          </div>
          <div style={{ fontSize: '12px', color: 'var(--theme-text-dim)', marginBottom: 'var(--space-lg)', lineHeight: '1.5' }}>
            Connect your wearable to replace the formula-based TDEE with your device's actual daily calorie burn — including Apple Watch (via Google Fit on Android) and Fitbit.
          </div>

          {trackerToast && (
            <div style={{ marginBottom: 'var(--space-md)', padding: '10px 14px', background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--theme-text)' }}>
              {trackerToast}
              <button onClick={() => setTrackerToast('')} style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'var(--theme-text-dim)', cursor: 'pointer', fontSize: '14px' }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {([
              { provider: 'fitbit' as const, label: 'Fitbit', emoji: '⌚', desc: 'Versa, Charge, Sense, Inspire series' },
              { provider: 'google_fit' as const, label: 'Google Fit / Galaxy Watch', emoji: '🤖', desc: 'Galaxy Watch 4+, Pixel Watch, Wear OS devices' },
            ] as const).map(({ provider, label, emoji, desc }) => {
              const s = trackerStatus[provider] || {};
              const isConnected = !!s.connected;
              const isSyncing = trackerSyncing === provider;
              const lastSync = s.last_synced_at ? new Date(s.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
              const isActiveSource = goals.trackerSource === provider && useTrackerTDEE;

              return (
                <div key={provider} style={{
                  padding: 'var(--space-md)',
                  background: isConnected ? 'var(--theme-panel-dim)' : 'var(--theme-panel)',
                  border: `1px solid ${isActiveSource ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-sm)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--theme-text)' }}>{emoji} {label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>{desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      {isConnected ? (
                        <>
                          <button
                            onClick={() => syncTracker(provider)}
                            disabled={isSyncing}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--theme-accent-dim)', border: '1px solid var(--theme-accent)', borderRadius: '8px', color: 'var(--theme-accent)', fontSize: '12px', fontWeight: '700', cursor: isSyncing ? 'default' : 'pointer' }}
                          >
                            <RefreshCw size={12} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                            {isSyncing ? 'Syncing…' : 'Sync'}
                          </button>
                          <button
                            onClick={() => disconnectTracker(provider)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'none', border: '1px solid var(--theme-border)', borderRadius: '8px', color: 'var(--theme-text-dim)', fontSize: '12px', cursor: 'pointer' }}
                          >
                            <LinkSlash size={12} /> Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => connectTracker(provider)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--theme-accent)', border: 'none', borderRadius: '10px', color: '#000', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          <Link2 size={13} /> Connect
                        </button>
                      )}
                    </div>
                  </div>

                  {isConnected && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--theme-border)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        {s.last_calories_burned ? (
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Burn</div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--theme-warning)' }}>{s.last_calories_burned.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>kcal</span></div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--theme-text-dim)', fontStyle: 'italic' }}>Sync to get today's data</div>
                        )}
                        {lastSync && <div style={{ alignSelf: 'flex-end', fontSize: '10px', color: 'var(--theme-text-dim)', marginBottom: '2px' }}>Last sync {lastSync}</div>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: isActiveSource ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontWeight: isActiveSource ? '700' : '400' }}>
                          {isActiveSource ? '✓ Using as TDEE' : 'Use as TDEE'}
                        </span>
                        <button
                          onClick={() => handleUseTrackerTDEE(!isActiveSource, provider)}
                          disabled={!s.last_calories_burned}
                          style={{
                            width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: s.last_calories_burned ? 'pointer' : 'not-allowed',
                            background: isActiveSource ? 'var(--theme-accent)' : 'var(--theme-border)',
                            position: 'relative', transition: 'background 0.2s', opacity: s.last_calories_burned ? 1 : 0.5,
                          }}
                          title={s.last_calories_burned ? 'Toggle tracker TDEE' : 'Sync first to enable'}
                        >
                          <span style={{
                            position: 'absolute', top: '3px', left: isActiveSource ? '23px' : '3px',
                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          }} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Apple Watch note */}
            <div style={{ padding: '12px 16px', background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>🍎</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--theme-text)' }}>Apple Watch / HealthKit</div>
                <div style={{ fontSize: '12px', color: 'var(--theme-text-dim)', lineHeight: '1.5', marginTop: '3px' }}>
                  HealthKit is iOS-native only and cannot be accessed from a web browser. Apple Watch support is coming in a future native app. In the meantime, Apple Watch users can export daily burn via the Health app → share to Google Fit → then connect Google Fit above.
                </div>
              </div>
            </div>
          </div>

          {/* TDEE source indicator */}
          {useTrackerTDEE && goals.trackerTDEE && (
            <div style={{ marginTop: 'var(--space-md)', padding: '10px 14px', background: 'var(--theme-success-dim)', border: '1px solid var(--theme-success)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--theme-success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Watch size={14} />
              TDEE sourced from {goals.trackerSource === 'fitbit' ? 'Fitbit' : 'Google Fit'}: <strong>{goals.trackerTDEE.toLocaleString()} kcal/day</strong>
            </div>
          )}
        </div>

        {/* 5. Macro Split & Water Goal */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}><PieChart size={18} color="var(--theme-accent, #B197FC)" /> Macro Split & Daily Fluids</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>

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
                  <input type="range" min="0" max="100" value={macroP} disabled className="custom-range" style={{ '--thumb-color': 'var(--theme-error)', background: `linear-gradient(to right, var(--theme-error) ${macroP}%, rgba(255,255,255,0.1) ${macroP}%)`, opacity: 0.6 } as React.CSSProperties} />
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
                      const c = Number(e.target.value);
                      setMacroC(c);
                      setMacroF(100 - macroP - c);
                  }} className="custom-range" style={{ '--thumb-color': 'var(--theme-accent)', background: `linear-gradient(to right, var(--theme-accent) ${100 - macroP > 0 ? (macroC / (100 - macroP)) * 100 : 0}%, rgba(255,255,255,0.1) ${100 - macroP > 0 ? (macroC / (100 - macroP)) * 100 : 0}%)` } as React.CSSProperties} />
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
                      const f = Number(e.target.value);
                      setMacroF(f);
                      setMacroC(100 - macroP - f);
                  }} className="custom-range" style={{ '--thumb-color': 'var(--theme-warning)', background: `linear-gradient(to right, var(--theme-warning) ${100 - macroP > 0 ? (macroF / (100 - macroP)) * 100 : 0}%, rgba(255,255,255,0.1) ${100 - macroP > 0 ? (macroF / (100 - macroP)) * 100 : 0}%)` } as React.CSSProperties} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: (macroP + macroC + macroF) === 100 ? 'var(--theme-success)' : 'var(--theme-error)', fontWeight: 'bold' }}>
                  Total: {macroP + macroC + macroF}%
                </span>
                <button onClick={handleSaveMacrosAndWater} className="btn" style={{ padding: '8px 16px', marginTop: '0', background: 'var(--theme-accent)', color: '#000000' }} disabled={(macroP + macroC + macroF) !== 100}>
                  <Check size={14} /> Apply Macros
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--theme-accent)' }}><Droplet size={18} /> Daily Water Goal</div>
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexDirection: 'column' }}>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <label className="lbl">Target ({waterUnit})</label>
                  <input type="number" className="inp" value={displayWaterGoal} onChange={e => setDisplayWaterGoal(Number(e.target.value))} />
                  <input type="range" min="0" max={waterSliderMax} step={waterSliderStep} value={displayWaterGoal} onChange={e => setDisplayWaterGoal(Number(e.target.value))} className="custom-range" style={{ '--thumb-color': 'var(--theme-accent)', background: `linear-gradient(to right, var(--theme-accent) ${Math.min(100, (displayWaterGoal / waterSliderMax) * 100)}%, rgba(255,255,255,0.1) ${Math.min(100, (displayWaterGoal / waterSliderMax) * 100)}%)` } as React.CSSProperties} />
                </div>
                <div style={{ flex: 1 }}>
                  <button onClick={handleSaveWaterOnly} className="btn" style={{ width: '100%', marginTop: '0', background: 'var(--theme-accent)', color: '#000000' }}>
                    <Check size={14} /> Apply Water
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '4px' }}>
                {isMetric
                  ? `Standard recommendation is half your bodyweight in oz (~${Math.round((Number(weightLb) * 2.20462 / 2) * OZ_TO_ML)} mL).`
                  : `Standard recommendation is half your bodyweight in oz (e.g. ${Math.round(Number(weightLb) / 2)} oz).`}
              </div>
            </div>

          </div>
        </div>


        {/* 7. Micro Nutrients Targets */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)' }}>
          <div
            onClick={() => setIsMicrosOpen(!isMicrosOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)', cursor: 'pointer', marginBottom: isMicrosOpen ? 'var(--space-lg)' : '0' }}
          >
            <Leaf size={18} color="var(--theme-success, #51CF66)" />
            Micronutrient Goals
            <ChevronDown size={18} color="var(--theme-text-dim)" style={{ marginLeft: 'auto', transform: isMicrosOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
          </div>
          {isMicrosOpen && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
             <div style={{ fontSize: '13px', color: 'var(--theme-text-dim)' }}>Based on your stats and activity level, here are your daily targets:</div>
             <button
               onClick={() => updateGoals({ customMicros: {} })}
               style={{ background: 'var(--theme-error-dim)', border: 'none', color: 'var(--theme-error)', fontSize: '11px', fontWeight: '700', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
               RESET ALL TO DEFAULTS
             </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {MICRO_CATEGORIES.map((cat: { cat: string; keys: Array<{k: string; u: string; exercise_sensitive?: boolean; rda_m: number; rda_f: number}> }, i: number) => (
              <div key={i}>
                <div style={{ fontWeight: '800', fontSize: '11px', color: 'var(--theme-accent)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.08em' }}>{cat.cat}</div>
                {cat.keys.map((nutrient: { k: string; u: string; exercise_sensitive?: boolean; rda_m: number; rda_f: number }) => {
                  const isEnhanced = nutrient.exercise_sensitive && computed.computedMicros[nutrient.k] > (sex === 'f' || sex === 'female' ? nutrient.rda_f : nutrient.rda_m);
                  return (
                    <div key={nutrient.k} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: '1px solid var(--theme-border)' }}>
                      <div
                        className="micro-badge-btn"
                        style={{ color: 'var(--theme-text-on-panel)', background: 'var(--theme-panel)', flexShrink: 0 }}
                      >
                        {nutrient.k}
                        {isEnhanced && <Flame size={11} color="var(--theme-error)" />}
                      </div>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
                            <button onClick={() => saveCustomMicro(nutrient.k)} className="btn" style={{ margin: 0, padding: '4px 8px', background: 'var(--theme-accent)', color: '#000000' }}><Check size={14} /></button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontWeight: '700',
                              cursor: 'pointer',
                              background: 'var(--theme-panel-dim)',
                              border: '1px solid var(--theme-border)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              color: 'var(--theme-text)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => {
                              setEditingMicro(nutrient.k);
                              setCustomMicroValue(String(computed.computedMicros[nutrient.k]));
                            }}
                            title="Click to override target"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--theme-accent-dim)';
                              e.currentTarget.style.borderColor = 'var(--theme-accent)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--theme-panel-dim)';
                              e.currentTarget.style.borderColor = 'var(--theme-border)';
                            }}
                          >
                            {(computed.computedMicros as Record<string, number>)[nutrient.k]} {nutrient.u}
                            <Edit2 size={10} color="var(--theme-text-dim)" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          </>}
        </div>

      </div>

      <style>{`
        .card { background: var(--theme-panel, rgba(255,255,255,0.02)); border: 1px solid var(--theme-border, rgba(255,255,255,0.05)); border-radius: 20px; padding: 24px; }
        .card-header { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin-bottom: 20px; color: var(--theme-text); }
        .lbl { font-size: 12px; color: var(--theme-text-dim, #8b8b9b); margin-bottom: 6px; display: block; font-weight: 500; }
        .inp { width: 100%; box-sizing: border-box; background: var(--theme-input-bg, rgba(0,0,0,0.4)); border: 1px solid var(--theme-border, rgba(255,255,255,0.1)); padding: 10px 14px; border-radius: 10px; color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; outline: none; transition: border-color 0.2s; font-family: inherit; }
        .inp:focus { border-color: var(--theme-accent, #00C9FF); }
        .btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--theme-panel-dim, rgba(255,255,255,0.1)); color: var(--theme-text); border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 8px; font-family: inherit; }
        .btn:hover:not(:disabled) { background: var(--theme-panel, rgba(255,255,255,0.2)); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .custom-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          transition: background 0.2s;
        }
        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--thumb-color, #FFF);
          cursor: pointer;
          box-shadow: 0 0 5px rgba(0,0,0,0.5);
          border: 2px solid var(--theme-bg);
        }

        /* Light Theme Overrides for Weight Goal section */
        .theme-light-surface .weight-goal-card .card-header {
          color: var(--theme-text) !important;
        }
        .theme-light-surface .weight-goal-card .lbl {
          color: var(--theme-text-dim) !important;
        }

        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      {toastMsg && <Toast message={toastMsg} type="error" onClose={() => setToastMsg('')} />}
    </div>
  );
};

export default ProgressView;

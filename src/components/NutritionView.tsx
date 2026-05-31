import React, { useMemo, useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { sumFoods, getCarbClassification } from '../lib/food/serving-converter';
import { computeGoals } from '../lib/goals/compute';
import { MICRO_CATEGORIES } from '../lib/constants';
import { DEFICIENCY_INFO, NUTRIENT_BENEFITS } from '../lib/nutrient-info';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Info, Sparkles } from 'lucide-react';
import type { Food } from '../types/food';

ChartJS.register(ArcElement, Tooltip, Legend);

const getNutrientProgress = (val: number, goal: number, label: string) => {
  const actualPct = goal ? (val / goal) * 100 : 0;
  const pct = Math.min(100, actualPct);
  const lowerLabel = label.toLowerCase();
  
  // Identify upper-limit nutrients
  const isUpperLimit = 
    lowerLabel.includes('sodium') || 
    lowerLabel.includes('sugar') || 
    lowerLabel.includes('saturated') || 
    lowerLabel.includes('trans') || 
    lowerLabel.includes('cholesterol') || 
    lowerLabel.includes('refined carbs') || 
    lowerLabel.includes('simple carbs');
  
  let color = 'var(--theme-accent)';
  if (val > 0) {
    if (isUpperLimit) {
      if (pct >= 100) color = 'var(--theme-error, #FF3E4E)'; // Red (excess)
      else if (pct >= 80) color = '#FF9F1C'; // Orange (approaching warning)
      else color = 'var(--theme-success, #92FE9D)'; // Green (safe / under limit)
    } else {
      if (pct >= 100) color = 'var(--theme-success, #92FE9D)'; // Green (completed)
      else if (pct >= 75) color = '#FFD700'; // Bright Gold
      else if (pct >= 25) color = '#FF6F00'; // Standard Theme Orange
      else color = '#A75D00'; // Muted Orange
    }
  } else {
    color = 'transparent';
  }
  
  return { pct, actualPct, color, isUpperLimit };
};

export const NutritionView: React.FC = () => {
  const { localCache, currentDate } = useDiary();

  const goals = useMemo(() => localCache.goals || {}, [localCache.goals]);
  const computed = useMemo(() => computeGoals(goals), [goals]);
  const totals = useMemo(() => {
    const dayData = localCache[currentDate] || {};
    const foodLog = dayData.foodLog || [];
    return sumFoods(foodLog.map((l: { f: Food }) => l.f));
  }, [localCache, currentDate]);

  const carbBreakdown = useMemo(() => {
    const dayData = localCache[currentDate] || {};
    const foodLog = dayData.foodLog || [];
    const breakdown = {
      'simple-carbs': 0,
      'refined-carbs': 0,
      'steady-starches': 0,
      'sustained-energy': 0,
      'natural-carbs': 0,
      'hybrid-bites': 0,
    };
    
    foodLog.forEach((l: { f: Food }) => {
      const f = l.f;
      if (!f) return;
      
      // Determine the scaled carb amount from today's logged portions
      const carbs = Number(f.c != null ? f.c : (f.carbs != null ? f.carbs : 0)) || 0;
      if (carbs <= 0) return;
      
      const classification = getCarbClassification(f);
      if (classification.key !== 'none') {
        breakdown[classification.key as keyof typeof breakdown] += carbs;
      }
    });
    
    return breakdown;
  }, [localCache, currentDate]);

  const [expandedMicro, setExpandedMicro] = useState<string | null>(null);

  const resolvedColors = useMemo(() => {
    void localCache.theme;
    if (typeof window === 'undefined') return { protein: '#ff4b4b', carbs: '#00c9ff', fat: '#fcc419' };
    const style = getComputedStyle(document.documentElement);
    return {
      protein: style.getPropertyValue('--theme-error').trim() || '#ff4b4b',
      carbs: style.getPropertyValue('--theme-accent').trim() || '#00c9ff',
      fat: style.getPropertyValue('--theme-warning').trim() || '#fcc419'
    };
  }, [localCache.theme]);

  const macroData = useMemo(() => {
    const isEmpty = totals.protein === 0 && totals.carbs === 0 && totals.fat === 0;
    
    if (isEmpty) {
      const rootStyle = getComputedStyle(document.documentElement);
      const placeholderColor = rootStyle.getPropertyValue('--theme-panel-dim').trim() || 'rgba(0,0,0,0.1)';
      return {
        labels: ['Empty'],
        datasets: [{
          data: [1],
          backgroundColor: [placeholderColor],
          borderWidth: 0
        }]
      };
    }

    return {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [{
        data: [totals.protein, totals.carbs, totals.fat],
        backgroundColor: [resolvedColors.protein, resolvedColors.carbs, resolvedColors.fat],
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  }, [totals, resolvedColors]);

  const macroOptions = {
    cutout: '80%',
    plugins: { legend: { display: false } },
    maintainAspectRatio: false
  };


  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Friendly Guide Bubble */}
      <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
        <div style={{ background: 'var(--theme-panel-dim)', padding: '10px', borderRadius: '14px', color: 'var(--theme-accent)', border: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--theme-text-on-panel)' }}>
            Fuel & Vitality Guide
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--theme-text-dim-on-panel)', margin: 0, lineHeight: '1.6', fontWeight: '500' }}>
            Welcome to your body's dashboard! This tab translates the food you log into the exact energy (Calories), building blocks (Protein, Carbs, Fats), and vitamins powering your health. Think of it as a blueprint showing exactly how your meals are fueling your goals.
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: 'var(--space-lg)', color: 'var(--theme-text-on-panel)' }}>Macronutrients</h2>

        <div style={{
          display: 'flex',
          flexDirection: typeof window !== 'undefined' && window.innerWidth < 1000 ? 'column' : 'row',
          alignItems: 'center',
          gap: 'var(--space-xl)',
          width: '100%'
        }}>
          <div style={{ width: '140px', height: '140px', position: 'relative' }}>
            <Doughnut data={macroData} options={macroOptions} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--theme-text-on-panel)' }}>{Math.round(totals.calories)}</span>
              <span style={{ fontSize: '10px', color: 'var(--theme-text-dim-on-panel)' }}>kcal</span>
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {['Protein', 'Carbs', 'Fat'].map((label, idx) => {
              const val = [totals.protein, totals.carbs, totals.fat][idx];
              const goal = [computed.proteinG, computed.carbG, computed.fatG][idx] || 1;
              const color = ['var(--theme-error)', 'var(--theme-accent)', 'var(--theme-warning)'][idx];
              const pct = Math.min(100, (val / goal) * 100);

              return (
                <div key={label}>
                  <div
                    onClick={() => label === 'Protein' && setExpandedMicro(expandedMicro === 'Protein' ? null : 'Protein')}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', cursor: label === 'Protein' ? 'pointer' : 'default' }}
                  >
                    <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--theme-text-on-panel)' }}>
                      {label} {label === 'Protein' && <Info size={10} color="color-mix(in srgb, var(--theme-text) 40%, black)" />}
                    </span>
                    <span style={{ color: 'var(--theme-text-dim-on-panel)', fontWeight: '800' }}>{Math.round(val)} <span style={{ fontSize: '10px' }}>/ {Math.round(goal)}g</span></span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--theme-panel-dim)', borderRadius: '2px', margin: '4px 0 8px 0', border: '1px solid var(--theme-border)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px' }} />
                  </div>

                  {label === 'Protein' && expandedMicro === 'Protein' && (
                    <div className="glass-card" style={{ background: 'rgba(0, 0, 0, 0.85)', marginTop: 'var(--space-md)', padding: 'var(--space-md)', borderLeft: '3px solid var(--theme-error)', marginBottom: 'var(--space-sm)' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontWeight: '900', color: 'color-mix(in srgb, var(--theme-success), white 70%)', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          ✨ Performance Benefits
                        </div>
                        <div style={{ lineHeight: '1.5', color: '#FFFFFF' }}>{(NUTRIENT_BENEFITS as Record<string, { summary?: string, points?: string[] }>).Protein?.summary || 'The building block of all human tissue.'}</div>
                        {(NUTRIENT_BENEFITS as Record<string, { summary?: string, points?: string[] }>).Protein?.points && (
                          <ul style={{ paddingLeft: '18px', margin: '8px 0 0 0', color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {(NUTRIENT_BENEFITS as Record<string, { summary?: string, points?: string[] }>).Protein.points!.map((p: string, i: number) => <li key={i}>{p}</li>)}
                          </ul>
                        )}
                      </div>
                      {(DEFICIENCY_INFO as Record<string, { desc?: string }>).Protein && (
                        <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: '12px' }}>
                          <div style={{ fontWeight: '900', color: 'color-mix(in srgb, var(--theme-warning), white 70%)', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            ⚠️ Deficiency Risks
                          </div>
                          <div style={{ lineHeight: '1.5', color: '#FFFFFF', fontWeight: '600' }}>{(DEFICIENCY_INFO as Record<string, { desc?: string }>).Protein.desc}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {label === 'Fat' && (
                    <div style={{ paddingLeft: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', borderLeft: '2px solid var(--theme-border)', marginBottom: 'var(--space-sm)' }}>
                      {[
                        { k: 'Saturated', v: totals.sat || 0, g: goal * 0.3, c: 'var(--theme-error)' },
                        { k: 'Monounsaturated', v: totals.mono || 0, g: goal * 0.4, c: 'var(--theme-success)' },
                        { k: 'Polyunsaturated', v: totals.poly || 0, g: goal * 0.3, c: 'var(--theme-accent)' },
                        { k: 'Trans (Avoid)', v: totals.trans || 0, g: 1, c: 'var(--theme-error)' }
                      ].map(sub => {
                        const isExpanded = expandedMicro === sub.k;
                        const info = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO] || NUTRIENT_BENEFITS[sub.k as keyof typeof NUTRIENT_BENEFITS];
                        const defInfo = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO];
                        const { pct, actualPct, color: barColor } = getNutrientProgress(sub.v, sub.g || 0, sub.k);
                        return (
                          <div key={sub.k} className={isExpanded ? "glass-card" : ""} style={{ padding: isExpanded ? 'var(--space-md)' : '0', transition: 'all var(--transition-smooth)', margin: isExpanded ? '0 -16px var(--space-xs)' : '0' }}>
                            <div onClick={() => info && setExpandedMicro(isExpanded ? null : sub.k)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', cursor: info ? 'pointer' : 'default' }}>
                              <span style={{ color: 'var(--theme-text-dim-on-panel)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sub.k} {info && <Info size={10} color="color-mix(in srgb, var(--theme-text) 40%, black)" />}</span>
                              <span style={{ color: 'var(--theme-text-dim-on-panel)', fontWeight: '900', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {Math.round(sub.v * 10) / 10}g
                                {sub.v > 0 && (
                                  <span style={{ fontSize: '9px', fontWeight: '800', opacity: 0.85, color: barColor }}>
                                    ({Math.round(actualPct)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--theme-panel-dim)', borderRadius: '2px', marginTop: '4px', border: '1px solid var(--theme-border)', position: 'relative' }}>
                              <div style={{ 
                                width: `${pct}%`, 
                                height: '100%', 
                                background: barColor, 
                                borderRadius: '2px',
                                boxShadow: pct >= 100 ? `0 0 10px ${barColor}` : 'none',
                                transition: 'width var(--transition-smooth), background-color 0.3s ease'
                              }} />
                            </div>

                            {isExpanded && info && (
                              <div className="glass" style={{ background: 'rgba(0, 0, 0, 0.85)', marginTop: 'var(--space-md)', padding: 'var(--space-md)', borderLeft: `2px solid ${sub.c}`, marginBottom: 'var(--space-sm)' }}>

                                {/* Benefits Section */}
                                <div style={{ marginBottom: '16px' }}>
                                  <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-success), white 70%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ✨ Metabolic Benefits
                                  </div>
                                  <div style={{ lineHeight: '1.5', color: '#FFFFFF' }}>{(info as { summary?: string }).summary || 'Essential profile for balanced nutrition.'}</div>
                                </div>

                                {/* Deficiency Section */}
                                {defInfo && (
                                  <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                                    <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-warning), white 70%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      ⚠️ Deficiency Risks
                                    </div>
                                    <div style={{ lineHeight: '1.5', color: '#FFFFFF' }}>{defInfo.desc}</div>
                                    {defInfo.sources && (
                                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#FFFFFF', fontStyle: 'italic' }}>
                                        Best Sources: {defInfo.sources}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        )
                      })}
                    </div>
                  )}

                  {label === 'Carbs' && (
                    <div style={{ paddingLeft: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', borderLeft: '2px solid var(--theme-border)', marginBottom: 'var(--space-sm)' }}>
                      {[
                        { k: 'Sustained Energy', disp: '🌾 Sustained Energy', v: carbBreakdown['sustained-energy'], g: goal * 0.4, c: 'var(--theme-success)' },
                        { k: 'Natural Carbs', disp: '🍇 Natural Carbs', v: carbBreakdown['natural-carbs'], g: goal * 0.25, c: 'var(--theme-accent)' },
                        { k: 'Steady Starches', disp: '🌾 Steady Starches', v: carbBreakdown['steady-starches'], g: goal * 0.2, c: 'var(--theme-accent)' },
                        { k: 'Hybrid Bites', disp: '🍩 Hybrid Bites', v: carbBreakdown['hybrid-bites'], g: goal * 0.1, c: 'var(--theme-warning)' },
                        { k: 'Refined Carbs', disp: '🍞 Refined Carbs', v: carbBreakdown['refined-carbs'], g: goal * 0.05, c: 'var(--theme-error)' },
                        { k: 'Simple Carbs', disp: '🍭 Simple Carbs', v: carbBreakdown['simple-carbs'], g: goal * 0.05, c: 'var(--theme-error)' }
                      ].map(sub => {
                        const { pct, actualPct, color: barColor } = getNutrientProgress(sub.v, sub.g || 0, sub.k);
                        const isExpanded = expandedMicro === sub.k;
                        const info = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO] || NUTRIENT_BENEFITS[sub.k as keyof typeof NUTRIENT_BENEFITS];
                        const defInfo = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO];
                        return (
                          <div key={sub.k} className={isExpanded ? "glass-card" : ""} style={{ padding: isExpanded ? 'var(--space-md)' : '0', transition: 'all var(--transition-smooth)', margin: isExpanded ? '0 -16px var(--space-xs)' : '0' }}>
                            <div onClick={() => info && setExpandedMicro(isExpanded ? null : sub.k)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', cursor: info ? 'pointer' : 'default' }}>
                              <span style={{ color: 'var(--theme-text-dim-on-panel)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sub.disp} {info && <Info size={10} color="color-mix(in srgb, var(--theme-text) 40%, black)" />}</span>
                              <span style={{ color: 'var(--theme-text-dim-on-panel)', fontWeight: '900', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {Math.round(sub.v * 10) / 10}g
                                {sub.v > 0 && (
                                  <span style={{ fontSize: '9px', fontWeight: '800', opacity: 0.85, color: barColor }}>
                                    ({Math.round(actualPct)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--theme-panel-dim)', borderRadius: '2px', marginTop: '4px', border: '1px solid var(--theme-border)', position: 'relative' }}>
                              <div style={{ 
                                width: `${pct}%`, 
                                height: '100%', 
                                background: barColor, 
                                borderRadius: '2px',
                                boxShadow: pct >= 100 ? `0 0 10px ${barColor}` : 'none',
                                transition: 'width var(--transition-smooth), background-color 0.3s ease'
                              }} />
                            </div>

                            {isExpanded && info && (
                              <div className="glass" style={{ background: 'rgba(0, 0, 0, 0.85)', marginTop: 'var(--space-md)', padding: 'var(--space-md)', borderLeft: `2px solid ${sub.c}`, marginBottom: 'var(--space-sm)' }}>

                                {/* Benefits Section */}
                                <div style={{ marginBottom: '16px' }}>
                                  <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-success), white 70%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ✨ Performance Benefits
                                  </div>
                                  <div style={{ lineHeight: '1.5', color: '#FFFFFF' }}>{(info as { summary?: string }).summary || 'Vital fuel source for metabolic energy.'}</div>
                                </div>

                                {/* Deficiency Section */}
                                {defInfo && (
                                  <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                                    <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-warning), white 70%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      ⚠️ Deficiency Risks
                                    </div>
                                    <div style={{ lineHeight: '1.5', color: '#FFFFFF' }}>{defInfo.desc}</div>
                                    {defInfo.sources && (
                                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#FFFFFF', fontStyle: 'italic' }}>
                                        Best Sources: {defInfo.sources}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sodium-Potassium Ratio Balance Card */}
      <div className="card" style={{ 
        padding: 'var(--space-xl)',
        background: 'linear-gradient(135deg, var(--theme-panel, #10141f) 0%, rgba(10, 15, 30, 0.95) 100%)',
        border: '1px solid var(--theme-border, rgba(255,255,255,0.1))',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        {/* Subtle decorative glowing background blur */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(0, 201, 255, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '20px' }}>🧂</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--theme-text-on-panel)' }}>
            Cardiovascular Ratio (Sodium : Potassium)
          </h2>
        </div>

        {/* Current status row */}
        {(() => {
          const sodiumVal = Math.round(totals.Sodium || totals.sodium || 0);
          const potassiumVal = Math.round(totals.Potassium || totals.potassium || 0);
          const ratioNum = potassiumVal > 0 ? (sodiumVal / potassiumVal) : 0;
          
          let statusText = 'Excellent';
          let statusColor = 'var(--theme-success, #92FE9D)';
          let adviceText = 'Your Sodium and Potassium intake are beautifully balanced. This 1:1 ratio is ideal for maintaining optimal blood pressure and arterial elasticity!';
          
          if (sodiumVal === 0 && potassiumVal === 0) {
            statusText = 'No Logs Yet';
            statusColor = 'var(--theme-text-dim)';
            adviceText = 'Log foods to see your cardiovascular balance card calculate in real-time.';
          } else if (ratioNum > 1.5) {
            statusText = 'Sodium Heavy';
            statusColor = '#FF9F1C'; // Warm Orange
            adviceText = 'Sodium levels are elevated compared to Potassium. Increasing Potassium-rich foods (e.g. spinach, avocado, banana) helps buffer and counteract the hypertensive strain of sodium.';
          } else if (ratioNum > 1.1) {
            statusText = 'Moderate Balance';
            statusColor = 'var(--theme-accent)'; // Cyan
            adviceText = 'Aim to increase Potassium slightly or moderate Sodium to nudge closer to a heart-healthy 1:1 ratio.';
          } else if (ratioNum < 0.6) {
            statusText = 'Potassium Dominant';
            statusColor = 'var(--theme-success, #92FE9D)';
            adviceText = 'Highly cardiovasculary protective. High Potassium intakes active the body\'s natural defenses against high blood pressure.';
          }

          // Calculate visual balance bar percentage
          const totalMin = sodiumVal + potassiumVal || 1;
          const sodiumPct = (sodiumVal / totalMin) * 100;
          const potassiumPct = (potassiumVal / totalMin) * 100;

          return (
            <div>
              {/* Main numbers row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Sodium (Na)</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: sodiumVal > 2300 ? '#FF6B6B' : 'var(--theme-text-on-panel)' }}>
                    {sodiumVal}<span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.8 }}> mg</span>
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--theme-text-dim)', marginTop: '4px' }}>Target: &lt; 2,300mg</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Potassium (K)</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--theme-success, #92FE9D)' }}>
                    {potassiumVal}<span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.8 }}> mg</span>
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--theme-text-dim)', marginTop: '4px' }}>Target: ~ 3,400mg</div>
                </div>
              </div>

              {/* Visual Balance Bar */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '800', color: 'var(--theme-text-dim)', marginBottom: '8px' }}>
                  <span>SODIUM ({Math.round(sodiumPct)}%)</span>
                  <span style={{ color: statusColor, textTransform: 'uppercase' }}>{statusText} ({ratioNum > 0 ? `${ratioNum.toFixed(1)}:1` : '1:1 Target'})</span>
                  <span>POTASSIUM ({Math.round(potassiumPct)}%)</span>
                </div>
                
                {/* Horizontal segmented progress bar */}
                <div style={{ height: '8px', width: '100%', background: 'var(--theme-panel-dim)', borderRadius: '4px', display: 'flex', overflow: 'hidden', border: '1px solid var(--theme-border)' }}>
                  {sodiumVal === 0 && potassiumVal === 0 ? (
                    <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
                  ) : (
                    <>
                      <div style={{ width: `${sodiumPct}%`, height: '100%', background: 'linear-gradient(90deg, #FF6B6B, #FCC419)', transition: 'width 0.5s ease' }} />
                      <div style={{ width: `${potassiumPct}%`, height: '100%', background: 'linear-gradient(90deg, #92FE9D, #00C9FF)', transition: 'width 0.5s ease' }} />
                    </>
                  )}
                </div>
              </div>

              {/* Explanatory Coping Card */}
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                padding: '16px', 
                borderRadius: '16px', 
                border: '1px solid var(--theme-border)',
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Sparkles size={14} color="var(--theme-accent)" /> 
                  Why the Ratio Matters
                </div>
                <p style={{ fontSize: '12px', color: 'var(--theme-text-dim-on-panel)', margin: 0 }}>
                  {adviceText} <strong style={{ color: '#fff' }}>Potassium acts as a natural vascular buffer:</strong> it relaxes blood vessel walls and prompts your kidneys to excrete sodium, mitigating high blood pressure risks even on higher-sodium days.
                </p>
              </div>

              {/* Clinical/Medical Disclaimer */}
              <div style={{ 
                fontSize: '10px', 
                color: 'rgba(255, 107, 107, 0.85)', 
                fontStyle: 'italic', 
                lineHeight: '1.4', 
                background: 'rgba(255, 107, 107, 0.05)', 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1px solid rgba(255, 107, 107, 0.15)' 
              }}>
                <strong>⚠️ Clinical Disclaimer:</strong> This cardiovascular balance ratio is provided purely for educational tracking and wellness insights. This is not medical or professional doctor's advice. If you are managing hypertension, cardiovascular conditions, or chronic kidney disease, always consult a licensed medical physician or cardiologist for clinical guidance.
              </div>
            </div>
          );
        })()}
      </div>

      {/* Micronutrients */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: 'var(--space-lg)', color: 'var(--theme-text-on-panel)' }}>Micronutrients</h2>
        <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
          {MICRO_CATEGORIES.map((cat: { cat: string; keys: { k: string; u: string }[] }) => (
            <div key={cat.cat}>
              <h3 style={{ fontSize: '12px', color: 'var(--theme-accent)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>{cat.cat}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cat.keys.map((nutrient: { k: string; u: string }) => {
                  const label = nutrient.k;
                  const unit = nutrient.u;
                  const val = totals[label.toLowerCase()] || totals[label] || 0;
                  const goal = computed.computedMicros?.[label] || (computed.micros ? computed.micros[label] : 0);
                  const { pct, actualPct, color: barColor } = getNutrientProgress(val, goal || 0, label);
                  const isExpanded = expandedMicro === label;
                  const benefitsInfo = NUTRIENT_BENEFITS[label as keyof typeof NUTRIENT_BENEFITS];
                  const defInfo = DEFICIENCY_INFO[label as keyof typeof DEFICIENCY_INFO];
                  const info = benefitsInfo || defInfo;

                  return (
                    <div key={label} className={isExpanded ? "glass-card" : ""} style={{ padding: isExpanded ? 'var(--space-sm) var(--space-md)' : '0 var(--space-xs)', transition: 'all var(--transition-smooth)', margin: isExpanded ? '0 -4px var(--space-xs)' : '0' }}>
                      <div
                        onClick={() => info && setExpandedMicro(isExpanded ? null : label)}
                        style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr 95px', gap: '16px', alignItems: 'center', cursor: info ? 'pointer' : 'default' }}
                      >
                        <div style={{
                          fontSize: '10px',
                          fontWeight: '900',
                          color: isExpanded ? 'var(--theme-accent)' : 'var(--theme-text-on-panel)',
                          background: 'var(--theme-panel)',
                          padding: '6px 14px',
                          borderRadius: '24px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          border: '1px solid var(--theme-border)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                          {label} {info && <Info size={10} color="color-mix(in srgb, var(--theme-text) 40%, black)" />}
                        </div>
                        <div style={{ height: '6px', background: 'var(--theme-panel-dim)', borderRadius: '4px', position: 'relative', border: '1px solid var(--theme-border)' }}>
                          <div style={{ 
                            width: `${pct}%`, 
                            height: '100%', 
                            background: barColor, 
                            borderRadius: '4px', 
                            boxShadow: pct >= 100 ? `0 0 12px ${barColor}` : 'none',
                            transition: 'width var(--transition-smooth), background-color 0.3s ease'
                          }} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '900', textAlign: 'right', color: pct >= 100 ? 'var(--theme-success)' : 'var(--theme-text-on-panel)', whiteSpace: 'nowrap' }}>
                          {Math.round(val)}<span style={{ fontSize: '10px', opacity: 0.8, marginRight: '4px' }}>{unit}</span>
                          <span style={{ fontSize: '11px', fontWeight: '800', opacity: 0.85, color: val > 0 ? barColor : 'var(--theme-text-dim)' }}>
                            ({Math.round(actualPct)}%)
                          </span>
                        </div>
                      </div>

                      {isExpanded && info && (
                        <div className="glass" style={{ background: 'rgba(0, 0, 0, 0.85)', marginTop: 'var(--space-md)', padding: 'var(--space-md)', borderLeft: '2px solid var(--theme-accent, #00C9FF)', marginBottom: 'var(--space-sm)' }}>

                          {/* Benefits Section */}
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: '800', color: '#FFFFFF', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ✨ Clinical Benefits
                            </div>
                            <div style={{ marginBottom: '10px', lineHeight: '1.5', color: '#FFFFFF' }}>{benefitsInfo?.summary || 'Vital biological support for systemic homeostatis.'}</div>
                            {benefitsInfo?.points && (
                              <ul style={{ paddingLeft: '18px', margin: '0', color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {benefitsInfo.points.map((p: string, i: number) => <li key={i}>{p}</li>)}
                              </ul>
                            )}
                          </div>

                          {/* Deficiency Section */}
                          {defInfo && (
                            <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                              <div style={{ fontWeight: '800', color: '#FFFFFF', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ⚠️ Deficiency Risks
                              </div>
                              <div style={{ lineHeight: '1.5', color: '#FFFFFF' }}>{defInfo.desc}</div>
                              {defInfo.sources && (
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#FFFFFF', fontStyle: 'italic' }}>
                                  Best Sources: {defInfo.sources}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

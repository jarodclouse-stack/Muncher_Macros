import React, { useMemo, useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { sumFoods } from '../lib/food/serving-converter';
import { computeGoals } from '../lib/goals/compute';
import { MICRO_CATEGORIES } from '../lib/constants';
import { DEFICIENCY_INFO, NUTRIENT_BENEFITS } from '../lib/nutrient-info';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Info } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export const NutritionView: React.FC = () => {
  const { localCache, currentDate } = useDiary();
  
  const goals = useMemo(() => localCache.goals || {}, [localCache.goals]);
  const computed = useMemo(() => computeGoals(goals), [goals]);
  const totals = useMemo(() => {
    const dayData = localCache[currentDate] || {};
    const foodLog = dayData.foodLog || [];
    return sumFoods(foodLog.map((l: any) => l.f));
  }, [localCache, currentDate]);

  const [expandedMicro, setExpandedMicro] = useState<string | null>(null);

  const resolvedColors = useMemo(() => {
    if (typeof window === 'undefined') return { protein: '#ff4b4b', carbs: '#00c9ff', fat: '#fcc419' };
    const style = getComputedStyle(document.documentElement);
    return {
      protein: style.getPropertyValue('--theme-error').trim() || '#ff4b4b',
      carbs: style.getPropertyValue('--theme-accent').trim() || '#00c9ff',
      fat: style.getPropertyValue('--theme-warning').trim() || '#fcc419'
    };
  }, [localCache.theme]);

  const macroData = useMemo(() => ({
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [totals.protein, totals.carbs, totals.fat],
        backgroundColor: [resolvedColors.protein, resolvedColors.carbs, resolvedColors.fat],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }), [totals, resolvedColors]);

  const macroOptions = {
    cutout: '80%',
    plugins: { legend: { display: false } },
    maintainAspectRatio: false
  };


  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
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
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--theme-text-on-panel)' }}>{totals.calories}</span>
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
                      {label} {label === 'Protein' && <Info size={10} color="var(--theme-text-dim-on-panel)" />}
                    </span>
                    <span style={{ color: 'var(--theme-text-dim-on-panel)', fontWeight: '800' }}>{Math.round(val)} <span style={{ fontSize: '10px' }}>/ {Math.round(goal)}g</span></span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--theme-panel-dim)', borderRadius: '2px', margin: '4px 0 8px 0', border: '1px solid var(--theme-border)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px' }} />
                  </div>
                  
                  {label === 'Protein' && expandedMicro === 'Protein' && (
                    <div className="glass-card" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', borderLeft: '3px solid var(--theme-error)', marginBottom: 'var(--space-sm)' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontWeight: '900', color: 'color-mix(in srgb, var(--theme-success), white 40%)', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          ✨ Performance Benefits
                        </div>
                        <div style={{ lineHeight: '1.5', color: 'color-mix(in srgb, var(--theme-accent), white 50%)' }}>{(NUTRIENT_BENEFITS as any).Protein?.summary || 'The building block of all human tissue.'}</div>
                        {(NUTRIENT_BENEFITS as any).Protein?.points && (
                          <ul style={{ paddingLeft: '18px', margin: '8px 0 0 0', color: 'color-mix(in srgb, var(--theme-accent), white 40%)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {(NUTRIENT_BENEFITS as any).Protein.points.map((p: string, i: number) => <li key={i}>{p}</li>)}
                          </ul>
                        )}
                      </div>
                      {(DEFICIENCY_INFO as any).Protein && (
                        <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: '12px' }}>
                          <div style={{ fontWeight: '900', color: 'color-mix(in srgb, var(--theme-warning), white 40%)', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            ⚠️ Deficiency Risks
                          </div>
                          <div style={{ lineHeight: '1.5', color: 'color-mix(in srgb, var(--theme-accent), white 40%)', fontWeight: '600' }}>{(DEFICIENCY_INFO as any).Protein.desc}</div>
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
                        return (
                        <div key={sub.k} className={isExpanded ? "glass-card" : ""} style={{ padding: isExpanded ? 'var(--space-md)' : '0', transition: 'all var(--transition-smooth)', margin: isExpanded ? '0 -16px var(--space-xs)' : '0' }}>
                          <div onClick={() => info && setExpandedMicro(isExpanded ? null : sub.k)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', cursor: info ? 'pointer' : 'default' }}>
                            <span style={{ color: 'var(--theme-text-dim-on-panel)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sub.k} {info && <Info size={10} color="var(--theme-text-dim-on-panel)" />}</span>
                            <span style={{ color: 'var(--theme-text-dim-on-panel)', fontWeight: '900' }}>{Math.round(sub.v * 10)/10}g</span>
                          </div>
                          <div style={{ height: '3px', background: 'var(--theme-panel)', borderRadius: '2px', marginTop: '4px', border: '1px solid var(--theme-border)' }}>
                            <div style={{ width: `${Math.min(100, (sub.v / sub.g) * 100)}%`, height: '100%', background: sub.c, borderRadius: '2px' }} />
                          </div>

                          {isExpanded && info && (
                            <div className="glass" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', borderLeft: `2px solid ${sub.c}`, marginBottom: 'var(--space-sm)' }}>
                              
                              {/* Benefits Section */}
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-success), white 40%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  ✨ Metabolic Benefits
                                </div>
                                <div style={{ lineHeight: '1.5', color: 'color-mix(in srgb, var(--theme-accent), white 50%)' }}>{(info as any).summary || 'Essential profile for balanced nutrition.'}</div>
                              </div>

                              {/* Deficiency Section */}
                              {defInfo && (
                                <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                                  <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-warning), white 40%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ⚠️ Deficiency Risks
                                  </div>
                                  <div style={{ lineHeight: '1.5', color: 'color-mix(in srgb, var(--theme-accent), white 40%)' }}>{defInfo.desc}</div>
                                  {defInfo.sources && (
                                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'color-mix(in srgb, var(--theme-accent), white 40%)', fontStyle: 'italic' }}>
                                      Best Sources: {defInfo.sources}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )})}
                    </div>
                  )}

                  {label === 'Carbs' && (
                    <div style={{ paddingLeft: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', borderLeft: '2px solid var(--theme-border)', marginBottom: 'var(--space-sm)' }}>
                      {[
                        { k: 'Complex Carbs', v: Math.max(0, totals.carbs - (totals.sugars || 0)), g: goal * 0.9, c: 'var(--theme-accent)' },
                        { k: 'Simple (Sugars)', v: totals.sugars || 0, g: goal * 0.1, c: 'var(--theme-error)' }
                      ].map(sub => {
                        const isExpanded = expandedMicro === sub.k;
                        const info = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO] || NUTRIENT_BENEFITS[sub.k as keyof typeof NUTRIENT_BENEFITS];
                        const defInfo = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO];
                        return (
                        <div key={sub.k} className={isExpanded ? "glass-card" : ""} style={{ padding: isExpanded ? 'var(--space-md)' : '0', transition: 'all var(--transition-smooth)', margin: isExpanded ? '0 -16px var(--space-xs)' : '0' }}>
                          <div onClick={() => info && setExpandedMicro(isExpanded ? null : sub.k)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', cursor: info ? 'pointer' : 'default' }}>
                            <span style={{ color: 'var(--theme-text-dim-on-panel)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sub.k} {info && <Info size={10} color="var(--theme-text-dim-on-panel)" />}</span>
                            <span style={{ color: 'var(--theme-text-dim-on-panel)', fontWeight: '900' }}>{Math.round(sub.v * 10)/10}g</span>
                          </div>
                          <div style={{ height: '3px', background: 'var(--theme-panel)', borderRadius: '2px', marginTop: '4px', border: '1px solid var(--theme-border)' }}>
                            <div style={{ width: `${Math.min(100, (sub.v / sub.g) * 100)}%`, height: '100%', background: sub.c, borderRadius: '2px' }} />
                          </div>

                          {isExpanded && info && (
                            <div className="glass" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', borderLeft: `2px solid ${sub.c}`, marginBottom: 'var(--space-sm)' }}>
                              
                              {/* Benefits Section */}
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-success), white 40%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  ✨ Performance Benefits
                                </div>
                                <div style={{ lineHeight: '1.5', color: 'color-mix(in srgb, var(--theme-accent), white 50%)' }}>{(info as any).summary || 'Vital fuel source for metabolic energy.'}</div>
                              </div>

                              {/* Deficiency Section */}
                              {defInfo && (
                                <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                                  <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-warning), white 40%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ⚠️ Deficiency Risks
                                  </div>
                                  <div style={{ lineHeight: '1.5', color: 'color-mix(in srgb, var(--theme-accent), white 40%)' }}>{defInfo.desc}</div>
                                  {defInfo.sources && (
                                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'color-mix(in srgb, var(--theme-accent), white 40%)', fontStyle: 'italic' }}>
                                      Best Sources: {defInfo.sources}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )})}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Micronutrients */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: 'var(--space-lg)', color: 'var(--theme-text-on-panel)' }}>Micronutrients</h2>
        <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
          {MICRO_CATEGORIES.map((cat: any) => (
            <div key={cat.cat}>
              <h3 style={{ fontSize: '12px', color: 'var(--theme-accent)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>{cat.cat}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cat.keys.map((nutrient: any) => {
                  const label = nutrient.k;
                  const unit = nutrient.u;
                  const val = totals[label.toLowerCase()] || totals[label] || 0;
                  const goal = computed.micros ? computed.micros[label] : computed.computedMicros[label];
                  const pct = goal ? Math.min(100, (val / goal) * 100) : 0;
                  const isExpanded = expandedMicro === label;
                  const benefitsInfo = NUTRIENT_BENEFITS[label as keyof typeof NUTRIENT_BENEFITS];
                  const defInfo = DEFICIENCY_INFO[label as keyof typeof DEFICIENCY_INFO];
                  const info = benefitsInfo || defInfo;
                  
                  return (
                    <div key={label} className={isExpanded ? "glass-card" : ""} style={{ padding: isExpanded ? 'var(--space-sm) var(--space-md)' : '0 var(--space-xs)', transition: 'all var(--transition-smooth)', margin: isExpanded ? '0 -4px var(--space-xs)' : '0' }}>
                      <div 
                        onClick={() => info && setExpandedMicro(isExpanded ? null : label)}
                        style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr 60px', gap: '16px', alignItems: 'center', cursor: info ? 'pointer' : 'default' }}
                      >
                        <div style={{ 
                          fontSize: '11px', 
                          fontWeight: '900', 
                          color: 'var(--theme-text-on-panel)', 
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
                          {label} {info && <Info size={10} color={isExpanded ? 'var(--theme-accent)' : 'var(--theme-text-dim-on-panel)'} />}
                        </div>
                        <div style={{ height: '6px', background: 'var(--theme-panel-dim)', borderRadius: '4px', position: 'relative', border: '1px solid var(--theme-border)' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--theme-accent)', borderRadius: '4px', boxShadow: pct >= 100 ? '0 0 12px var(--theme-accent)' : 'none' }} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '900', textAlign: 'right', color: pct >= 100 ? 'var(--theme-success)' : 'var(--theme-text-on-panel)' }}>{Math.round(val)}<span style={{fontSize:'10px', opacity:0.8}}>{unit}</span></div>
                      </div>
                      
                      {isExpanded && info && (
                        <div className="glass" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', borderLeft: '2px solid var(--theme-accent, #00C9FF)', marginBottom: 'var(--space-sm)' }}>
                          
                          {/* Benefits Section */}
                          <div style={{ marginBottom: '16px' }}>
                             <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-success), white 40%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                               ✨ Clinical Benefits
                             </div>
                             <div style={{ marginBottom: '10px', lineHeight: '1.5', color: 'color-mix(in srgb, var(--theme-accent), white 50%)' }}>{benefitsInfo?.summary || 'Vital biological support for systemic homeostatis.'}</div>
                             {benefitsInfo?.points && (
                               <ul style={{ paddingLeft: '18px', margin: '0', color: 'color-mix(in srgb, var(--theme-accent), white 40%)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                 {benefitsInfo.points.map((p: string, i: number) => <li key={i}>{p}</li>)}
                               </ul>
                             )}
                          </div>

                          {/* Deficiency Section */}
                          {defInfo && (
                            <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                               <div style={{ fontWeight: '800', color: 'color-mix(in srgb, var(--theme-warning), white 40%)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                 ⚠️ Deficiency Risks
                               </div>
                               <div style={{ lineHeight: '1.5', color: 'color-mix(in srgb, var(--theme-accent), white 40%)' }}>{defInfo.desc}</div>
                               {defInfo.sources && (
                                 <div style={{ marginTop: '8px', fontSize: '11px', color: 'color-mix(in srgb, var(--theme-accent), white 40%)', fontStyle: 'italic' }}>
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

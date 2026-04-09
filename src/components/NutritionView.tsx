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

  // Get CSS Variables for Chart
  const getVar = (name: string) => typeof window !== 'undefined' ? getComputedStyle(document.body).getPropertyValue(name).trim() : '';
  const proteinColor = getVar('--theme-error') || '#FF6B6B';
  const carbsColor = getVar('--theme-accent') || '#4DABF7';
  const fatColor = getVar('--theme-warning') || '#FCC419';

  const macroData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [totals.protein, totals.carbs, totals.fat],
        backgroundColor: [proteinColor, carbsColor, fatColor],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const macroOptions = {
    cutout: '80%',
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Overview Card */}
      <div className="section" style={{ background: 'linear-gradient(145deg, var(--theme-panel) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}>Macronutrients</h2>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: typeof window !== 'undefined' && window.innerWidth < 1000 ? 'column' : 'row', 
          alignItems: 'center', 
          gap: '32px',
          width: '100%'
        }}>
          <div style={{ width: '140px', height: '140px', position: 'relative' }}>
            <Doughnut data={macroData} options={macroOptions} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--theme-text)' }}>{totals.calories}</span>
              <span style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)' }}>kcal</span>
            </div>
          </div>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Protein', 'Carbs', 'Fat'].map((label, idx) => {
              const val = [totals.protein, totals.carbs, totals.fat][idx];
              const goal = [computed.proteinG, computed.carbG, computed.fatG][idx] || 1;
              const color = ['var(--theme-error, #FF6B6B)', 'var(--theme-accent, #4DABF7)', 'var(--theme-warning, #FCC419)'][idx];
              const pct = Math.min(100, (val / goal) * 100);
              
              return (
                <div key={label}>
                  <div 
                    onClick={() => label === 'Protein' && setExpandedMicro(expandedMicro === 'Protein' ? null : 'Protein')}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', cursor: label === 'Protein' ? 'pointer' : 'default' }}
                  >
                    <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--theme-text)' }}>
                      {label} {label === 'Protein' && <Info size={10} color="var(--theme-text-dim, #8b8b9b)" />}
                    </span>
                    <span style={{ color: 'var(--theme-text-dim, #8b8b9b)' }}>{Math.round(val)} <span style={{ fontSize: '10px' }}>/ {Math.round(goal)}g</span></span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '2px', margin: '4px 0 8px 0' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px' }} />
                  </div>
                  
                  {label === 'Protein' && expandedMicro === 'Protein' && (
                    <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--theme-text-dim, #c0c0d0)', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', padding: '12px', borderRadius: '8px', borderLeft: '2px solid var(--theme-error, #FF6B6B)', marginBottom: '8px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--theme-success, #92FE9D)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ✨ Performance Benefits
                        </div>
                        <div style={{ lineHeight: '1.5', color: 'var(--theme-text)' }}>{(NUTRIENT_BENEFITS as any).Protein?.summary || 'The building block of all human tissue.'}</div>
                        {(NUTRIENT_BENEFITS as any).Protein?.points && (
                          <ul style={{ paddingLeft: '18px', margin: '8px 0 0 0', color: 'var(--theme-text-dim, #8b8b9b)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {(NUTRIENT_BENEFITS as any).Protein.points.map((p: string, i: number) => <li key={i}>{p}</li>)}
                          </ul>
                        )}
                      </div>
                      {(DEFICIENCY_INFO as any).Protein && (
                        <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--theme-warning, #FCC419)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ⚠️ Deficiency Risks
                          </div>
                          <div style={{ lineHeight: '1.5', color: 'var(--theme-text-dim, #c0c0d0)' }}>{(DEFICIENCY_INFO as any).Protein.desc}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {label === 'Fat' && (
                    <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '1px solid var(--theme-border, rgba(255,255,255,0.1))', marginBottom: '8px' }}>
                      {[
                        { k: 'Saturated', v: totals.sat || 0, g: goal * 0.3, c: 'var(--theme-error, #FF6B6B)' },
                        { k: 'Monounsaturated', v: totals.mono || 0, g: goal * 0.4, c: 'var(--theme-success, #92FE9D)' },
                        { k: 'Polyunsaturated', v: totals.poly || 0, g: goal * 0.3, c: 'var(--theme-accent, #4DABF7)' },
                        { k: 'Trans (Avoid)', v: totals.trans || 0, g: 1, c: 'var(--theme-error, #FF4A4A)' }
                      ].map(sub => {
                        const isExpanded = expandedMicro === sub.k;
                        const info = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO] || NUTRIENT_BENEFITS[sub.k as keyof typeof NUTRIENT_BENEFITS];
                        const defInfo = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO];
                        return (
                        <div key={sub.k} style={{ background: isExpanded ? 'var(--theme-accent-dim, rgba(0,201,255,0.05))' : 'transparent', padding: isExpanded ? '8px 12px' : '0', borderRadius: '12px', transition: 'all 0.2s', margin: isExpanded ? '0 -12px' : '0' }}>
                          <div onClick={() => info && setExpandedMicro(isExpanded ? null : sub.k)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', cursor: info ? 'pointer' : 'default' }}>
                            <span style={{ color: 'var(--theme-text-dim, #c0c0d0)', display: 'flex', alignItems: 'center', gap: '4px' }}>{sub.k} {info && <Info size={10} color="var(--theme-text-dim, #8b8b9b)" />}</span>
                            <span style={{ color: 'var(--theme-text-dim, #8b8b9b)' }}>{Math.round(sub.v * 10)/10}g</span>
                          </div>
                          <div style={{ height: '2px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', borderRadius: '2px', marginTop: '2px' }}>
                            <div style={{ width: `${Math.min(100, (sub.v / sub.g) * 100)}%`, height: '100%', background: sub.c, borderRadius: '2px' }} />
                          </div>

                          {isExpanded && info && (
                            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--theme-text-dim, #c0c0d0)', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', padding: '12px', borderRadius: '8px', borderLeft: `2px solid ${sub.c}`, marginBottom: '8px' }}>
                              
                              {/* Benefits Section */}
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: '800', color: 'var(--theme-success)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  ✨ Metabolic Benefits
                                </div>
                                <div style={{ lineHeight: '1.5', color: 'var(--theme-text)' }}>{(info as any).summary || 'Essential profile for balanced nutrition.'}</div>
                              </div>

                              {/* Deficiency Section */}
                              {defInfo && (
                                <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                                  <div style={{ fontWeight: '800', color: 'var(--theme-warning, #FCC419)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ⚠️ Deficiency Risks
                                  </div>
                                  <div style={{ lineHeight: '1.5', color: 'var(--theme-text-dim, #c0c0d0)' }}>{defInfo.desc}</div>
                                  {defInfo.sources && (
                                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', fontStyle: 'italic' }}>
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
                    <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '1px solid var(--theme-border, rgba(255,255,255,0.1))', marginBottom: '8px' }}>
                      {[
                        { k: 'Complex Carbs', v: Math.max(0, totals.carbs - (totals.sugars || 0)), g: goal * 0.9, c: 'var(--theme-accent, #4DABF7)' },
                        { k: 'Simple (Sugars)', v: totals.sugars || 0, g: goal * 0.1, c: 'var(--theme-error, #FF6B6B)' }
                      ].map(sub => {
                        const isExpanded = expandedMicro === sub.k;
                        const info = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO] || NUTRIENT_BENEFITS[sub.k as keyof typeof NUTRIENT_BENEFITS];
                        const defInfo = DEFICIENCY_INFO[sub.k as keyof typeof DEFICIENCY_INFO];
                        return (
                        <div key={sub.k} style={{ background: isExpanded ? 'var(--theme-accent-dim, rgba(0,201,255,0.05))' : 'transparent', padding: isExpanded ? '8px 12px' : '0', borderRadius: '12px', transition: 'all 0.2s', margin: isExpanded ? '0 -12px' : '0' }}>
                          <div onClick={() => info && setExpandedMicro(isExpanded ? null : sub.k)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', cursor: info ? 'pointer' : 'default' }}>
                            <span style={{ color: 'var(--theme-text-dim, #c0c0d0)', display: 'flex', alignItems: 'center', gap: '4px' }}>{sub.k} {info && <Info size={10} color="var(--theme-text-dim, #8b8b9b)" />}</span>
                            <span style={{ color: 'var(--theme-text-dim, #8b8b9b)' }}>{Math.round(sub.v * 10)/10}g</span>
                          </div>
                          <div style={{ height: '2px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', borderRadius: '2px', marginTop: '2px' }}>
                            <div style={{ width: `${Math.min(100, (sub.v / sub.g) * 100)}%`, height: '100%', background: sub.c, borderRadius: '2px' }} />
                          </div>

                          {isExpanded && info && (
                            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--theme-text-dim, #c0c0d0)', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', padding: '12px', borderRadius: '8px', borderLeft: `2px solid ${sub.c}`, marginBottom: '8px' }}>
                              
                              {/* Benefits Section */}
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: '800', color: 'var(--theme-success, #92FE9D)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  ✨ Performance Benefits
                                </div>
                                <div style={{ lineHeight: '1.5', color: 'var(--theme-text)' }}>{(info as any).summary || 'Vital fuel source for metabolic energy.'}</div>
                              </div>

                              {/* Deficiency Section */}
                              {defInfo && (
                                <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                                  <div style={{ fontWeight: '800', color: 'var(--theme-warning, #FCC419)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ⚠️ Deficiency Risks
                                  </div>
                                  <div style={{ lineHeight: '1.5', color: 'var(--theme-text-dim, #c0c0d0)' }}>{defInfo.desc}</div>
                                  {defInfo.sources && (
                                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', fontStyle: 'italic' }}>
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
      <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}>Micronutrients</h2>
        <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
          {MICRO_CATEGORIES.map((cat: any) => (
            <div key={cat.cat}>
              <h3 style={{ fontSize: '13px', color: 'var(--theme-accent, #00C9FF)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.cat}</h3>
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
                    <div key={label} style={{ background: isExpanded ? 'var(--theme-accent-dim, rgba(0,201,255,0.05))' : 'transparent', padding: isExpanded ? '8px 12px' : '0 8px', borderRadius: '12px', transition: 'all 0.2s', margin: isExpanded ? '0 -4px' : '0' }}>
                      <div 
                        onClick={() => info && setExpandedMicro(isExpanded ? null : label)}
                        style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', gap: '12px', alignItems: 'center', cursor: info ? 'pointer' : 'default' }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: '700', color: isExpanded ? 'var(--theme-accent)' : 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {label} {info && <Info size={10} color="var(--theme-text-dim)" />}
                        </div>
                        <div style={{ height: '4px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', borderRadius: '4px', position: 'relative' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--theme-accent)', borderRadius: '4px', boxShadow: pct >= 100 ? '0 0 8px var(--theme-accent)' : 'none' }} />
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '800', textAlign: 'right', color: pct >= 100 ? 'var(--theme-success)' : 'var(--theme-text)' }}>{Math.round(val)}{unit}</div>
                      </div>
                      
                      {isExpanded && info && (
                        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--theme-text-dim, #c0c0d0)', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', padding: '12px', borderRadius: '8px', borderLeft: '2px solid var(--theme-accent, #00C9FF)', marginBottom: '8px' }}>
                          
                          {/* Benefits Section */}
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: '800', color: 'var(--theme-success, #92FE9D)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ✨ Clinical Benefits
                            </div>
                            <div style={{ marginBottom: '10px', lineHeight: '1.5', color: 'var(--theme-text)' }}>{benefitsInfo?.summary || 'Vital biological support for systemic homeostatis.'}</div>
                            
                            {benefitsInfo?.points && (
                              <ul style={{ paddingLeft: '18px', margin: '0', color: 'var(--theme-text-dim, #8b8b9b)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {benefitsInfo.points.map((p: string, i: number) => <li key={i}>{p}</li>)}
                              </ul>
                            )}
                          </div>

                          {/* Deficiency Section */}
                          {defInfo && (
                            <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
                              <div style={{ fontWeight: '800', color: 'var(--theme-warning, #FCC419)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ⚠️ Deficiency Risks
                              </div>
                              <div style={{ lineHeight: '1.5', color: 'var(--theme-text-dim, #c0c0d0)' }}>{defInfo.desc}</div>
                              {defInfo.sources && (
                                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', fontStyle: 'italic' }}>
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

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useDiary } from '../context/DiaryContext';
import { SERVING_UNITS } from '../lib/constants';
import type { Food } from '../types/food';
import { computeMultiplier, scaleLegacyFoodByAmount, sumFoods, normalizeFoodResult } from '../lib/food/serving-converter';
import { 
  Search, Sparkles, Plus, Check, 
  X, Loader2, Info, FileText, Trash2
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { SearchCoaster, type SearchTab } from './SearchCoaster';
import { NutritionFactsDisplay } from './NutritionFactsDisplay';



interface AddFoodModalProps {
  meal: string;
  onClose: () => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({ meal, onClose }) => {
  const { 
    localCache, addFoodLog, saveCustomFood, deleteCustomFood,
    stagingTray, addToTray, clearTray 
  } = useDiary();
  
  const [activeTab, setActiveTab] = useState<SearchTab>('ai-search');
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [aiStagedResults, setAiStagedResults] = useState<any[]>([]);
  const [isAiReviewing, setIsAiReviewing] = useState(false);



  
  const [mealDesc, setMealDesc] = useState('');
  const [targetMeal, setTargetMeal] = useState(meal);
  const [highProteinOnly] = useState(false);
  const [configuringFood, setConfiguringFood] = useState<Food | null>(null);
  const [editName, setEditName] = useState('');
  const [saveToPantry, setSaveToPantry] = useState(false);
  const [showFullNutrition, setShowFullNutrition] = useState(false);
  const [servingQty, setServingQty] = useState('1');
  const [servingUnit, setServingUnit] = useState('serving');

  const handleAddFoodClick = (food: Food) => {
    setConfiguringFood(food);
    setEditName(food.name || '');
    setSaveToPantry(false);
    
    // SMART PORTIONING: Try to extract weight (e.g. 174g) from serving string
    const weightMatch = (food.serving || '').match(/(\d+)\s?(g|oz)/i);
    if (weightMatch) {
      setServingQty(weightMatch[1]);
      setServingUnit(weightMatch[2].toLowerCase());
    } else {
      setServingQty(String(food.sQty || '1'));
      setServingUnit(food.sUnit || 'serving');
    }

    setShowFullNutrition(false);
    setTargetMeal(meal);
  };

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (configuringFood) {
      const qty = parseFloat(servingQty) || 1;
      const mult = computeMultiplier(configuringFood.serving || '', servingUnit, qty);
      const scaledFood = scaleLegacyFoodByAmount(configuringFood, mult);
      
      scaledFood.name = editName || configuringFood.name;
      scaledFood.isLocal = configuringFood.isLocal;
      scaledFood._base = configuringFood; // Store for lossless re-editing
      
      if (saveToPantry) {
        saveCustomFood({
          ...scaledFood,
          id: crypto.randomUUID(),
          p: Number(scaledFood.p) || 0,
          c: Number(scaledFood.c) || 0,
          f: Number(scaledFood.f) || 0,
          cal: Number(scaledFood.cal) || 0,
          serving: `${qty} ${servingUnit}`,
          sQty: qty,
          sUnit: servingUnit
        });
      }
      
      addFoodLog(targetMeal, scaledFood);
      setConfiguringFood(null);
      // Clear search after adding
      setQuery('');
      setResults([]);
    }
  };



  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const detected = body.foods || [];
      if (detected.length === 0) {
        setErrorMsg("No AI results found. Try being more specific.");
      } else {
        setAiStagedResults(detected.map((f: Food) => {
          const norm = normalizeFoodResult(f);
          return { 
            ...norm, 
            stagedQty: norm.sQty?.toString() || '1', 
            stagedUnit: norm.sUnit || 'serving' 
          };
        }));
        setIsAiReviewing(true);
      }
    } catch (err: unknown) {
      console.error("AI Lookup error:", err);
      setErrorMsg("AI Lookup failed. Please try again.");
    }
    setSearching(false);
  };

  const handleAIDescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealDesc) return;
    setSearching(true);
    setResults([]);
    setAiStagedResults([]);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: mealDesc })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const detected = body.foods || [];
      if (detected.length === 0) {
        setErrorMsg("AI could not extract foods from that description.");
      } else {
        setAiStagedResults(detected.map((f: Food) => {
          const norm = normalizeFoodResult(f);
          // PRIORITIZE NATURAL DETECTION: Use exactly what AI provided for Qty and Unit
          return { 
            ...norm, 
            stagedQty: f.stagedQty || f.sQty?.toString() || '1', 
            stagedUnit: f.stagedUnit || f.sUnit || 'piece',
            showNutrientIntel: false
          };
        }));
        setIsAiReviewing(true);
      }
    } catch (err) {
      console.error("AI Describe error:", err);
      setErrorMsg("Meal analysis failed. Please try again.");
    }
    setSearching(false);
  };

  return ReactDOM.createPortal(
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 5000, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      transition: 'all 0.3s ease', 
      background: 'var(--theme-bg)', 
      overflowY: 'auto' 
    }}>
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '9px', color: 'var(--theme-text-dim)', opacity: 0.2, pointerEvents: 'none', zIndex: 9999 }}>v2.7-GLASSMORPHIC</div>
      
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '600px', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--theme-text)', fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>ADD FOOD</h2>
          <div style={{ color: 'var(--theme-accent, #00C9FF)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px' }}>{meal}</div>
        </div>
        <button onClick={onClose} style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'var(--theme-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
      </div>

      {/* Scrollable Content Container */}
      <div style={{ flex: 1, width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', padding: '10px var(--space-md) 100px', gap: 'var(--space-lg)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        
        <SearchCoaster 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            if (tab !== activeTab) {
              setErrorMsg('');
              setQuery('');
              setResults([]);
              setMealDesc('');
              setIsAiReviewing(false);
              setAiStagedResults([]);
              setActiveTab(tab);
            }
          }} 
        />

        {/* SYNC TEST v2.5 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'var(--theme-error)', fontSize: '12px', marginBottom: '8px', textAlign: 'center' }}>{errorMsg}</div>
          
          {activeTab === 'ai-search' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAISearch(e);
                }} 
                style={{ display: 'flex', gap: '8px' }}
              >
                <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                    placeholder="Search library or Ask AI (e.g. '1/2 cup of blueberries')"
                    value={query}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuery(val);
                      if (errorMsg) setErrorMsg('');
                      
                      if (val.trim()) {
                        const customFoods: Food[] = localCache.customFoods || [];
                        let localMatches = customFoods.filter(f => 
                          f.name.toLowerCase().includes(val.toLowerCase())
                        ).map((f, idx) => ({ ...f, isLocal: true, localIdx: idx }));
                        if (highProteinOnly) {
                          localMatches = localMatches.filter(f => (Number(f.p) || 0) >= 20);
                        }
                        setResults(localMatches);
                      } else {
                        setResults([]);
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      padding: 'var(--space-md) var(--space-md) var(--space-md) 44px', 
                      background: 'rgba(10, 30, 33, 0.08)', 
                      border: '1px solid var(--theme-border)', 
                      borderRadius: '18px', 
                      color: 'var(--theme-text)', 
                      outline: 'none', 
                      fontSize: '15px', 
                      minHeight: '52px',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  />
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--theme-accent)' }}>
                    {searching ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
                  </div>
                  
                  {/* High-Fidelity Loading Progress Bar */}
                  {searching && (
                    <div style={{ 
                      position: 'absolute',
                      bottom: '-4px',
                      left: '20px',
                      right: '20px',
                      height: '3px', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '3px', 
                      overflow: 'hidden',
                      zIndex: 10
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: '40%', 
                        background: 'var(--theme-accent)', 
                        borderRadius: '3px',
                        boxShadow: '0 0 10px var(--theme-accent)',
                        animation: 'searching-bar 1.5s infinite ease-in-out' 
                      }} />
                    </div>
                  )}
                </div>
              </form>


              {results.length > 0 && !isAiReviewing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                  {results.map((f, i) => (
                    <SearchResultItem 
                      key={i} 
                      food={f} 
                      onClick={() => handleAddFoodClick(f)}
                      localIdx={(f as any).localIdx}
                      onDelete={(idx) => {
                        deleteCustomFood(idx);
                        setResults(prev => prev.filter((_, itemIdx) => itemIdx !== i));
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'describe' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ 
                background: 'rgba(15, 15, 20, 0.4)', 
                borderRadius: '28px', 
                padding: '28px', 
                border: '1.5px solid rgba(255,255,255,0.08)', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--theme-accent)', marginBottom: '4px' }}>
                    <div style={{ 
                      background: 'var(--theme-accent-dim)', 
                      padding: '10px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px solid rgba(0, 201, 255, 0.2)'
                    }}>
                      <Sparkles size={22} style={{ filter: 'drop-shadow(0 0 5px var(--theme-accent))' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: 'var(--theme-text)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        Analyze Meal Intelligence
                      </h3>
                      <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>AI-Powered Complex Parsing</div>
                    </div>
                  </div>

                  <button 
                    onClick={handleAIDescribe}
                    disabled={searching || !mealDesc.trim()}
                    style={{ 
                      width: '100%', 
                      padding: '18px', 
                      background: 'linear-gradient(135deg, rgba(0, 201, 255, 0.15), rgba(0, 201, 255, 0.05))', 
                      border: '1.5px solid var(--theme-accent, #00C9FF)', 
                      borderRadius: '18px', 
                      color: 'var(--theme-accent, #00C9FF)', 
                      fontWeight: '900', 
                      fontSize: '13px',
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 24px rgba(0, 201, 255, 0.15)',
                      opacity: searching || !mealDesc.trim() ? 0.5 : 1
                    }}>
                    {searching ? <Loader2 className="spin" size={20} /> : <FileText size={20} />}
                    <span style={{ letterSpacing: '1.5px' }}>{searching ? 'ANALYZING MEAL...' : 'ANALYZE MEAL DESCRIPTION'}</span>
                  </button>

                  <textarea 
                    placeholder="Describe your whole meal here... (e.g. '3 scrambled eggs with spinach and a cup of black coffee')"
                    value={mealDesc}
                    onChange={(e) => {
                      setMealDesc(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    style={{ 
                      width: '100%', 
                      minHeight: '160px', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '20px', 
                      padding: '20px', 
                      color: 'var(--theme-text)', 
                      outline: 'none', 
                      fontSize: '15px', 
                      lineHeight: '1.6',
                      fontFamily: 'inherit',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : activeTab === 'scan' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
              <BarcodeScanner 
                onScanSuccess={(result) => {
                  if (typeof result === 'object' && result !== null) {
                    setAiStagedResults([{ ...result, stagedQty: '1', stagedUnit: 'serving', showNutrientIntel: false }]);
                    setIsAiReviewing(true);
                  } else {
                    const displayQuery = typeof result === 'string' ? result : (result?.name || '');
                    setQuery(String(displayQuery));
                    if (displayQuery) {
                      const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
                      handleAISearch(dummyEvent);
                    }
                    setActiveTab('ai-search');
                  }
                }}
                onScanError={(err) => setErrorMsg(err)}
              />
              <p style={{ fontSize: '13px', color: 'var(--theme-text-dim)', textAlign: 'center', maxWidth: '280px', lineHeight: '1.4', fontWeight: '600' }}>
                Scans <span style={{ color: 'var(--theme-accent)' }}>Nutrition Labels</span> and <span style={{ color: 'var(--theme-accent)' }}>Barcodes</span>. Take a clear photo for best results.
              </p>
            </div>
          ) : null}

          {/* AI Review Step - Visible for both AI Search and Describe tabs */}
          {isAiReviewing && aiStagedResults.length > 0 && (
            <div style={{ padding: '20px', background: 'rgba(0,180,255,0.03)', borderRadius: '24px', border: '1px solid rgba(0,180,255,0.15)', backdropFilter: 'blur(10px)', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="var(--theme-accent)" />
                      <span style={{ fontSize: '15px', fontWeight: '800' }}>REVIEW DETECTED MEAL</span>
                      <span style={{ fontSize: '9px', color: 'var(--theme-text-dim)', opacity: 0.5, background: 'var(--theme-panel-dim)', padding: '2px 6px', borderRadius: '6px' }}>v2.2-QTY-FORCE</span>
                    </div>
                    </div>
                    <button onClick={() => { setIsAiReviewing(false); setAiStagedResults([]); }} style={{ background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-dim)', borderRadius: '12px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}>DISMISS</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {aiStagedResults.map((f, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--theme-accent)' }}>{f.name}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = [...aiStagedResults];
                                next[i] = { ...f, showNutrientIntel: !f.showNutrientIntel };
                                setAiStagedResults(next);
                              }}
                              style={{ 
                                background: f.showNutrientIntel ? 'rgba(0, 201, 255, 0.15)' : 'rgba(255,255,255,0.05)', 
                                border: '1px solid',
                                borderColor: f.showNutrientIntel ? 'var(--theme-accent)' : 'rgba(255,255,255,0.1)',
                                color: f.showNutrientIntel ? 'var(--theme-accent)' : 'rgba(255,255,255,0.5)', 
                                borderRadius: '8px', padding: '4px 8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px'
                              }}>
                              <Info size={12} /> {f.showNutrientIntel ? 'HIDE' : 'INFO'}
                            </button>
                            <button onClick={() => {
                              const next = aiStagedResults.filter((_, idx) => idx !== i);
                              setAiStagedResults(next);
                              if (next.length === 0) setIsAiReviewing(false);
                            }} style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,0.6)', cursor: 'pointer' }}><X size={16} /></button>
                          </div>
                        </div>

                        {/* Nutritional Breakdown Inline - Distinguishing Bubble */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px', background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)', padding: '10px', borderRadius: '16px' }}>
                          {(() => {
                            const currentQty = parseFloat(f.stagedQty) || 0;
                            const mult = computeMultiplier(f.serving || '100g', f.stagedUnit, currentQty);
                            return (
                              <>
                                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'var(--theme-text-dim, rgba(255,255,255,0.4))', fontWeight: '700' }}>KCAL</div><div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--theme-text)' }}>{Math.round((Number(f.cal) || 0) * mult)}</div></div>
                                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>P</div><div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--theme-error)' }}>{((Number(f.p) || 0) * mult).toFixed(1)}g</div></div>
                                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>C</div><div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--theme-accent)' }}>{((Number(f.c) || 0) * mult).toFixed(1)}g</div></div>
                                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>F</div><div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--theme-warning)' }}>{((Number(f.f) || 0) * mult).toFixed(1)}g</div></div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Expandable Health Intel Section (Live Edit Mode) */}
                        {f.showNutrientIntel && (
                          <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.2s ease-out' }}>
                            <NutritionFactsDisplay 
                              food={f} 
                              multiplier={computeMultiplier(f.serving || '100g', f.stagedUnit || 'piece', parseFloat(f.stagedQty || '0') || 0)} 
                              onEdit={(key, val) => {
                                const next = [...aiStagedResults];
                                next[i] = { ...f, [key]: val };
                                setAiStagedResults(next);
                              }}
                            />
                          </div>
                        )}

                        {/* Scaling Help Row */}
                        {!f.showNutrientIntel && (
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                            <button 
                              onClick={() => {
                                const multP = 20 / (Number(f.p) || 1);
                                const next = [...aiStagedResults];
                                next[i] = { ...f, stagedQty: Math.round(multP * 10) / 10 + '', stagedUnit: 'serving' };
                                setAiStagedResults(next);
                              }}
                              style={{ flex: 1, padding: '6px', background: 'rgba(146, 254, 157, 0.1)', border: '1px solid rgba(146, 254, 157, 0.2)', borderRadius: '8px', color: '#92FE9D', fontSize: '9px', fontWeight: '900', cursor: 'pointer' }}>
                              SCALE TO 20g PROTEIN
                            </button>
                            <button 
                              onClick={() => {
                                const multC = 500 / (Number(f.cal) || 1);
                                const next = [...aiStagedResults];
                                next[i] = { ...f, stagedQty: Math.round(multC * 10) / 10 + '', stagedUnit: 'serving' };
                                setAiStagedResults(next);
                              }}
                              style={{ flex: 1, padding: '6px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '8px', color: '#FF6B6B', fontSize: '9px', fontWeight: '900', cursor: 'pointer' }}>
                              SCALE TO 500 KCAL
                            </button>
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="number" 
                            step="any"
                            value={f.stagedQty} 
                            onChange={(e) => {
                              const next = [...aiStagedResults];
                              next[i] = { ...f, stagedQty: e.target.value };
                              setAiStagedResults(next);
                            }}
                            style={{ width: '75px', background: 'rgba(0,0,0,0.06)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text)', fontSize: '13px', padding: '12px', textAlign: 'center', outline: 'none', fontWeight: '900' }} 
                          />
                          <select 
                            value={f.stagedUnit} 
                            onChange={(e) => {
                              const next = [...aiStagedResults];
                              next[i] = { ...f, stagedUnit: e.target.value };
                              setAiStagedResults(next);
                            }}
                            style={{ flex: 1, background: 'rgba(0,0,0,0.06)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text)', fontSize: '13px', padding: '12px', outline: 'none', fontWeight: '800' }}>
                            {SERVING_UNITS.map(u => <option key={u.v} value={u.v} style={{ background: 'var(--theme-bg)' }}>{u.v}</option>)}
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfiguringFood(f);
                            }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text)', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                          >
                            <Info size={12} color="var(--theme-accent)" /> TWEAK INGREDIENT
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Ingredient Button */}
                    <button 
                      onClick={() => {
                        const newItem: Food = {
                          name: 'New Ingredient',
                          cal: 0, p: 0, c: 0, f: 0,
                          serving: '1 serving',
                          sQty: 1,
                          sUnit: 'serving',
                          stagedQty: '1',
                          stagedUnit: 'serving',
                          showNutrientIntel: true
                        };
                        setAiStagedResults([...aiStagedResults, newItem]);
                      }}
                      style={{ 
                        width: '100%', 
                        padding: '16px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px dashed var(--theme-accent)', 
                        borderRadius: '18px', 
                        color: 'var(--theme-accent)', 
                        fontWeight: '800', 
                        fontSize: '13px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '4px'
                      }}
                    >
                      <Plus size={18} /> ADD INGREDIENT
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <button 
                      onClick={() => {
                        const mealData = {
                          name: `AI Meal: ${(query || mealDesc).length > 20 ? (query || mealDesc).substring(0, 20) + '...' : (query || mealDesc)}`,
                          serving: '1 meal',
                          items: aiStagedResults.map(f => {
                            const mult = computeMultiplier(f.serving || '', f.stagedUnit || 'piece', parseFloat(f.stagedQty || '1') || 1);
                            return scaleLegacyFoodByAmount(f, mult);
                          })
                        };
                        saveCustomFood(mealData as any);
                        alert("Meal template saved to Kitchen!");
                        setIsAiReviewing(false);
                        setAiStagedResults([]);
                      }}
                      style={{ padding: '18px 5px', background: 'rgba(146, 254, 157, 0.1)', border: '1px solid var(--theme-success)', borderRadius: '18px', color: 'var(--theme-success)', fontWeight: '900', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Plus size={14} /> BRING TO KITCHEN
                    </button>

                    <button 
                      onClick={() => {
                        const mealName = prompt("Name this meal?", "AI Detected Meal") || "AI Detected Meal";
                        const totalMacros = sumFoods(aiStagedResults.map(f => {
                           const mult = computeMultiplier(f.serving || '', f.stagedUnit || 'piece', parseFloat(f.stagedQty || '1') || 1);
                           return scaleLegacyFoodByAmount(f, mult);
                        }));
                        
                        const mealData = {
                          ...totalMacros,
                          name: mealName,
                          serving: '1 meal',
                          sQty: 1,
                          sUnit: 'meal',
                          isLocal: true,
                          type: 'recipe',
                          id: `meal-${Date.now()}`
                        };
                        
                        saveCustomFood(mealData);
                        alert("Entire meal saved to Kitchen!");
                        setIsAiReviewing(false);
                        setAiStagedResults([]);
                      }}
                      style={{ padding: '18px 5px', background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)', borderRadius: '18px', color: 'var(--theme-text)', fontWeight: '900', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Sparkles size={14} color="var(--theme-accent)" /> SAVE AS MEAL
                    </button>
                    
                    <button 
                      onClick={() => {
                        aiStagedResults.forEach(f => {
                          const mult = computeMultiplier(f.serving || '', f.stagedUnit || 'piece', parseFloat(f.stagedQty || '1') || 1);
                          const scaled = scaleLegacyFoodByAmount(f, mult);
                          scaled.serving = `${f.stagedQty} ${f.stagedUnit}`;
                          scaled._base = f; 
                          addToTray(scaled);
                        });
                        setIsAiReviewing(false);
                        setAiStagedResults([]);
                      }}
                      style={{ gridColumn: 'span 2', padding: '18px 10px', background: 'var(--theme-accent)', border: 'none', borderRadius: '18px', color: '#000', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 8px 20px rgba(0,201,255,0.2)' }}>
                      <Check size={18} /> CONFIRM ITEMS TO DIARY
                    </button>
                  </div>
                </div>
              )}
        </div>

        {/* Persistent Staging Tray (Floating at Bottom) */}
        {stagingTray.length > 0 && (
          <div style={{ position: 'sticky', bottom: '-20px', background: 'rgba(10,30,33,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px 24px 0 0', padding: '24px', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', margin: '0 -20px', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--theme-text)' }}>Logging {stagingTray.length} items</div>
               <button onClick={clearTray} style={{ background: 'none', border: 'none', color: 'var(--theme-error)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Clear All</button>
            </div>
            
            <button onClick={() => {
              stagingTray.forEach(f => addFoodLog(meal, f));
              clearTray();
              onClose();
            }} style={{ width: '100%', padding: '16px', background: 'var(--theme-accent, #00C9FF)', color: '#000', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <Check size={20} /> LOG TO DIARY
            </button>
          </div>
        )}

      </div>

      {/* Food Configuration Overlay */}
      {configuringFood && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(40px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, padding: '20px' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '500px', background: 'rgba(10,30,33,0.92)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.15)', padding: '24px 24px 60px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', backdropFilter: 'blur(25px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ background: 'none', border: 'none', color: 'var(--theme-text)', fontSize: '20px', fontWeight: '800', padding: 0, width: '100%', outline: 'none', marginBottom: '4px' }}
                  />
                  <div style={{ fontSize: '13px', color: 'var(--theme-text-dim)' }}>Serving: {configuringFood.serving}</div>
                </div>
                <button onClick={() => setConfiguringFood(null)} style={{ background: 'var(--theme-panel-dim)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--theme-text)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Quick Macros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <QuickMacro label="Calories" val={Math.round((Number(configuringFood.cal)||0) * computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1))} unit="kcal" color="var(--theme-text-on-panel)" />
                <QuickMacro label="Protein" val={Math.round((Number(configuringFood.p)||0) * computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1))} unit="g" color="var(--theme-error)" />
                <QuickMacro label="Carbs" val={Math.round((Number(configuringFood.c)||0) * computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1))} unit="g" color="var(--theme-accent)" />
                <QuickMacro label="Fat" val={Math.round((Number(configuringFood.f)||0) * computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1))} unit="g" color="var(--theme-warning)" />
              </div>

              {/* Goal Impact Feedback */}
              {(() => {
                const multiplier = computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1);
                const p = (Number(configuringFood.p) || 0) * multiplier;
                const c = (Number(configuringFood.c) || 0) * multiplier;
                const f = (Number(configuringFood.f) || 0) * multiplier;
                const totalCal = (Number(configuringFood.cal) || 0) * multiplier;
                
                const isHighProtein = (p * 4) / (totalCal || 1) > 0.35;
                const isHighCarb = (c * 4) / (totalCal || 1) > 0.6;
                const isHighFat = (f * 9) / (totalCal || 1) > 0.5;

                return (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {isHighProtein && <div style={{ padding: '4px 8px', background: 'rgba(146, 254, 157, 0.1)', border: '1px solid var(--theme-success)', borderRadius: '8px', color: 'var(--theme-success)', fontSize: '9px', fontWeight: '800' }}>⚡ PROTEIN POWERHOUSE</div>}
                    {isHighCarb && <div style={{ padding: '4px 8px', background: 'rgba(252, 196, 25, 0.1)', border: '1px solid #FCC419', borderRadius: '8px', color: '#FCC419', fontSize: '9px', fontWeight: '800' }}>🥗 HIGH ENERGY CARBS</div>}
                    {isHighFat && <div style={{ padding: '4px 8px', background: 'rgba(255, 107, 107, 0.1)', border: '1px solid #FF6B6B', borderRadius: '8px', color: '#FF6B6B', fontSize: '9px', fontWeight: '800' }}>🥑 HIGH FAT CONTENT</div>}
                  </div>
                );
              })()}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--theme-text-dim)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Assign to Meal</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => (
                    <button
                      key={m}
                      onClick={() => setTargetMeal(m)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: targetMeal === m ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-border, rgba(255,255,255,0.1))',
                        background: targetMeal === m ? 'var(--theme-accent-dim, rgba(0, 201, 255, 0.1))' : 'var(--theme-panel-dim, rgba(255,255,255,0.05))',
                        color: targetMeal === m ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text)',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--theme-text-dim)', display: 'block', marginBottom: '6px' }}>AMOUNT</label>
                    <input 
                      type="number" 
                      value={servingQty}
                      onChange={(e) => {
                        const v = e.target.value;
                        const cleaned = (v.length > 1 && v.startsWith('0') && !v.startsWith('0.')) ? v.substring(1) : v;
                        setServingQty(cleaned);
                      }}
                      className="mm-input"
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--theme-text-dim)', display: 'block', marginBottom: '6px' }}>UNIT</label>
                    <select 
                      value={servingUnit}
                      onChange={(e) => setServingUnit(e.target.value)}
                      className="mm-select">
                      {SERVING_UNITS.map(u => <option key={u.v} value={u.v} style={{ background: 'var(--theme-panel-base)', color: 'var(--theme-text)' }}>{u.v}</option>)}
                    </select>
                  </div>
                </div>

                {/* Save to Pantry Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" checked={saveToPantry} onChange={() => setSaveToPantry(!saveToPantry)} />
                  <label style={{ color: 'var(--theme-text)', fontSize: '12px', fontWeight: '700' }}>ADD TO KITCHEN</label>
                </div>

                <div onClick={() => setShowFullNutrition(!showFullNutrition)} style={{ textAlign: 'center', fontSize: '13px', color: 'var(--theme-accent)', cursor: 'pointer', fontWeight: '700' }}>
                   {showFullNutrition ? 'Hide Details' : 'View Detailed Nutrition Intelligence'}
                </div>

                {showFullNutrition && (
                  <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--theme-border)' }}>
                    {configuringFood && (
                      <NutritionFactsDisplay 
                        food={configuringFood} 
                        multiplier={computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1)} 
                      />
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={handleConfirmAdd}
                  style={{ width: '100%', padding: '16px', background: 'var(--theme-success, #92FE9D)', color: 'var(--theme-bg)', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(146,254,157,0.2)' }}>
                  <Check size={22} /> ADD TO MEAL
                </button>

                <button 
                  onClick={() => {
                    // Logic to jump to Macro Kitchen with this food
                    // For now, we save it to pantry and suggest switching, 
                    // or we could use a global state if we had one.
                    // But since we are in a modal, we'll try to save it to pantry first.
                    const qty = parseFloat(servingQty) || 1;
                    const foodData = { ...configuringFood, name: editName, serving: `${qty} ${servingUnit}`, sQty: qty, sUnit: servingUnit };
                    saveCustomFood(foodData);
                    setConfiguringFood(null);
                    onClose();
                    alert("Food saved to Pantry! You can now add it as an ingredient in the Macro Kitchen tab.");
                  }}
                  style={{ width: '100%', padding: '16px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '16px', color: 'var(--theme-text)', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--theme-accent)" /> USE AS INGREDIENT
                </button>
              </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default AddFoodModal;

const SearchResultItem = React.memo(({ food, onClick, localIdx, onDelete }: { food: any, onClick: () => void, localIdx?: number, onDelete: (idx: number) => void }) => (
  <div 
    onClick={onClick} 
    className="glass-card"
    style={{ 
      padding: 'var(--space-md)', 
      cursor: 'pointer', 
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center'
    }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ fontWeight: '800', color: 'var(--theme-accent)', fontSize: '15px' }}>{food.name}</div>
        {food.brand && <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', opacity: 0.6 }}>• {food.brand}</div>}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
        <div style={{ fontSize: '11px', color: 'var(--theme-accent)', fontWeight: '700' }}>{food.cal} kcal</div>
        <div style={{ width: '1px', height: '10px', background: 'var(--theme-border)' }} />
        <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', fontWeight: '600' }}>P:{food.p}g C:{food.c}g F:{food.f}g</div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {food.isLocal && (
        <button 
          title="Remove from Kitchen"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remove "${food.name}" from your Kitchen?`)) {
              if (typeof localIdx === 'number') {
                onDelete(localIdx);
              }
            }
          }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,0.4)', cursor: 'pointer', padding: '4px' }}>
          <Trash2 size={18} />
        </button>
      )}
      <Plus size={20} color="var(--theme-accent, #00C9FF)" />
    </div>
  </div>
));

const QuickMacro = ({ label, val, unit, color }: any) => (
  <div className="glass-card" style={{ padding: 'var(--space-sm) var(--space-xs)', textAlign: 'center' }}>
    <div style={{ fontSize: '9px', color: 'var(--theme-text-on-panel)', opacity: 0.6, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '15px', color: color || 'var(--theme-text-on-panel)', fontWeight: '900' }}>{val}<span style={{ fontSize: '10px', color: 'var(--theme-text-on-panel)', opacity: 0.7, fontWeight: '600', marginLeft: '1px' }}>{unit}</span></div>
  </div>
);

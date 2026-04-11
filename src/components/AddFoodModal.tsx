import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDiary } from '../context/DiaryContext';
import { SERVING_UNITS } from '../lib/constants';
import type { Food } from '../types/food';
import { computeMultiplier, scaleLegacyFoodByAmount, sumFoods } from '../lib/food/serving-converter';
import { 
  Search, Sparkles, Plus, Check, 
  X, Loader2, Info, FileText, Trash2
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { SearchCoaster, type SearchTab } from './SearchCoaster';
import { NutritionFactsDisplay } from './NutritionFactsDisplay';

// Helper: Ensure Calories = (P*4) + (C*4) + (F*9)
const enforceCalorieConsistency = (food: Food): Food => {
  const p = Number(food.p) || 0;
  const c = Number(food.c) || 0;
  const f = Number(food.f) || 0;
  const macroCals = Math.round(p * 4 + c * 4 + f * 9);
  
  // If the stated calories are significantly different from macro calculation,
  // we follow the macro calculation for physical consistency.
  return {
    ...food,
    cal: macroCals
  };
};

// Helper: Robust rounding for all nutrients (ported from index_old.html logic)
const normalizeFoodResult = (food: any): Food => {
  const r = (val: number | string | undefined, decimals = 1) => {
    const n = Number(val) || 0;
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
  };

  const normalized = {
    ...food,
    name: food.name || 'Unknown food',
    serving: food.serving || '1 serving',
    sQty: Number(food.stagedQty != null ? food.stagedQty : (food.sQty != null ? food.sQty : 1)) || 1,
    sUnit: food.stagedUnit || food.sUnit || 'piece',
    p: r(food.p),
    c: r(food.c),
    f: r(food.f),
    fb: r(food.fb),
    sat: r(food.sat),
    trans: r(food.trans),
    mono: r(food.mono),
    poly: r(food.poly),
    chol: Math.round(Number(food.chol) || 0),
    sugars: r(food.sugars),
    Sodium: Math.round(Number(food.Sodium) || 0),
    Potassium: Math.round(Number(food.Potassium) || 0),
    Calcium: Math.round(Number(food.Calcium) || 0),
    Iron: r(food.Iron),
    'Vitamin C': r(food['Vitamin C']),
    'Vitamin A': Math.round(Number(food['Vitamin A']) || 0),
    'Vitamin D': r(food['Vitamin D']),
    'Vitamin B1': r(food['Vitamin B1'], 2),
    'Vitamin B2': r(food['Vitamin B2'], 2),
    'Vitamin B3': r(food['Vitamin B3'], 2),
    'Vitamin B5': r(food['Vitamin B5'], 2),
    'Vitamin B6': r(food['Vitamin B6'], 2),
    'Vitamin B12': r(food['Vitamin B12'], 2),
    'Vitamin E': r(food['Vitamin E']),
    'Vitamin K': r(food['Vitamin K']),
    Magnesium: Math.round(Number(food.Magnesium) || 0),
    Zinc: r(food.Zinc),
    Phosphorus: Math.round(Number(food.Phosphorus) || 0),
    Manganese: r(food.Manganese, 2),
    Selenium: r(food.Selenium),
    Copper: r(food.Copper, 3),
  };

  return enforceCalorieConsistency(normalized);
};

interface AddFoodModalProps {
  meal: string;
  onClose: () => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({ meal, onClose }) => {
  const { 
    localCache, addFoodLog, saveCustomFood, deleteCustomFood,
    stagingTray, addToTray, clearTray 
  } = useDiary();
  
  const [activeTab, setActiveTab] = useState<SearchTab>('search');
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [aiStagedResults, setAiStagedResults] = useState<any[]>([]);
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);


  
  const [mealDesc, setMealDesc] = useState('');
  const [targetMeal, setTargetMeal] = useState(meal);
  const [highProteinOnly, setHighProteinOnly] = useState(false);
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
      scaledFood.serving = `${qty} ${servingUnit}`;
      scaledFood.sQty = qty;
      scaledFood.sUnit = servingUnit;
      
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

  const handleStandardSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    // Abort any existing search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSearching(true);
    setErrorMsg('');

    // --- PANTRY FIRST LOGIC ---
    const customFoods: Food[] = localCache.customFoods || [];
    let localMatches = customFoods.filter(f => 
      f.name.toLowerCase().includes(query.toLowerCase())
    ).map((f, idx) => ({ ...f, isLocal: true, localIdx: idx }));
    
    if (highProteinOnly) {
      localMatches = localMatches.filter(f => (Number(f.p) || 0) >= 20);
    }

    setResults(localMatches);

    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      if (res.ok) {
        const body = await res.json();
        let apiResults: Food[] = (body.foods || []).map((f: any) => ({ ...f, isLocal: false }));
        
        if (highProteinOnly) {
          apiResults = apiResults.filter(f => (Number(f.p) || 0) >= 20);
        }

        setResults([...localMatches, ...apiResults]);
      } else {
        console.warn("Global results unavailable");
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      console.error("Search error:", err);
      if (localMatches.length === 0) {
        setErrorMsg("Global Search error. Please try again.");
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setSearching(false);
        abortControllerRef.current = null;
      }
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)', zIndex: 5000, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s' }}>
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '9px', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 9999 }}>v2.5-BG-HARDEN</div>
      
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '600px', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>ADD FOOD</h2>
          <div style={{ color: 'var(--theme-accent, #00C9FF)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px' }}>{meal}</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
      </div>

      {/* Scrollable Content Container */}
      <div style={{ flex: 1, width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', padding: '10px 20px 100px', gap: '24px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        
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
          
          {activeTab === 'search' || activeTab === 'ai-search' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (activeTab === 'search') handleStandardSearch(e);
                  else if (activeTab === 'ai-search') handleAISearch(e);
                }} 
                style={{ display: 'flex', gap: '8px' }}
              >
                <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                    placeholder={activeTab === 'search' ? "Search for foods, brands..." : "Describe food (e.g. '1/2 cup of blueberries')"}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    style={{ width: '100%', padding: '16px 16px 16px 44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', color: 'white', outline: 'none', fontSize: '15px' }}
                  />
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8b8b9b' }}>
                    {searching ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
                  </div>
                </div>
              </form>

              {activeTab === 'search' && (
                 <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                    <button 
                      onClick={() => setHighProteinOnly(!highProteinOnly)}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '10px', 
                        background: highProteinOnly ? 'rgba(146, 254, 157, 0.1)' : 'rgba(255,255,255,0.05)', 
                        border: '1px solid',
                        borderColor: highProteinOnly ? 'var(--theme-success)' : 'rgba(255,255,255,0.1)',
                        color: highProteinOnly ? 'var(--theme-success)' : 'rgba(255,255,255,0.4)',
                        fontSize: '11px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                      {highProteinOnly ? <Check size={12} /> : <div style={{width:12, height:12, borderRadius:'50%', border:'1px solid currentColor'}} />}
                      PROTEIN 20G+
                    </button>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>Filter Kitchen & Global results</span>
                 </div>
              )}

              {results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                  {results.map((f, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleAddFoodClick(f)} 
                      style={{ 
                        padding: '16px', 
                        background: 'rgba(0,0,0,0.4)', 
                        borderRadius: '20px', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        backdropFilter: 'blur(5px)'
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>{f.name}</div>
                          {f.brand && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', opacity: 0.6 }}>• {f.brand}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--theme-accent)', fontWeight: '700' }}>{f.cal} kcal</div>
                          <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)' }} />
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>P:{f.p}g C:{f.c}g F:{f.f}g</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         {f.isLocal && (
                            <button 
                               title="Remove from Kitchen"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Remove "${f.name}" from your Kitchen?`)) {
                                  const idx = (f as any).localIdx;
                                  if (typeof idx === 'number') {
                                    deleteCustomFood(idx);
                                    // Remove from immediate display
                                    setResults(prev => prev.filter((_, itemIdx) => itemIdx !== i));
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
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'describe' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--theme-accent, #00C9FF)' }}>
                    <Sparkles size={24} style={{ filter: 'drop-shadow(0 0 8px var(--theme-accent))' }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Analyze Meal Intelligence
                    </h3>
                  </div>

                  <button 
                    onClick={handleAIDescribe}
                    disabled={searching || !mealDesc.trim()}
                    style={{ 
                      width: '100%', 
                      padding: '16px', 
                      background: 'rgba(0, 201, 255, 0.1)', 
                      border: '1px solid var(--theme-accent, #00C9FF)', 
                      borderRadius: '16px', 
                      color: 'var(--theme-accent, #00C9FF)', 
                      fontWeight: '900', 
                      fontSize: '14px',
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '10px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0, 201, 255, 0.1)'
                    }}>
                    {searching ? <Loader2 className="spin" size={20} /> : <FileText size={20} />}
                    <span style={{ letterSpacing: '1px' }}>{searching ? 'ANALYZING...' : 'ANALYZE MEAL DESCRIPTION'}</span>
                  </button>

                  <textarea 
                    placeholder="Type your whole meal here... (e.g. '2 scrambled eggs and 1 piece of toast')"
                    value={mealDesc}
                    onChange={(e) => {
                      setMealDesc(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    style={{ 
                      width: '100%', 
                      minHeight: '140px', 
                      background: 'rgba(0,0,0,0.2)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '18px', 
                      padding: '18px', 
                      color: '#fff', 
                      fontSize: '15px', 
                      lineHeight: '1.6', 
                      outline: 'none', 
                      resize: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>
              </div>

              {/* AI Review Step */}
              {activeTab === 'describe' && isAiReviewing && aiStagedResults.length > 0 && (
                <div style={{ padding: '20px', background: 'rgba(0,180,255,0.03)', borderRadius: '24px', border: '1px solid rgba(0,180,255,0.15)', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="var(--theme-accent)" />
                      <span style={{ fontSize: '15px', fontWeight: '800' }}>REVIEW DETECTED MEAL</span>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '6px' }}>v2.2-QTY-FORCE</span>
                    </div>
                    </div>
                    <button onClick={() => { setIsAiReviewing(false); setAiStagedResults([]); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}><X size={18} /></button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {aiStagedResults.map((f, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>{f.name}</div>
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
                                borderRadius: '8px', padding: '4px 8px', fontSize: '9px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s'
                              }}>
                              DETAILS
                            </button>
                            <button onClick={() => {
                              const next = aiStagedResults.filter((_, idx) => idx !== i);
                              setAiStagedResults(next);
                              if (next.length === 0) setIsAiReviewing(false);
                            }} style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,0.6)', cursor: 'pointer' }}><X size={16} /></button>
                          </div>
                        </div>

                        {/* Nutritional Breakdown Inline - LIVE SCALING */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '12px' }}>
                          {(() => {
                            const currentQty = parseFloat(f.stagedQty) || 0;
                            const mult = computeMultiplier(f.serving || '100g', f.stagedUnit, currentQty);
                            return (
                              <>
                                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>KCAL</div><div style={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}>{Math.round((Number(f.cal) || 0) * mult)}</div></div>
                                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>P</div><div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--theme-success, #92FE9D)' }}>{((Number(f.p) || 0) * mult).toFixed(1)}g</div></div>
                                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>C</div><div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--theme-accent, #00C9FF)' }}>{((Number(f.c) || 0) * mult).toFixed(1)}g</div></div>
                                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>F</div><div style={{ fontSize: '12px', fontWeight: '900', color: '#FF6B6B' }}>{((Number(f.f) || 0) * mult).toFixed(1)}g</div></div>
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
                            style={{ width: '70px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '12px', padding: '8px', outline: 'none' }} 
                          />
                          <select 
                            value={f.stagedUnit} 
                            onChange={(e) => {
                              const next = [...aiStagedResults];
                              next[i] = { ...f, stagedUnit: e.target.value };
                              setAiStagedResults(next);
                            }}
                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '12px', padding: '8px', outline: 'none' }}>
                            {SERVING_UNITS.map(u => <option key={u.v} value={u.v} style={{ background: '#111' }}>{u.v}</option>)}
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfiguringFood(f);
                            }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                          >
                            <Info size={12} color="var(--theme-accent)" /> TWEAK INGREDIENT
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <button 
                      onClick={() => {
                        aiStagedResults.forEach(f => {
                           const mult = computeMultiplier(f.serving || '', f.stagedUnit || 'piece', parseFloat(f.stagedQty || '1') || 1);
                           const scaled = scaleLegacyFoodByAmount(f, mult);
                           saveCustomFood({
                             ...scaled,
                             id: crypto.randomUUID(),
                             isLocal: true,
                             sQty: parseFloat(f.stagedQty || '1'),
                             sUnit: f.stagedUnit || 'piece'
                           });
                        });
                        alert(`${aiStagedResults.length} items added to your Kitchen individually!`);
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
                      style={{ padding: '18px 5px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '18px', color: '#fff', fontWeight: '900', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Sparkles size={14} color="var(--theme-accent)" /> SAVE AS MEAL
                    </button>
                    
                    <button 
                      onClick={() => {
                        aiStagedResults.forEach(f => {
                          const mult = computeMultiplier(f.serving || '', f.stagedUnit || 'piece', parseFloat(f.stagedQty || '1') || 1);
                          const scaled = scaleLegacyFoodByAmount(f, mult);
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
          ) : activeTab === 'scan' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
              <BarcodeScanner 
                onScanSuccess={(result) => {
                  if (typeof result === 'object' && result !== null) {
                    // It's a nutrition label OR a successful barcode lookup result
                    setAiStagedResults([{ ...result, stagedQty: '1', stagedUnit: 'serving', showNutrientIntel: false }]);
                    setIsAiReviewing(true);
                    setActiveTab('describe');
                  } else {
                    // It's a raw barcode or QR code string
                    const displayQuery = typeof result === 'string' ? result : (result?.name || '');
                    setQuery(String(displayQuery));
                    if (displayQuery) {
                      handleStandardSearch({ preventDefault: () => {} } as React.FormEvent);
                    }
                    setActiveTab('search');
                  }
                }}
                onScanError={(err) => setErrorMsg(err)}
              />
              <p style={{ fontSize: '13px', color: '#8b8b9b', textAlign: 'center', maxWidth: '280px', lineHeight: '1.4' }}>
                Scans **Nutrition Labels**, **Barcodes**, and **QR Codes**. Take a clear photo for best results.
              </p>
            </div>
          ) : null}
        </div>

        {/* Persistent Staging Tray (Floating at Bottom) */}
        {stagingTray.length > 0 && (
          <div style={{ position: 'sticky', bottom: '-20px', background: 'rgba(10,30,33,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px 24px 0 0', padding: '24px', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', margin: '0 -20px', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Logging {stagingTray.length} items</div>
               <button onClick={clearTray} style={{ background: 'none', border: 'none', color: '#FF6B6B', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Clear All</button>
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
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(10,30,33,0.85)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.15)', padding: '24px 24px 60px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', backdropFilter: 'blur(25px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', fontWeight: '800', padding: 0, width: '100%', outline: 'none', marginBottom: '4px' }}
                  />
                  <div style={{ fontSize: '13px', color: '#8b8b9b' }}>Serving: {configuringFood.serving}</div>
                </div>
                <button onClick={() => setConfiguringFood(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Quick Macros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <QuickMacro label="Calories" val={Math.round((Number(configuringFood.cal)||0) * computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1))} unit="kcal" color="#fff" />
                <QuickMacro label="Protein" val={Math.round((Number(configuringFood.p)||0) * computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1))} unit="g" color="#00C9FF" />
                <QuickMacro label="Carbs" val={Math.round((Number(configuringFood.c)||0) * computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1))} unit="g" color="#FCC419" />
                <QuickMacro label="Fat" val={Math.round((Number(configuringFood.f)||0) * computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1))} unit="g" color="#FF6B6B" />
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
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Assign to Meal</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => (
                    <button
                      key={m}
                      onClick={() => setTargetMeal(m)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: targetMeal === m ? 'var(--theme-accent, #00C9FF)' : 'rgba(255,255,255,0.1)',
                        background: targetMeal === m ? 'rgba(0, 201, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                        color: targetMeal === m ? 'var(--theme-accent, #00C9FF)' : '#fff',
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
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', display: 'block', marginBottom: '6px' }}>AMOUNT</label>
                    <input 
                      type="number" 
                      value={servingQty}
                      onChange={(e) => {
                        const v = e.target.value;
                        const cleaned = (v.length > 1 && v.startsWith('0') && !v.startsWith('0.')) ? v.substring(1) : v;
                        setServingQty(cleaned);
                      }}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', display: 'block', marginBottom: '6px' }}>UNIT</label>
                    <select 
                      value={servingUnit}
                      onChange={(e) => setServingUnit(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }}>
                      {SERVING_UNITS.map(u => <option key={u.v} value={u.v}>{u.v}</option>)}
                    </select>
                  </div>
                </div>

                {/* Save to Pantry Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" checked={saveToPantry} onChange={() => setSaveToPantry(!saveToPantry)} />
                  <label style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>ADD TO KITCHEN</label>
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
                  style={{ width: '100%', padding: '16px', background: 'var(--theme-success, #92FE9D)', color: '#000', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(146,254,157,0.2)' }}>
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
                  style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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

const QuickMacro = ({ label, val, unit, color }: any) => (
  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 4px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
    <div style={{ fontSize: '9px', color: '#8b8b9b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '15px', color: color, fontWeight: '900' }}>{val}<span style={{ fontSize: '10px', fontWeight: '600', marginLeft: '1px' }}>{unit}</span></div>
  </div>
);

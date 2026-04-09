import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useDiary } from '../context/DiaryContext';
import { ALL_MICRO_KEYS, MICRO_UNITS, SERVING_UNITS } from '../lib/constants';
import type { Food } from '../types/food';
import { computeMultiplier, scaleLegacyFoodByAmount } from '../lib/food/serving-converter';
import { 
  Search, Sparkles, Plus, Check, 
  X, Loader2, Info, FileText
} from 'lucide-react';
import { ScannerModal } from './ScannerModal';
import { SearchCoaster, type SearchTab } from './SearchCoaster';
import { getNutrientDescriptions } from '../lib/nutrient-info';

interface AddFoodModalProps {
  meal: string;
  onClose: () => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({ meal, onClose }) => {
  const { 
    localCache, addFoodLog, saveCustomFood, 
    stagingTray, addToTray, clearTray 
  } = useDiary();
  
  const [activeTab, setActiveTab] = useState<SearchTab>('search');
  const [activeScanner, setActiveScanner] = useState<SearchTab | null>(null);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [aiStagedResults, setAiStagedResults] = useState<any[]>([]);
  const [isAiReviewing, setIsAiReviewing] = useState(false);

  const clearSearchState = () => {
    setQuery('');
    setResults([]);
    setErrorMsg('');
  };
  
  const [mealDesc, setMealDesc] = useState('');
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
    setServingQty('1');
    setServingUnit(food.sUnit || 'serving');
    setShowFullNutrition(false);
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
          ...configuringFood,
          name: editName || configuringFood.name,
          p: Number(configuringFood.p) || 0,
          c: Number(configuringFood.c) || 0,
          f: Number(configuringFood.f) || 0,
          cal: Number(configuringFood.cal) || 0,
          serving: `${qty} ${servingUnit}`,
          sQty: qty,
          sUnit: servingUnit
        });
      }

      addToTray(scaledFood);
      setConfiguringFood(null);
    }
  };

  const handleStandardSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = await res.json();
        setResults(body.foods || body.results || []);
      } else {
        throw new Error('API down');
      }
    } catch (err) {
      setErrorMsg("Global Search error. Please try again.");
    }
    setSearching(false);
  };

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    try {
      const res = await fetch('/api/ai-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const body = await res.json();
      setResults(body.foods || []);
    } catch (err) {
      setErrorMsg("AI Lookup failed.");
    }
    setSearching(false);
  };

  const handleAIDescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealDesc) return;
    setSearching(true);
    setAiStagedResults([]);
    try {
      const res = await fetch('/api/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: mealDesc })
      });
      const body = await res.json();
      const detected = body.foods || [];
      setAiStagedResults(detected.map((f: any) => ({ ...f, stagedQty: '1', stagedUnit: f.sUnit || 'serving' })));
      setIsAiReviewing(true);
    } catch (err) {
      setErrorMsg("AI Parsing failed.");
    }
    setSearching(false);
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 5000, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s' }}>
      
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '600px', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>ADD FOOD</h2>
          <div style={{ color: 'var(--theme-accent, #00C9FF)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px' }}>{meal}</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
      </div>

      <div style={{ flex: 1, width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', padding: '10px 20px 40px', gap: '24px', overflowY: 'auto' }}>
        
        <SearchCoaster 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            clearSearchState();
            setMealDesc('');
            if (tab === 'barcode' || tab === 'label' || tab === 'pantry') {
              if (tab === 'pantry') { 
                 setActiveTab(tab); 
              } else {
                 setActiveScanner(tab);
              }
            } else {
              setActiveTab(tab);
            }
          }} 
        />

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--theme-error)', fontSize: '12px', marginBottom: '8px', textAlign: 'center' }}>{errorMsg}</div>
          
          {activeTab === 'search' || activeTab === 'ai-search' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <form onSubmit={activeTab === 'search' ? handleStandardSearch : handleAISearch} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                    placeholder={activeTab === 'search' ? "Search for foods, brands..." : "Describe food (e.g. '1/2 cup of blueberries')"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ width: '100%', padding: '16px 16px 16px 44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', color: 'white', outline: 'none', fontSize: '15px' }}
                  />
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8b8b9b' }}>
                    {searching ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
                  </div>
                </div>
              </form>

              {results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {results.map((f, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleAddFoodClick(f)} 
                      style={{ 
                        padding: '16px', 
                        background: 'rgba(255,255,255,0.04)', 
                        borderRadius: '20px', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        cursor: 'pointer', 
                        transition: 'transform 0.2s, background 0.2s',
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>{f.name}</div>
                          {f.brand && <div style={{ fontSize: '10px', color: '#8b8b9b', opacity: 0.6 }}>• {f.brand}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--theme-accent)', fontWeight: '700' }}>{f.cal} kcal</div>
                          <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)' }} />
                          <div style={{ fontSize: '10px', color: '#8b8b9b', fontWeight: '600' }}>P:{f.p}g C:{f.c}g F:{f.f}g</div>
                        </div>
                      </div>
                      <Plus size={20} color="var(--theme-accent, #00C9FF)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'describe' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--theme-accent, #00C9FF)" /> Describe your meal
                </h3>
                <textarea 
                  placeholder="e.g. 'I had two slices of pizza and a small garden salad with ranch dressing'"
                  value={mealDesc}
                  onChange={(e) => setMealDesc(e.target.value)}
                  style={{ width: '100%', minHeight: '120px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', color: '#fff', fontSize: '14px', lineHeight: '1.5', outline: 'none', resize: 'none' }}
                />
                <button 
                  onClick={handleAIDescribe}
                  disabled={searching || !mealDesc.trim()}
                  style={{ width: '100%', marginTop: '16px', padding: '14px', background: 'var(--theme-accent, #00C9FF)', color: '#000', borderRadius: '14px', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {searching ? <Loader2 className="spin" size={20} /> : <FileText size={20} />}
                  Analyze Meal
                </button>
              </div>

              {/* AI Review Step */}
              {isAiReviewing && aiStagedResults.length > 0 && (
                <div style={{ padding: '20px', background: 'rgba(0,180,255,0.05)', borderRadius: '24px', border: '1px solid rgba(0,180,255,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="var(--theme-accent)" /> REVIEW DETECTED MEAL
                    </div>
                    <button onClick={() => { setIsAiReviewing(false); setAiStagedResults([]); }} style={{ background: 'none', border: 'none', color: '#8b8b9b', cursor: 'pointer' }}><X size={18} /></button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {aiStagedResults.map((f, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff' }}>{f.name}</div>
                          <button onClick={() => {
                            const next = aiStagedResults.filter((_, idx) => idx !== i);
                            setAiStagedResults(next);
                            if (next.length === 0) setIsAiReviewing(false);
                          }} style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer' }}><X size={14} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="number" 
                            value={f.stagedQty} 
                            onChange={(e) => {
                              const next = [...aiStagedResults];
                              next[i] = { ...f, stagedQty: e.target.value };
                              setAiStagedResults(next);
                            }}
                            style={{ width: '50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '11px', padding: '4px' }} 
                          />
                          <select 
                            value={f.stagedUnit} 
                            onChange={(e) => {
                              const next = [...aiStagedResults];
                              next[i] = { ...f, stagedUnit: e.target.value };
                              setAiStagedResults(next);
                            }}
                            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '11px', padding: '4px' }}>
                            {SERVING_UNITS.map(u => <option key={u.v} value={u.v}>{u.v}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      aiStagedResults.forEach(f => {
                        const mult = computeMultiplier(f.serving || '', f.stagedUnit, parseFloat(f.stagedQty) || 1);
                        const scaled = scaleLegacyFoodByAmount(f, mult);
                        addToTray(scaled);
                      });
                      setIsAiReviewing(false);
                      setAiStagedResults([]);
                    }}
                    style={{ width: '100%', padding: '14px', background: 'var(--theme-accent)', border: 'none', borderRadius: '14px', color: '#000', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Check size={18} /> CONFIRM DETECTED MEAL
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'pantry' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {localCache.customFoods?.map((f: any, i: number) => (
                    <div key={i} onClick={() => handleAddFoodClick(f)} style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                        <div style={{ fontWeight: '700', color: '#fff' }}>{f.name}</div>
                        <div style={{ fontSize: '11px', color: '#8b8b9b' }}>{f.cal} kcal • P:{f.p}g C:{f.c}g F:{f.f}g</div>
                    </div>
                  ))}
                </div>
          ) : null}
        </div>

        {/* Persistent Staging Tray (Floating at Bottom) */}
        {stagingTray.length > 0 && (
          <div style={{ position: 'sticky', bottom: '-20px', background: 'var(--theme-bg, #0B0B14)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px 24px 0 0', padding: '24px', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', margin: '0 -20px' }}>
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
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', zIndex: 6000 }}>
            <div style={{ width: '100%', background: 'var(--theme-bg, #0B0B14)', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', display: 'block', marginBottom: '6px' }}>AMOUNT</label>
                    <input 
                      type="number" 
                      value={servingQty}
                      onChange={(e) => setServingQty(e.target.value)}
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
                  <label style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>Save to My Pantry</label>
                </div>

                <div onClick={() => setShowFullNutrition(!showFullNutrition)} style={{ textAlign: 'center', fontSize: '13px', color: 'var(--theme-accent)', cursor: 'pointer', fontWeight: '700' }}>
                   {showFullNutrition ? 'Hide Details' : 'View Detailed Nutrition Intelligence'}
                </div>

                {showFullNutrition && (
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <NutritionFactsDisplay food={configuringFood} multiplier={computeMultiplier(configuringFood.serving||'', servingUnit, parseFloat(servingQty)||1)} />
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

      {activeScanner && (
        <ScannerModal 
          type={activeScanner as any} 
          onClose={() => setActiveScanner(null)} 
          onResult={(data) => {
            handleAddFoodClick(data);
            setActiveScanner(null);
          }} 
        />
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

const NutritionFactsDisplay = ({ food, multiplier }: { food: any, multiplier: number }) => {
  const descriptions = getNutrientDescriptions();
  const micros = ALL_MICRO_KEYS.filter(k => (Number(food[k]) || 0) > 0);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--theme-accent)', letterSpacing: '1px', textTransform: 'uppercase' }}>Vitamins & Minerals</div>
      {micros.map(k => {
        const val = (Number(food[k]) || 0) * multiplier;
        const benefit = descriptions[k] || descriptions[k.toLowerCase()];
        return (
          <NutrientRow key={k} label={k} value={val} unit={MICRO_UNITS[k] || 'mg'} benefit={benefit} />
        );
      })}
    </div>
  );
};

const NutrientRow = ({ label, value, unit, benefit }: any) => {
  const [showBenefit, setShowBenefit] = useState(false);
  return (
    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', fontSize: '12px', color: '#fff' }}>{label}</span>
          {benefit && (
            <button onClick={() => setShowBenefit(!showBenefit)} style={{ background: 'none', border: 'none', color: '#5b5b6b', cursor: 'pointer' }}>
              <Info size={14} />
            </button>
          )}
        </div>
        <span style={{ fontWeight: '800', fontSize: '12px', color: 'var(--theme-accent)' }}>{value.toFixed(value < 1 ? 2 : 1)}{unit}</span>
      </div>
      {showBenefit && benefit && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#8b8b9b', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
          {benefit.summary}
        </div>
      )}
    </div>
  );
};

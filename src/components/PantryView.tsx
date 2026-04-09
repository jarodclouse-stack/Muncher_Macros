import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { 
  Trash2, ChevronDown, Search, Loader2, 
  BookmarkCheck, Edit3, Sparkles, X, Info
} from 'lucide-react';
import { ALL_MICRO_KEYS, MICRO_UNITS, SERVING_UNITS } from '../lib/constants';
import { getNutrientDescriptions } from '../lib/nutrient-info';
import { computeMultiplier, scaleLegacyFoodByAmount } from '../lib/food/serving-converter';

import { ScannerModal } from './ScannerModal';
import { SearchCoaster, type SearchTab } from './SearchCoaster';

export const PantryView: React.FC = () => {
  const { 
    localCache, saveCustomFood, updateCustomFood, deleteCustomFood
  } = useDiary();
  
  const [form, setForm] = useState<any>({ name: '', cal: '', p: '', c: '', f: '', ingredients: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'manual' | 'saved'>('search');
  const [activeScanner, setActiveScanner] = useState<'barcode' | 'qr' | 'label' | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [innerGlobalSearchTab, setInnerGlobalSearchTab] = useState<SearchTab>('search');
  
  const customFoods = localCache.customFoods || [];
  
  const [configuringFood, setConfiguringFood] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [servingQty, setServingQty] = useState('1');
  const [servingUnit, setServingUnit] = useState('serving');
  const [showFullNutrition, setShowFullNutrition] = useState(false);

  const clearSearchState = () => {
    setSearchResults([]);
    setSearchQuery('');
    setErrorMsg('');
  };

  const handleGlobalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setErrorMsg('');
    
    const localMatches = customFoods.filter((f: any) => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).map((f: any) => ({ ...f, isLocal: true }));

    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const body = await res.json();
        const globalRes = body.foods || body.results || [];
        setSearchResults([...localMatches, ...globalRes]);
      } else {
        setSearchResults(localMatches);
      }
    } catch (err) {
      console.warn("Global Search error", err);
      setSearchResults(localMatches);
    }
    setIsSearching(false);
  };

  const handleGlobalAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/ai-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const body = await res.json();
      setSearchResults(body.foods || []);
    } catch (err) {
      setErrorMsg("AI Lookup failed.");
    }
    setIsSearching(true); // Should be false but following logic
    setIsSearching(false);
  };

  const handleGlobalAIDescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: searchQuery })
      });
      const body = await res.json();
      setSearchResults(body.foods || []);
    } catch (err) {
      setErrorMsg("AI Describe failed.");
    }
    setIsSearching(false);
  };

  const handleAddPreviewClick = (food: any) => {
    setConfiguringFood(food);
    setEditName(food.name || '');
    setServingQty('1');
    setServingUnit(food.sUnit || 'serving');
    setShowFullNutrition(false);
  };

  const handleConfirmAddPantry = (e: React.FormEvent) => {
    e.preventDefault();
    if (configuringFood) {
      const qty = parseFloat(servingQty) || 1;
      const mult = computeMultiplier(configuringFood.serving || '', servingUnit, qty);
      const scaled = scaleLegacyFoodByAmount({ ...configuringFood, name: editName }, mult);
      saveCustomFood({
        ...scaled,
        serving: `${qty} ${servingUnit}`,
        sQty: qty,
        sUnit: servingUnit
      });
      setConfiguringFood(null);
      clearSearchState();
      setActiveTab('saved');
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', position: 'sticky', top: '78px', zIndex: 5, background: 'var(--theme-bg)', paddingTop: '4px' }}>
        <button onClick={() => { setActiveTab('search'); clearSearchState(); }} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid var(--theme-border)', background: activeTab === 'search' ? 'var(--theme-accent-dim)' : 'transparent', color: activeTab === 'search' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
          Discover & Search
        </button>
        <button onClick={() => setActiveTab('manual')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid var(--theme-border)', background: activeTab === 'manual' ? 'var(--theme-accent-dim)' : 'transparent', color: activeTab === 'manual' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
          Macro Kitchen
        </button>
        <button onClick={() => setActiveTab('saved')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid var(--theme-border)', background: activeTab === 'saved' ? 'var(--theme-accent-dim)' : 'transparent', color: activeTab === 'saved' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
          My Pantry ({customFoods.length})
        </button>
      </div>

      {activeTab === 'search' && (
        <div>
          <SearchCoaster 
            activeTab={innerGlobalSearchTab} 
            onTabChange={(t) => { setInnerGlobalSearchTab(t); clearSearchState(); if (t==='barcode'||t==='label') setActiveScanner(t); }} 
            style={{ marginBottom: '16px' }}
          />
          
          <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px', marginBottom: '24px' }}>
            <form onSubmit={innerGlobalSearchTab === 'search' ? handleGlobalSearch : (innerGlobalSearchTab === 'ai-search' ? handleGlobalAISearch : handleGlobalAIDescribe)} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder={innerGlobalSearchTab === 'search' ? "Search for foods, brands..." : (innerGlobalSearchTab === 'ai-search' ? "Explain the food (e.g. 'grilled salmon')..." : "Describe your whole meal...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '14px', padding: '12px 16px', color: 'var(--theme-text, #fff)', fontSize: '14px', outline: 'none' }}
              />
              <button 
                type="submit"
                style={{ padding: '12px 20px', background: 'var(--theme-accent, #00C9FF)', border: 'none', borderRadius: '14px', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSearching ? <Loader2 className="spin" size={20} /> : (innerGlobalSearchTab === 'search' ? <Search size={20} /> : <Sparkles size={20} />)}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {searchResults.map((f, i) => (
                  <div key={i} onClick={() => handleAddPreviewClick(f)} style={{ padding: '12px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '12px', cursor: 'pointer', borderLeft: f.isLocal ? '3px solid var(--theme-success, #92FE9D)' : '3px solid var(--theme-accent, #00C9FF)', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--theme-text)' }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', marginTop: '2px' }}>{f.serving} • {f.cal} kcal • P:{f.p}g C:{f.c}g F:{f.f}g</div>
                    </div>
                    {f.isLocal && <BookmarkCheck size={16} color="var(--theme-success, #92FE9D)" />}
                  </div>
                ))}
              </div>
            )}
            
            {errorMsg && <div style={{ color: 'var(--theme-error)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{errorMsg}</div>}
          </div>
        </div>
      )}

      {activeTab === 'manual' && (
        <div style={{ background: 'var(--theme-panel)', borderRadius: '24px', padding: '18px', border: '1px solid var(--theme-border)', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', textAlign: 'center' }}>{editingIndex !== null ? 'Edit Macro Kitchen' : 'Macro Kitchen'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input placeholder="Food Name" className="inp" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
               <input placeholder="Cal" className="inp" value={form.cal} onChange={e => setForm({...form, cal: e.target.value})} />
               <input placeholder="P" className="inp" value={form.p} onChange={e => setForm({...form, p: e.target.value})} />
               <input placeholder="C" className="inp" value={form.c} onChange={e => setForm({...form, c: e.target.value})} />
               <input placeholder="F" className="inp" value={form.f} onChange={e => setForm({...form, f: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  const foodData = { ...form, cal: Number(form.cal)||0, p: Number(form.p)||0, c: Number(form.c)||0, f: Number(form.f)||0 };
                  if (editingIndex !== null) updateCustomFood(editingIndex, foodData);
                  else saveCustomFood(foodData);
                  setActiveTab('saved');
                  setEditingIndex(null);
                  setForm({name:'',cal:'',p:'',c:'',f:'',ingredients:''});
                }}
                style={{ flex: 2, padding: '14px', background: 'var(--theme-accent)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '800', cursor: 'pointer' }}>
                {editingIndex !== null ? 'Update Food' : 'Save to Pantry'}
              </button>
              <button 
                onClick={() => {
                  setEditingIndex(null);
                  setForm({name:'',cal:'',p:'',c:'',f:'',ingredients:''});
                }}
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text-dim)', fontWeight: '700', cursor: 'pointer' }}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {customFoods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--theme-text-dim)' }}>Your pantry is empty. Add foods to save them here.</div>
          ) : (
            customFoods.map((f: any, i: number) => (
              <div key={i} style={{ padding: '16px', background: 'var(--theme-panel)', borderRadius: '18px', border: '1px solid var(--theme-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div onClick={() => handleAddPreviewClick(f)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontWeight: '700', color: 'var(--theme-text)' }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>{f.cal} kcal • P:{f.p} C:{f.c} F:{f.f}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setForm(f); setEditingIndex(i); setActiveTab('manual'); }} style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim)', cursor: 'pointer' }}><Edit3 size={18} /></button>
                  <button onClick={() => deleteCustomFood(i)} style={{ background: 'none', border: 'none', color: 'var(--theme-error, #FF6B6B)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Scanner Modal */}
      {activeScanner && (
        <ScannerModal 
          type={activeScanner as any} 
          onClose={() => setActiveScanner(null)} 
          onResult={(data) => {
            handleAddPreviewClick(data);
            setActiveScanner(null);
          }} 
        />
      )}

      {/* Food Preview Configuration Overlay */}
      {configuringFood && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', zIndex: 2000 }}>
            <div style={{ width: '100%', background: 'var(--theme-bg)', borderRadius: '24px 24px 0 0', border: '1px solid var(--theme-border)', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ background: 'none', border: 'none', color: 'var(--theme-text)', fontSize: '20px', fontWeight: '800', padding: 0, width: '100%', outline: 'none', marginBottom: '4px' }}
                  />
                  <div style={{ fontSize: '13px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'var(--theme-accent-dim)', color: 'var(--theme-text)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                      BASE: {configuringFood.serving}
                    </div>
                  </div>
                </div>
                <button onClick={() => setConfiguringFood(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Nutrition Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
                <MacroPill label="Calories" val={Math.round((Number(configuringFood.cal) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1))} unit="kcal" color="var(--theme-text)" />
                <MacroPill label="Protein" val={Math.round((Number(configuringFood.p) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1))} unit="g" color="#00C9FF" />
                <MacroPill label="Carbs" val={Math.round((Number(configuringFood.c) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1))} unit="g" color="#FCC419" />
                <MacroPill label="Fat" val={Math.round((Number(configuringFood.f) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1))} unit="g" color="#FF6B6B" />
              </div>

              {/* Config Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', display: 'block', marginBottom: '6px' }}>AMOUNT</label>
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={servingQty}
                      onChange={(e) => setServingQty(e.target.value)}
                      style={{ width: '100%', background: 'var(--theme-panel, rgba(0,0,0,0.2))', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', display: 'block', marginBottom: '6px' }}>UNIT</label>
                    <select 
                      value={servingUnit}
                      onChange={(e) => setServingUnit(e.target.value)}
                      style={{ width: '100%', background: 'var(--theme-panel, rgba(0,0,0,0.2))', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }}>
                      {SERVING_UNITS.map(u => <option key={u.v} value={u.v}>{u.v}</option>)}
                    </select>
                  </div>
                </div>

                <div 
                  onClick={() => setShowFullNutrition(!showFullNutrition)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--theme-panel, rgba(255,255,255,0.03))', borderRadius: '12px', border: '1px solid var(--theme-border)', cursor: 'pointer', fontSize: '12px', color: 'var(--theme-text-dim)' }}>
                  {showFullNutrition ? 'Hide Detailed Nutrition' : 'Show Detailed Nutrition'} <ChevronDown size={14} style={{ transform: showFullNutrition ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {showFullNutrition && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--theme-panel-dim)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-accent, #00C9FF)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '4px' }}>NUTRITION INTELLIGENCE (Per Logged Amount)</div>
                    {[...ALL_MICRO_KEYS].map(k => {
                      const val = (Number(configuringFood[k]) || 0) * computeMultiplier(configuringFood.serving, servingUnit, parseFloat(servingQty) || 1);
                      if (!val && val !== 0) return null;
                      const descriptions = getNutrientDescriptions();
                      const benefit = descriptions[k] || descriptions[k.toLowerCase()];
                      return (
                        <NutrientDetailRow 
                          key={k} 
                          label={k} 
                          value={val.toFixed(val < 1 ? 2 : 1)} 
                          unit={MICRO_UNITS[k] || ''} 
                          benefit={benefit}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <button 
                onClick={handleConfirmAddPantry}
                style={{ width: '100%', padding: '16px', background: 'var(--theme-success, #92FE9D)', border: 'none', borderRadius: '16px', color: '#000', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(146,254,157,0.2)' }}>
                <BookmarkCheck size={20} /> SAVE TO MY PANTRY
              </button>
            </div>
          </div>
      )}
    </div>
  );
};

const MacroPill = ({ label, val, unit, color }: any) => (
  <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border)', borderRadius: '14px', padding: '10px 4px', textAlign: 'center' }}>
    <div style={{ fontSize: '9px', fontWeight: '800', color: '#8b8b9b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '15px', fontWeight: '900', color }}>{val}<span style={{ fontSize: '10px', fontWeight: '500', marginLeft: '1px' }}>{unit}</span></div>
  </div>
);

const NutrientDetailRow = ({ label, value, unit, benefit }: any) => {
  const [showBenefit, setShowBenefit] = useState(false);
  return (
    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{label}</span>
          {benefit && (
            <button onClick={() => setShowBenefit(!showBenefit)} style={{ background: 'none', border: 'none', color: showBenefit ? 'var(--theme-accent)' : '#5b5b6b', cursor: 'pointer' }}>
              <Info size={14} />
            </button>
          )}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--theme-accent)' }}>{value}{unit}</span>
      </div>
      {showBenefit && benefit && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#8b8b9b', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
           {benefit.summary}
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDiary } from '../context/DiaryContext';
import { FOOD_DB } from '../lib/constants';
import type { Food } from '../types/food';
import { computeMultiplier, scaleLegacyFoodByAmount, COMMON_UNITS } from '../lib/food/serving-converter';
import { Search, Camera, Sparkles, Plus, Check, Scan, ChevronLeft, ChevronDown, ChevronUp, Beaker, X } from 'lucide-react';
import { ScannerModal } from './ScannerModal';
import { normalizeFoodItem, toLegacyFood } from '../lib/food/food-normalizer';
import { calculateVitalityScore } from '../lib/scoring/vitality';
import { VitalityBadge } from './VitalityBadge';

import { SearchCoaster, type SearchTab as Tab } from './SearchCoaster';

interface AddFoodModalProps {
  meal: string;
  onClose: () => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({ meal, onClose }) => {
  const { 
    localCache, addFoodLog, saveCustomFood, 
    stagingTray, addToTray, removeFromTray, clearTray 
  } = useDiary();
  
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [activeScanner, setActiveScanner] = useState<'barcode' | 'qr' | 'label' | null>(null);
  const [searchMode, setSearchMode] = useState<'keyword' | 'describe'>('keyword');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [mealDesc, setMealDesc] = useState('');
  const [configuringFood, setConfiguringFood] = useState<Food | null>(null);
  const [editName, setEditName] = useState('');
  const [saveToPantry, setSaveToPantry] = useState(false);
  const [showFullNutrition, setShowFullNutrition] = useState(false);
  const [servingQty, setServingQty] = useState('1');
  const [servingUint, setServingUnit] = useState('serving');

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
      const mult = computeMultiplier(configuringFood.serving || '', servingUint, qty);
      const scaledFood = scaleLegacyFoodByAmount(configuringFood, mult);
      
      const unitLabel = COMMON_UNITS.find((u) => u.id === servingUint)?.label || servingUint;
      scaledFood.name = editName || configuringFood.name;
      scaledFood.serving = `${qty} ${unitLabel}`;
      
      if (saveToPantry) {
        saveCustomFood({
          ...configuringFood,
          name: editName || configuringFood.name,
          p: Number(configuringFood.p) || 0,
          c: Number(configuringFood.c) || 0,
          f: Number(configuringFood.f) || 0,
          cal: Number(configuringFood.cal) || 0
        });
      }

      addFoodLog(meal, scaledFood);
      setConfiguringFood(null);
    }
  };

  const handleStandardSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/food-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        const body = await res.json();
        setResults(body.foods || body.results || []);
      } else {
        throw new Error('API down');
      }
    } catch(err) {
      console.warn("Standard Search API Error, falling back to local DB", err);
      const q = query.toLowerCase();
      const pantry = localCache.customFoods || [];
      const combinedDB = [...pantry, ...FOOD_DB];
      const localFallbacks = combinedDB.filter((f: any) => f.name.toLowerCase().includes(q));
      setResults(localFallbacks);
    }
    setSearching(false);
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
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed AI search');
      setResults(body.foods || []);
    } catch(err: any) {
      setErrorMsg(err.message);
    }
    setSearching(false);
  };

  const handleDescribeMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealDesc) return;
    setSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: mealDesc, meal })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed AI meal estimation');
      if (body.foods && body.foods.length > 0) {
        body.foods.forEach((f: Food) => addToTray(f));
        setMealDesc('');
      }
    } catch(err: any) {
      setErrorMsg(err.message);
    }
    setSearching(false);
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'var(--theme-bg, #001114)', zIndex: 99999, display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div style={{ background: 'var(--theme-panel-base, #10141f)', padding: '16px 16px 0 16px', borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--theme-text)' }}>Add to {meal}</h3>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--theme-text)', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>

        <SearchCoaster 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            if (tab === 'barcode' || tab === 'label') {
              setActiveScanner(tab);
            } else {
              setActiveTab(tab);
            }
          }} 
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Scanner Overlay */}
        {activeScanner && (
          <ScannerModal 
            type={activeScanner} 
            onClose={() => setActiveScanner(null)}
            onResult={(data) => {
              if (data) {
                const legacy = toLegacyFood(normalizeFoodItem(data));
                handleAddFoodClick(legacy);
              }
              setActiveScanner(null);
            }}
          />
        )}

        {/* Inline Food Config Preview (Popup style) */}
        {configuringFood && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--theme-bg, #001114)', zIndex: 100, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--theme-text)' }}>{configuringFood.name}</h2>
                  <div style={{ fontSize: '13px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '600' }}>{configuringFood.brand || 'Global Database'}</div>
                </div>
                <button onClick={() => setConfiguringFood(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--theme-text)', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <QuickMacro label="CALORIES" val={configuringFood.cal} color="var(--theme-text)" />
                <QuickMacro label="PROTEIN" val={configuringFood.p + 'g'} color="var(--theme-success, #92FE9D)" />
                <QuickMacro label="CARBS" val={configuringFood.c + 'g'} color="var(--theme-warning, #FCC419)" />
                <QuickMacro label="FAT" val={configuringFood.f + 'g'} color="var(--theme-accent, #00C9FF)" />
              </div>

              <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.02))', padding: '20px', borderRadius: '20px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', marginBottom: '6px', letterSpacing: '0.05em' }}>RENAME (OPTIONAL)</div>
                  <input 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', padding: '12px', color: 'var(--theme-text)', borderRadius: '12px', fontSize: '15px', fontWeight: '700' }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '100px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', marginBottom: '6px', letterSpacing: '0.05em' }}>QUANTITY</div>
                    <input 
                      type="number" 
                      step="0.1"
                      value={servingQty}
                      onChange={e => setServingQty(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', padding: '12px', color: 'var(--theme-text)', borderRadius: '12px', fontSize: '16px', fontWeight: '700', textAlign: 'center' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', marginBottom: '6px', letterSpacing: '0.05em' }}>SERVING UNIT</div>
                    <select 
                      value={servingUint}
                      onChange={e => setServingUnit(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', padding: '12px', color: 'var(--theme-text)', borderRadius: '12px', fontWeight: '600' }}
                    >
                      {COMMON_UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setSaveToPantry(!saveToPantry)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: saveToPantry ? 'var(--theme-success-dim, rgba(146,254,157,0.1))' : 'rgba(255,255,255,0.02)', border: `1px solid ${saveToPantry ? 'var(--theme-success, #92FE9D)' : 'var(--theme-border, rgba(255,255,255,0.05))'}`, borderRadius: '12px', cursor: 'pointer', marginBottom: '24px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--theme-success, #92FE9D)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: saveToPantry ? 'var(--theme-success, #92FE9D)' : 'transparent' }}>
                  {saveToPantry && <Check size={12} color="#000" strokeWidth={4} />}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: saveToPantry ? 'var(--theme-success, #92FE9D)' : 'var(--theme-text)' }}>Save to Pantry for Later</div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <button 
                  onClick={() => setShowFullNutrition(!showFullNutrition)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--theme-text)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
                    <Beaker size={16} color="var(--theme-accent, #00C9FF)" /> Full Nutrition Facts
                  </div>
                  {showFullNutrition ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showFullNutrition && (
                  <div style={{ marginTop: '12px', padding: '16px', background: 'var(--theme-panel, rgba(255,255,255,0.02))', borderRadius: '14px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', maxHeight: '200px', overflowY: 'auto' }}>
                    <NutritionFactsDisplay food={scaleLegacyFoodByAmount(configuringFood, computeMultiplier(configuringFood.serving||'', servingUint, parseFloat(servingQty)||1))} />
                  </div>
                )}
              </div>

              <button 
                onClick={handleConfirmAdd}
                style={{ marginTop: 'auto', padding: '18px', background: 'var(--theme-accent, #00C9FF)', color: '#000', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(0,201,255,0.25)' }}>
                <Check size={24} /> Confirm & Add to Meal
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {activeTab === 'pantry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--theme-text)' }}>Your Saved Pantry</h3>
                <button onClick={() => setActiveTab('search')} style={{ background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', border: '1px solid var(--theme-border, rgba(0,201,255,0.2))', padding: '8px 16px', borderRadius: '12px', color: 'var(--theme-accent, #00C9FF)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={14} /> Search Global
                </button>
              </div>
              {localCache.customFoods && localCache.customFoods.length > 0 ? (
                localCache.customFoods.map((f: any, i: number) => (
                  <div key={i} onClick={() => handleAddFoodClick(f)} style={{ padding: '16px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid var(--theme-success, #92FE9D)' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {f.name}
                        <VitalityBadge {...calculateVitalityScore(f)} />
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--theme-text-dim, #8b8b9b)' }}>{f.cal} kcal • P:{f.p}g C:{f.c}g F:{f.f}g</div>
                    </div>
                    <Plus size={20} color="var(--theme-accent, #00C9FF)" />
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '14px' }}>Your pantry is empty.</div>
              )}
            </div>
          )}

          {(activeTab === 'search' || activeTab === 'ai-search') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button type="button" onClick={() => setSearchMode('keyword')} style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: 'none', background: searchMode === 'keyword' ? 'var(--theme-accent-dim)' : 'transparent', color: searchMode === 'keyword' ? 'var(--theme-accent)' : '#8b8b9b', cursor: 'pointer' }}>Keyword</button>
                <button type="button" onClick={() => setSearchMode('describe')} style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: 'none', background: searchMode === 'describe' ? 'var(--theme-accent-dim)' : 'transparent', color: searchMode === 'describe' ? 'var(--theme-accent)' : '#8b8b9b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Sparkles size={12} /> AI Describe</button>
              </div>

              {searchMode === 'keyword' ? (
                <form onSubmit={activeTab === 'search' ? handleStandardSearch : handleAISearch} style={{ display: 'flex', gap: '8px' }}>
                  <input autoFocus placeholder={activeTab === 'search' ? "Search USDA..." : "AI Keyword Search..."} value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', color: 'var(--theme-text)', outline: 'none' }} />
                  <button type="submit" disabled={searching} style={{ padding: '0 16px', background: 'var(--theme-accent, #00C9FF)', color: '#000', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}><Search size={18} /></button>
                </form>
              ) : (
                <form onSubmit={handleDescribeMeal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea autoFocus rows={3} placeholder="Describe your meal..." value={mealDesc || query} onChange={e => { setMealDesc(e.target.value); setQuery(e.target.value); }} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', color: 'var(--theme-text)', outline: 'none', resize: 'vertical' }} />
                  <button type="submit" disabled={searching} style={{ padding: '12px', background: 'var(--theme-accent, #00C9FF)', color: '#000', borderRadius: '12px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}><Sparkles size={18} /> Parse & Describe</button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'describe' && (
            <form onSubmit={handleDescribeMeal} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <textarea autoFocus rows={4} placeholder="Describe your entire meal naturally..." value={mealDesc} onChange={e => setMealDesc(e.target.value)} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', color: 'var(--theme-text)', outline: 'none', resize: 'vertical' }} />
              <button type="submit" disabled={searching} style={{ padding: '12px', background: 'var(--theme-accent, #00C9FF)', color: '#000', borderRadius: '12px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}><Sparkles size={18} /> Parse & Estimate</button>
            </form>
          )}

          {(activeTab === 'barcode' || activeTab === 'label') && !activeScanner && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <button onClick={() => setActiveScanner(activeTab as any)} style={{ background: 'var(--theme-accent, #00C9FF)', color: '#000', padding: '16px 24px', borderRadius: '14px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}>
                {activeTab === 'barcode' ? <Scan size={20} /> : <Camera size={20} />} Open {activeTab} Scanner
              </button>
            </div>
          )}

          {(searching) && (
            <div style={{ textAlign: 'center', color: 'var(--theme-text-dim, #8b8b9b)', padding: '20px' }}>
              <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--theme-accent, #00C9FF)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
              <div>Working...</div>
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '12px', background: 'var(--theme-error-dim, rgba(255,107,107,0.1))', color: 'var(--theme-error, #FF6B6B)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{errorMsg}</div>
          )}

          {!searching && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((res: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {res.name}
                      <VitalityBadge {...calculateVitalityScore(res)} />
                    </div>
                    <div style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '13px' }}>{res.serving} • {Math.round(res.cal || 0)} kcal • {res._src === 'usda' ? '🏛️ USDA' : '🤖 AI'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleAddFoodClick(res)} style={{ width: '36px', height: '36px', borderRadius: '18px', background: 'var(--theme-panel-base, rgba(0,0,0,0.2))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={18} /></button>
                    <button onClick={() => addToTray(res)} style={{ width: '36px', height: '36px', borderRadius: '18px', background: 'var(--theme-accent-dim, rgba(0,201,255,0.2))', border: 'none', color: 'var(--theme-accent, #00C9FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Check size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* MEAL TRAY */}
        {stagingTray.length > 0 && (
          <div style={{ background: 'var(--theme-panel-base, #10141f)', borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.1))', padding: '16px', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--theme-text)' }}>Meal Preview ({stagingTray.length})</span>
            </div>

            <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stagingTray.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <div style={{ flex: 1, fontSize: '13px', color: 'var(--theme-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <button onClick={() => removeFromTray(idx)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}><X size={16} /></button>
                </div>
              ))}
            </div>

            <button onClick={() => {
              stagingTray.forEach(f => addFoodLog(meal, f));
              clearTray();
              onClose();
            }} style={{ width: '100%', padding: '14px', background: 'var(--theme-accent, #00C9FF)', color: '#000', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Check size={18} /> Log {stagingTray.length} Items to {meal}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

const QuickMacro = ({ label, val, color }: any) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
    <div style={{ fontSize: '10px', color: '#8b8b9b', fontWeight: '800', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontSize: '14px', color: color, fontWeight: '800' }}>{val}</div>
  </div>
);

const NutritionFactsDisplay = ({ food }: { food: any }) => {
  if (!food) return null;
  const nutrients: [string, any][] = Object.entries(food);
  const excludeKeys = ['id', 'name', 'brand', 'serving', 'sUnit', '_src', 'raw', 'meal', 'timestamp', 'qty','cal','p','c','f','fb','sugars','sat','mono','poly','trans','chol','Sodium','Potassium'];
  const unitMap: any = {
    'Vitamin A': 'mcg', 'Vitamin D': 'mcg', 'Vitamin K': 'mcg', 'Vitamin B7': 'mcg', 'Vitamin B9': 'mcg', 'Vitamin B12': 'mcg',
    'Selenium': 'mcg', 'Iodine': 'mcg', 'Chromium': 'mcg', 'Molybdenum': 'mcg'
  };
  const micros = nutrients.filter(([k, v]) => !excludeKeys.includes(k) && typeof v === 'number' && v > 0);
  const macros = nutrients.filter(([k]) => ['cal','p','c','f','fb','sugars','sat','mono','poly','trans','chol','Sodium','Potassium'].includes(k));
  return (
    <div style={{ fontSize: '12px' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '8px', color: '#8b8b9b', fontWeight: 'bold' }}>Standard Macros</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: '16px' }}>
        {macros.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '2px 0' }}>
            <span style={{ color: '#8b8b9b' }}>{k}:</span>
            <span style={{ color: 'var(--theme-text)', fontWeight: '600' }}>{Math.round(v * 10) / 10}{['Sodium','Potassium','chol'].includes(k) ? 'mg' : (k==='cal' ? '' : 'g')}</span>
          </div>
        ))}
      </div>
      {micros.length > 0 && (
        <>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '8px', color: '#8b8b9b', fontWeight: 'bold' }}>Vitamins & Minerals</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            {micros.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '2px 0' }}>
                <span style={{ color: '#8b8b9b' }}>{k}:</span>
                <span style={{ color: 'var(--theme-text)', fontWeight: '600' }}>{Math.round(v * 10) / 10}{unitMap[k] || 'mg'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

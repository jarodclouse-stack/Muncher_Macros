import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { 
  X, Search, Plus, Edit3, Trash2, 
  Sparkles, ChevronDown, Flame, Activity, Check, 
  Info, Loader2, BookmarkCheck 
} from 'lucide-react';
import { ALL_MICRO_KEYS, MICRO_UNITS, SERVING_UNITS, MICRO_CATEGORIES } from '../lib/constants';
import { getNutrientDescriptions } from '../lib/nutrient-info';
import { computeMultiplier, scaleLegacyFoodByAmount, calculateMacroBalance, scaleToTarget } from '../lib/food/serving-converter';
import { getPairingSuggestions } from '../lib/food/smart-pairing';

import { BarcodeScanner } from './BarcodeScanner';
import { SearchCoaster, type SearchTab } from './SearchCoaster';
import type { Food, RecipeItem } from '../types/food';

const CollapsibleEntrySection = ({ title, isOpen, onToggle, children }: { title: string, isOpen: boolean, onToggle: () => void, children: React.ReactNode }) => (
  <div style={{ border: '1px solid var(--theme-border)', borderRadius: '16px', overflow: 'hidden', background: 'var(--theme-panel-dim)', marginBottom: '8px' }}>
    <button 
      onClick={onToggle}
      type="button"
      style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text)', fontWeight: '700', fontSize: '13px' }}>
      {title.toUpperCase()}
      <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
    </button>
    {isOpen && (
      <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ height: '12px' }} />
        {children}
      </div>
    )}
  </div>
);

const EntryField = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '10px', color: 'var(--theme-text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    <input 
      className="inp" 
      value={value || ''} 
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)} 
      style={{ padding: '10px 12px', fontSize: '13px', background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: '#fff', outline: 'none' }}
    />
  </div>
);

export const PantryView: React.FC = () => {
  const { 
    localCache, saveCustomFood, updateCustomFood, deleteCustomFood, addFoodLog,
    toggleFavorite
  } = useDiary();
  
  const [form, setForm] = useState<Food>({ 
    name: '', 
    serving: '100 g',
    sQty: 100, sUnit: 'g',
    cal: 0, p: 0, c: 0, f: 0, 
    ingredients: '',
    ingredientItems: []
  });
  const [ingQuery, setIngQuery] = useState('');
  const [ingResults, setIngResults] = useState<Food[]>([]);
  const [isIngSearching, setIsIngSearching] = useState(false);
  const [pairingSuggestions, setPairingSuggestions] = useState<string[]>([]);

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab | 'saved' | 'manual'>('saved');
  
  const [sortBy] = useState<'recent' | 'name' | 'cal' | 'p'>('recent');
  const [filterType, setFilterType] = useState<'all' | 'fav' | 'high-p' | 'low-c' | 'recipe'>('all');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [innerGlobalSearchTab, setInnerGlobalSearchTab] = useState<SearchTab>('search');
  
  const [aiStagedResults, setAiStagedResults] = useState<Food[]>([]);
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  const [isPantryPickerOpen, setIsPantryPickerOpen] = useState(false);
  
  const customFoods: Food[] = localCache.customFoods || [];
  
  const [configuringFood, setConfiguringFood] = useState<Food | null>(null);
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
    
    const localMatches = customFoods.filter((f: Food) => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).map((f: Food) => ({ ...f, isLocal: true }));

    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const body = await res.json();
        const globalRes = body.foods || body.results || [];
        setSearchResults([...localMatches, ...globalRes]);
      } else {
        setSearchResults(localMatches);
      }
    } catch {
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
    } catch {
      setErrorMsg("AI Lookup failed.");
    }
    setIsSearching(false);
  };

  const handleGlobalAIDescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setAiStagedResults([]);
    try {
      const res = await fetch('/api/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: searchQuery })
      });
      const body = await res.json();
      const detected = (body.foods || []) as Food[];
      setAiStagedResults(detected.map((f: Food) => ({ ...f, stagedQty: '1', stagedUnit: f.sUnit || 'serving' })));
      setIsAiReviewing(true);
    } catch {
      setErrorMsg("AI Describe failed.");
    }
    setIsSearching(false);
  };

  const handleIngSearch = async (e?: React.FormEvent, forcedQuery?: string) => {
    if (e) e.preventDefault();
    const q = forcedQuery || ingQuery;
    if (!q) return;
    setIsIngSearching(true);
    const localMatches = customFoods.filter((f: Food) => f.name.toLowerCase().includes(q.toLowerCase())).map((f: Food) => ({ ...f, isLocal: true }));
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const body = await res.json();
        setIngResults([...localMatches, ...(body.foods || body.results || [])]);
      } else setIngResults(localMatches);
    } catch { setIngResults(localMatches); }
    setIsIngSearching(false);
  };

  const calculateRecipeTotals = (items: RecipeItem[]) => {
    const totals: Record<string, number> = { cal: 0, p: 0, c: 0, f: 0 };
    ALL_MICRO_KEYS.forEach(k => { totals[k] = 0; });
    ['fiber', 'sugars', 'sat', 'mono', 'poly', 'trans', 'chol', 'Sodium', 'Potassium', 'Calcium', 'Magnesium'].forEach(k => { totals[k] = 0; });

    items.forEach(item => {
      const mult = computeMultiplier(item.food.serving || '', item.unit, parseFloat(item.qty) || 0);
      const scaled = scaleLegacyFoodByAmount(item.food, mult);
      ['cal', 'p', 'c', 'f', 'fiber', 'sugars', 'sat', 'mono', 'poly', 'trans', 'chol', 'Sodium', 'Potassium', 'Calcium', 'Magnesium', ...ALL_MICRO_KEYS].forEach(k => {
        if (scaled[k] != null) totals[k] += Number(scaled[k]);
      });
    });

    const newForm = { ...form, ingredientItems: items };
    Object.keys(totals).forEach(k => { (newForm as any)[k] = totals[k as keyof typeof totals] ? totals[k as keyof typeof totals].toFixed(1) : ''; });
    setForm(newForm);
    setPairingSuggestions(getPairingSuggestions(items));
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
    <div style={{ paddingBottom: '40px', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Tab Switcher */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px', 
          marginBottom: '32px', 
          position: 'sticky', 
          top: 'calc(76px + env(safe-area-inset-top, 0px))', 
          zIndex: 100, 
          background: 'var(--theme-bg, #080A0F)', 
          padding: '12px 0', 
          margin: '0 0 32px 0',
          borderBottom: '1px solid var(--theme-border)',
        }}>
        <button onClick={() => { setActiveTab('search'); clearSearchState(); }} style={{ padding: '12px 4px', borderRadius: '14px', border: '1px solid var(--theme-border)', background: activeTab === 'search' ? 'var(--theme-accent-dim)' : 'rgba(255,255,255,0.03)', color: activeTab === 'search' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
          Discover
        </button>
        <button onClick={() => setActiveTab('manual')} style={{ padding: '12px 4px', borderRadius: '14px', border: '1px solid var(--theme-border)', background: activeTab === 'manual' ? 'var(--theme-accent-dim)' : 'rgba(255,255,255,0.03)', color: activeTab === 'manual' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
          Kitchen
        </button>
        <button onClick={() => setActiveTab('saved')} style={{ padding: '12px 4px', borderRadius: '14px', border: '1px solid var(--theme-border)', background: activeTab === 'saved' ? 'var(--theme-accent-dim)' : 'rgba(255,255,255,0.03)', color: activeTab === 'saved' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
          Pantry
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="section" style={{ marginTop: '0', paddingTop: '60px' }}>
          <SearchCoaster 
            activeTab={innerGlobalSearchTab} 
            onTabChange={(t) => { setInnerGlobalSearchTab(t); clearSearchState(); }} 
          />
          
          <div className="section" style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            {innerGlobalSearchTab === 'scan' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md) 0' }}>
                <BarcodeScanner 
                  label="Take Photo to Scan"
                  onScanSuccess={(code) => {
                    setSearchQuery(code);
                    handleGlobalSearch();
                    setInnerGlobalSearchTab('search');
                  }}
                  onScanError={(err) => setErrorMsg(err)}
                />
                <p style={{ fontSize: '12px', color: 'var(--theme-text-dim)', textAlign: 'center', maxWidth: '200px' }}>
                  Point at a barcode or QR code. Take a clear photo for best results.
                </p>
              </div>
            ) : (
              <form 
                className="search-bar-wrap" 
                onSubmit={innerGlobalSearchTab === 'search' ? handleGlobalSearch : (innerGlobalSearchTab === 'ai-search' ? handleGlobalAISearch : handleGlobalAIDescribe)}>
                <input 
                  type="text" 
                  placeholder={innerGlobalSearchTab === 'search' ? "Search for foods, brands..." : (innerGlobalSearchTab === 'ai-search' ? "Explain the food..." : "Describe your whole meal...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-md)', padding: '12px var(--space-md)', color: 'var(--theme-text)', fontSize: '14px', outline: 'none' }}
                />
                <button 
                  type="submit"
                  style={{ padding: '12px var(--space-lg)', background: 'var(--theme-accent)', border: 'none', borderRadius: 'var(--radius-md)', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isSearching ? <Loader2 className="spin" size={20} /> : (innerGlobalSearchTab === 'search' ? <Search size={20} /> : <Sparkles size={20} />)}
                </button>
              </form>
            )}

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {searchResults.map((f: Food, i) => (
                  <div key={i} onClick={() => handleAddPreviewClick(f)} style={{ padding: '12px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '12px', cursor: 'pointer', borderLeft: f.isLocal ? '3px solid var(--theme-success, #92FE9D)' : '3px solid var(--theme-accent, #00C9FF)', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--theme-text)' }}>{f.name}</div>
                        {f.brand && <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', opacity: 0.6 }}>• {f.brand}</div>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', marginTop: '2px' }}>{f.serving} • {f.cal} kcal • P:{f.p}g C:{f.c}g F:{f.f}g</div>
                    </div>
                    {f.isLocal && <BookmarkCheck size={16} color="var(--theme-success, #92FE9D)" />}
                  </div>
                ))}
              </div>
            )}
            
            {errorMsg && <div style={{ color: 'var(--theme-error)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{errorMsg}</div>}

            {/* AI Review Step */}
            {isAiReviewing && aiStagedResults.length > 0 && (
              <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,180,255,0.05)', borderRadius: '24px', border: '1px solid rgba(0,180,255,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--theme-accent)" /> REVIEW DETECTED MEAL
                  </div>
                  <button onClick={() => { setIsAiReviewing(false); setAiStagedResults([]); }} style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim)', cursor: 'pointer' }}><X size={18} /></button>
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

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      aiStagedResults.forEach(f => {
                        const mult = computeMultiplier(f.serving || '', f.stagedUnit || 'serving', parseFloat(String(f.stagedQty)) || 1);
                        const scaled = scaleLegacyFoodByAmount(f, mult);
                        addFoodLog('Breakfast', scaled);
                      });
                      setIsAiReviewing(false);
                      setAiStagedResults([]);
                      alert("Meal logged to diary!");
                    }}
                    style={{ flex: 2, padding: '14px', background: 'var(--theme-accent)', border: 'none', borderRadius: '14px', color: '#000', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Check size={18} /> CONFIRM ALL
                  </button>
                  <button 
                    onClick={() => {
                      aiStagedResults.forEach(f => {
                        const mult = computeMultiplier(f.serving || '', f.stagedUnit || 'serving', parseFloat(String(f.stagedQty)) || 1);
                        const scaled = scaleLegacyFoodByAmount(f, mult);
                        saveCustomFood(scaled);
                      });
                      setIsAiReviewing(false);
                      setAiStagedResults([]);
                      alert("Items saved to Pantry!");
                    }}
                    style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>
                    SAVE TO PANTRY
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="section" style={{ marginTop: '0', paddingTop: '60px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>{editingIndex !== null ? 'Edit Macro Kitchen' : 'Macro Kitchen'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <EntryField label="Food Name" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="e.g. Grilled Chicken" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <EntryField label="Serving Amount" value={String(form.sQty || 100)} onChange={v => setForm({...form, sQty: parseFloat(v) || 0})} placeholder="100" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <label style={{ fontSize: '10px', color: 'var(--theme-text-dim)', fontWeight: '800' }}>SERVING UNIT</label>
                <select 
                  className="inp"
                  value={form.sUnit}
                  onChange={e => setForm({...form, sUnit: e.target.value})}
                  style={{ padding: '8px 10px', fontSize: '13px', background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
                  {SERVING_UNITS.map(u => <option key={u.v} value={u.v}>{u.v}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
               <EntryField label="Calories (kcal)" value={String(form.cal || 0)} onChange={v => setForm({...form, cal: parseFloat(v) || 0})} placeholder="0" />
               <EntryField label="Protein (g)" value={String(form.p || 0)} onChange={v => setForm({...form, p: parseFloat(v) || 0})} placeholder="0" />
               <EntryField label="Carbs (g)" value={String(form.c || 0)} onChange={v => setForm({...form, c: parseFloat(v) || 0})} placeholder="0" />
               <EntryField label="Fat (g)" value={String(form.f || 0)} onChange={v => setForm({...form, f: parseFloat(v) || 0})} placeholder="0" />
            </div>

            {/* Smart Scaling Controls */}
            {form.cal > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '-8px' }}>
                <button 
                  onClick={() => {
                    const target = prompt("Enter target Calories:", "500");
                    if (!target) return;
                    const val = parseFloat(target);
                    if (val > 0) {
                      const scaled = scaleToTarget(form, 'cal', val);
                      setForm(scaled);
                    }
                  }}
                  style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '10px', color: 'var(--theme-accent)', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  SCALE TO KCAL
                </button>
                <button 
                  onClick={() => {
                    const target = prompt("Enter target Protein (g):", "50");
                    if (!target) return;
                    const val = parseFloat(target);
                    if (val > 0) {
                      const scaled = scaleToTarget(form, 'p', val);
                      setForm(scaled);
                    }
                  }}
                  style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '10px', color: 'var(--theme-accent)', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  SCALE TO PROTEIN
                </button>
              </div>
            )}

            {/* Macro Balance Feedback */}
            {form.cal > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--theme-text-dim)' }}>MACRO BALANCE</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {(() => {
                    const bal = calculateMacroBalance(form);
                    return (
                      <>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--theme-accent)' }}>{bal.p}% <span style={{fontSize:'8px', opacity:0.6}}>P</span></div>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#FCC419' }}>{bal.c}% <span style={{fontSize:'8px', opacity:0.6}}>C</span></div>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#FF6B6B' }}>{bal.f}% <span style={{fontSize:'8px', opacity:0.6}}>F</span></div>
                        {bal.p > 35 && <div style={{ fontSize: '9px', background: 'var(--theme-success)', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: '900' }}>HIGH PROTEIN</div>}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid var(--theme-border)' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-accent)', marginBottom: '8px', display: 'block' }}>ADD INGREDIENTS</label>
              <form onSubmit={handleIngSearch} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  className="inp" placeholder="Search recipe ingredients..." 
                  value={ingQuery} onChange={e => {
                    setIngQuery(e.target.value);
                    if (e.target.value.length > 2) handleIngSearch(undefined, e.target.value);
                  }}
                  style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                />
                <button type="submit" style={{ background: 'var(--theme-accent)', border: 'none', borderRadius: '10px', padding: '0 12px', color: '#000' }}>
                  {isIngSearching ? <Loader2 className="spin" size={16} /> : <Search size={16} />}
                </button>
              </form>

              {/* Pantry Picker Toggle & Row */}
              <div style={{ marginBottom: '12px' }}>
                <button 
                  onClick={() => setIsPantryPickerOpen(!isPantryPickerOpen)}
                  style={{ 
                    width: '100%', padding: '8px', 
                    background: isPantryPickerOpen ? 'var(--theme-accent-dim)' : 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--theme-border)', borderRadius: '10px',
                    color: isPantryPickerOpen ? 'var(--theme-accent)' : 'var(--theme-text-dim)',
                    fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}>
                  <BookmarkCheck size={14} /> {isPantryPickerOpen ? 'Hide Pantry' : 'Quick Add from Pantry'}
                </button>
                
                {isPantryPickerOpen && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {customFoods.length === 0 ? (
                      <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', padding: '10px' }}>Your pantry is empty.</div>
                    ) : (
                      customFoods.map((f: Food, i: number) => (
                        <button 
                          key={i}
                          onClick={() => handleAddPreviewClick(f)}
                          style={{ 
                            padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '12px', whiteSpace: 'nowrap', cursor: 'pointer', textAlign: 'left', minWidth: '120px'
                          }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>{f.name}</div>
                          <div style={{ fontSize: '9px', color: 'var(--theme-text-dim)' }}>{f.cal} kcal</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Pairing Suggestions */}
              {pairingSuggestions.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '4px' }}>
                  {pairingSuggestions.map(p => (
                    <button 
                      key={p}
                      onClick={() => { setIngQuery(p); handleIngSearch(undefined, p); }}
                      style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--theme-text)', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      + {p}
                    </button>
                  ))}
                </div>
              )}

              {ingResults.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '12px', marginBottom: '16px', maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--theme-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Search Results</div>
                  {ingResults.map((r, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleAddPreviewClick(r)}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px', 
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        borderLeft: r.isLocal ? '3px solid var(--theme-success)' : '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.2s'
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {r.name} 
                          {r.isLocal && <BookmarkCheck size={12} color="var(--theme-success)" />}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '2px' }}>
                          {r.cal} kcal • P:{r.p}g C:{r.c}g F:{r.f}g
                        </div>
                      </div>
                      <div style={{ background: 'var(--theme-accent-dim)', color: 'var(--theme-accent)', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>
                        PREVIEW
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(form.ingredientItems || []).map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.food.name}</div>
                    </div>
                    <input 
                      type="number" className="inp" value={item.qty} 
                      onChange={e => {
                        const newItems = [...(form.ingredientItems || [])];
                        newItems[i] = { ...item, qty: e.target.value };
                        calculateRecipeTotals(newItems);
                      }}
                      style={{ width: '50px', padding: '4px 6px', fontSize: '11px' }}
                    />
                    <select 
                      value={item.unit}
                      onChange={e => {
                        const newItems = [...(form.ingredientItems || [])];
                        newItems[i] = { ...item, unit: e.target.value };
                        calculateRecipeTotals(newItems);
                      }}
                      style={{ padding: '4px 6px', fontSize: '11px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '6px' }}>
                      {SERVING_UNITS.map(u => <option key={u.v} value={u.v}>{u.v}</option>)}
                    </select>
                    <button onClick={() => {
                        const newItems = (form.ingredientItems || []).filter((_: any, idx: number) => idx !== i);
                        calculateRecipeTotals(newItems);
                      }} 
                      style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,0.7)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  const foodData: any = { 
                    ...form,
                    serving: `${form.sQty || '1'} ${form.sUnit || 'serving'}`,
                    sQty: Number(form.sQty) || 1,
                    sUnit: form.sUnit || 'serving'
                  };
                  ['cal', 'p', 'c', 'f', 'fiber', 'sugars', 'sat', 'mono', 'poly', 'trans', 'chol', 'Sodium', 'Potassium', 'Calcium', 'Magnesium', ...ALL_MICRO_KEYS].forEach(k => {
                    if (foodData[k] !== undefined && foodData[k] !== '') {
                      foodData[k] = Number(foodData[k]);
                    }
                  });
                  if (editingIndex !== null) updateCustomFood(editingIndex, foodData);
                  else saveCustomFood(foodData);
                  setActiveTab('saved');
                  setEditingIndex(null);
                  setForm({
                    name:'', sQty: 100, sUnit: 'g', cal: 0, p: 0, c: 0, f: 0, fiber: 0, sugars: 0, 
                    sat: 0, mono: 0, poly: 0, trans: 0, chol: 0, 
                    Sodium: 0, Potassium: 0, Calcium: 0, Magnesium: 0,
                    ...ALL_MICRO_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {}),
                    ingredients:'', serving: '',
                    ingredientItems: []
                  });
                }}
                style={{ flex: 2, padding: '14px', background: 'var(--theme-accent)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '800', cursor: 'pointer' }}>
                {editingIndex !== null ? 'Update Food' : 'Save to Pantry'}
              </button>
              <button 
                onClick={() => {
                  setEditingIndex(null);
                  setForm({
                    name:'', sQty: 100, sUnit: 'g', cal: 0, p: 0, c: 0, f: 0, fiber: 0, sugars: 0, 
                    sat: 0, mono: 0, poly: 0, trans: 0, chol: 0, 
                    Sodium: 0, Potassium: 0, Calcium: 0, Magnesium: 0,
                    ...ALL_MICRO_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {}),
                    ingredients:'', serving: '',
                    ingredientItems: []
                  });
                }}
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text-dim)', fontWeight: '700', cursor: 'pointer' }}>
                Reset
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--theme-border)', opacity: 0.3, margin: '8px 0' }} />

            {/* Collapsible Sections */}
            <CollapsibleEntrySection 
              title="Fats & Fiber" 
              isOpen={openSection === 'fats'} 
              onToggle={() => setOpenSection(openSection === 'fats' ? null : 'fats')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <EntryField label="Fiber (g)" value={String(form.fiber || 0)} onChange={v => setForm({...form, fiber: parseFloat(v) || 0})} />
                <EntryField label="Sugars (g)" value={String(form.sugars || 0)} onChange={v => setForm({...form, sugars: parseFloat(v) || 0})} />
                <EntryField label="Sat Fat (g)" value={String(form.sat || 0)} onChange={v => setForm({...form, sat: parseFloat(v) || 0})} />
                <EntryField label="Trans Fat (g)" value={String(form.trans || 0)} onChange={v => setForm({...form, trans: parseFloat(v) || 0})} />
                <EntryField label="Mono Fat (g)" value={String(form.mono || 0)} onChange={v => setForm({...form, mono: parseFloat(v) || 0})} />
                <EntryField label="Poly Fat (g)" value={String(form.poly || 0)} onChange={v => setForm({...form, poly: parseFloat(v) || 0})} />
                <EntryField label="Chol (mg)" value={String(form.chol || 0)} onChange={v => setForm({...form, chol: parseFloat(v) || 0})} />
                <EntryField label="Sodium (mg)" value={String(form.Sodium || 0)} onChange={v => setForm({...form, Sodium: parseFloat(v) || 0})} />
              </div>
            </CollapsibleEntrySection>

            {MICRO_CATEGORIES.map(cat => (
              <CollapsibleEntrySection 
                key={cat.cat}
                title={cat.cat} 
                isOpen={openSection === cat.cat} 
                onToggle={() => setOpenSection(openSection === cat.cat ? null : cat.cat)}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {cat.keys.map(k => (
                    <EntryField 
                      key={k.k} 
                      label={`${k.k} (${k.u})`} 
                      value={String((form as any)[k.k] || 0)} 
                      onChange={v => setForm({...form, [k.k]: parseFloat(v) || 0})} 
                    />
                  ))}
                </div>
              </CollapsibleEntrySection>
            ))}

            <textarea 
              placeholder="Ingredients List (Description)" 
              style={{ width: '100%', background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)', borderRadius: '14px', padding: '14px', color: 'var(--theme-text)', fontSize: '13px', minHeight: '100px', outline: 'none' }}
              value={form.ingredients}
              onChange={e => setForm({...form, ingredients: e.target.value})}
            />
          </div>
        </div>
      )}


      {activeTab === 'saved' && (
        <div className="section" style={{ marginTop: '0', paddingTop: '60px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* Filters & Sorting */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: 'var(--space-md)' }}>
            <button onClick={() => setFilterType('all')} style={{ background: filterType === 'all' ? 'var(--theme-accent-dim)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: filterType === 'all' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontSize: '9px', fontWeight: '800', padding: '8px 4px', textTransform: 'uppercase' }}>
              All
            </button>
            <button onClick={() => setFilterType('fav')} style={{ background: filterType === 'fav' ? 'var(--theme-accent-dim)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: filterType === 'fav' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontSize: '9px', fontWeight: '800', padding: '8px 4px', textTransform: 'uppercase' }}>
              Favorites
            </button>
            <button onClick={() => setFilterType('high-p')} style={{ background: filterType === 'high-p' ? 'var(--theme-accent-dim)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: filterType === 'high-p' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontSize: '9px', fontWeight: '800', padding: '8px 4px', textTransform: 'uppercase' }}>
              Protein
            </button>
            <button onClick={() => setFilterType('recipe')} style={{ background: filterType === 'recipe' ? 'var(--theme-accent-dim)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: filterType === 'recipe' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontSize: '9px', fontWeight: '800', padding: '8px 4px', textTransform: 'uppercase' }}>
              Recipes
            </button>
          </div>

          {[...customFoods]
            .filter((f: Food) => {
              if (filterType === 'fav') return f.favorite;
              if (filterType === 'high-p') return (f.p * 4) / (f.cal || 1) > 0.3;
              if (filterType === 'recipe') return (f.ingredientItems?.length || 0) > 0;
              return true;
            })
            .sort((a: Food, b: Food) => {
              if (sortBy === 'name') return a.name.localeCompare(b.name);
              if (sortBy === 'cal') return b.cal - a.cal;
              if (sortBy === 'p') return b.p - a.p;
              return 0; // Default to recent (existing order)
            })
            .map((f: Food) => {
              // Map index back to original for delete/update
              const originalIdx = customFoods.indexOf(f);
              return (
                <div 
                  key={originalIdx} 
                  onClick={() => handleAddPreviewClick(f)}
                  style={{ 
                    padding: '24px 20px', 
                    background: 'var(--theme-panel-dim, rgba(255,255,255,0.02))', 
                    borderRadius: '24px', 
                    border: '1px solid var(--theme-border)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: '100px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ fontWeight: '900', color: 'var(--theme-text)', fontSize: '16px', letterSpacing: '-0.3px' }}>{f.name}</div>
                      {f.favorite && <BookmarkCheck size={14} color="#FCC419" fill="#FCC419" />}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', color: 'var(--theme-accent)', fontWeight: '800' }}>{f.cal} <span style={{ fontSize: '10px', fontWeight: '500', opacity: 0.8 }}>kcal</span></div>
                      <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '700', letterSpacing: '0.2px' }}>
                        P:{f.p} <span style={{ opacity: 0.4 }}>•</span> C:{f.c} <span style={{ opacity: 0.4 }}>•</span> F:{f.f}
                      </div>
                    </div>
                    {(f.ingredientItems?.length || 0) > 0 && (
                      <div style={{ marginTop: '8px', display: 'inline-flex', background: 'var(--theme-accent-dim)', color: 'var(--theme-accent)', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' }}>
                        RECIPE LOGIC
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: '12px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleFavorite(originalIdx)} style={{ background: 'none', border: 'none', color: f.favorite ? '#FCC419' : 'var(--theme-text-dim)', cursor: 'pointer', opacity: f.favorite ? 1 : 0.5 }}>
                      <BookmarkCheck size={20} fill={f.favorite ? '#FCC419' : 'none'} />
                    </button>
                    <button onClick={() => { setForm(f); setEditingIndex(originalIdx); setActiveTab('manual'); }} style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim)', cursor: 'pointer', opacity: 0.5 }}>
                      <Edit3 size={20} />
                    </button>
                    <button onClick={() => deleteCustomFood(originalIdx)} style={{ background: 'rgba(255,107,107,0.05)', border: 'none', borderRadius: '10px', padding: '8px', color: '#FF6B6B', cursor: 'pointer' }}>
                       <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          }
          {customFoods.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--theme-text-dim)' }}>Your pantry is empty. Add foods to save them here.</div>
          )}
        </div>
      )}

      {/* Scanner Placeholder (Removed Modal) */}

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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <MacroPill label="Calories" val={Math.round((Number(configuringFood.cal) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1))} unit="kcal" color="var(--theme-text)" />
                <MacroPill label="Protein" val={Math.round((Number(configuringFood.p) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1))} unit="g" color="#00C9FF" />
                <MacroPill label="Carbs" val={Math.round((Number(configuringFood.c) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1))} unit="g" color="#FCC419" />
                <MacroPill label="Fat" val={Math.round((Number(configuringFood.f) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1))} unit="g" color="#FF6B6B" />
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
                    {isHighProtein && <div style={{ padding: '4px 10px', background: 'rgba(146, 254, 157, 0.1)', border: '1px solid var(--theme-success)', borderRadius: '10px', color: 'var(--theme-success)', fontSize: '10px', fontWeight: '800' }}>⚡ PROTEIN POWERHOUSE</div>}
                    {isHighCarb && <div style={{ padding: '4px 10px', background: 'rgba(252, 196, 25, 0.1)', border: '1px solid #FCC419', borderRadius: '10px', color: '#FCC419', fontSize: '10px', fontWeight: '800' }}>🥗 HIGH ENERGY CARBS</div>}
                    {isHighFat && <div style={{ padding: '4px 10px', background: 'rgba(255, 107, 107, 0.1)', border: '1px solid #FF6B6B', borderRadius: '10px', color: '#FF6B6B', fontSize: '10px', fontWeight: '800' }}>🥑 HIGH FAT CONTENT</div>}
                    {totalCal > 500 && <div style={{ padding: '4px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', fontSize: '10px', fontWeight: '800' }}>🍽️ HEAVY MEAL</div>}
                  </div>
                );
              })()}

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

                {/* Intelligence Scaling Row */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      const target = prompt("Enter target Calories (kcal):", "500");
                      if (target && !isNaN(Number(target))) {
                        const targetKcal = Number(target);
                        const baseKcal = Number(configuringFood.cal) || 0;
                        if (baseKcal > 0) {
                          // servingUnit and servingQty need to reach targetKcal
                          // currentKcal = baseKcal * multiplier
                          // multiplier = targetKcal / baseKcal
                          // We need to find qty such that computeMultiplier(...) = targetKcal / baseKcal
                          // This is complex because computeMultiplier handles density. 
                          // Simplest: find the multiplier for "1 unit" of current selection, then scale.
                          const multForOne = computeMultiplier(configuringFood.serving, servingUnit, 1);
                          const needed = targetKcal / (baseKcal * multForOne);
                          setServingQty(needed.toFixed(1));
                        }
                      }
                    }}
                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-accent, #00C9FF)', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Flame size={12}/> SCALE TO KCAL
                  </button>
                  <button 
                    onClick={() => {
                      const target = prompt("Enter target Protein (g):", "30");
                      if (target && !isNaN(Number(target))) {
                        const targetP = Number(target);
                        const baseP = Number(configuringFood.p) || 0;
                        if (baseP > 0) {
                          const multForOne = computeMultiplier(configuringFood.serving || '', servingUnit, 1);
                          const needed = targetP / (baseP * multForOne);
                          setServingQty(needed.toFixed(1));
                        }
                      }
                    }}
                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-success, #92FE9D)', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Activity size={12}/> SCALE TO PROTEIN
                  </button>
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
                      const val = (Number((configuringFood as any)[k]) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1);
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => {
                    const mult = computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1);
                    const scaled = scaleLegacyFoodByAmount(configuringFood, mult);
                    addFoodLog('Breakfast', scaled); // Defaulting to Breakfast for standalone pantry
                    setConfiguringFood(null);
                    alert("Added to Diary!");
                  }}
                  style={{ width: '100%', padding: '16px', background: 'var(--theme-success, #92FE9D)', border: 'none', borderRadius: '16px', color: '#000', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(146,254,157,0.15)' }}>
                  <Plus size={20} /> ADD TO DIARY
                </button>

                <button 
                  onClick={() => {
                    const qty = parseFloat(servingQty) || 1;
                    const newItems = [...(form.ingredientItems || []), { food: configuringFood, qty: qty.toString(), unit: servingUnit }];
                    calculateRecipeTotals(newItems);
                    setConfiguringFood(null);
                    setIngResults([]);
                    setIngQuery('');
                    setActiveTab('manual');
                  }}
                  style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '16px', color: 'var(--theme-text)', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Sparkles size={18} color="var(--theme-accent)" /> USE AS INGREDIENT
                </button>

                <button 
                  onClick={handleConfirmAddPantry}
                  style={{ width: '100%', padding: '14px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'var(--theme-text-dim)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                  RE-SAVE TO PANTRY
                </button>
              </div>
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

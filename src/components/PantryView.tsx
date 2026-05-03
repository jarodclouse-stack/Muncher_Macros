import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { 
  Plus, Check, X, Search, Sparkles, ChevronDown, 
  Flame, Activity, Trash2, Loader2, BookmarkCheck,
  Info, FileText, Edit2
} from 'lucide-react';
import { ALL_MICRO_KEYS, MICRO_UNITS, SERVING_UNITS, MICRO_CATEGORIES } from '../lib/constants';
import { getNutrientDescriptions } from '../lib/nutrient-info';
import { computeMultiplier, normalizeFoodResult, scaleLegacyFoodByAmount, calculateMacroBalance, scaleToTarget } from '../lib/food/serving-converter';
import { getPairingSuggestions } from '../lib/food/smart-pairing';

import { SearchCoaster, type SearchTab } from './SearchCoaster';
import { NutritionFactsDisplay } from './NutritionFactsDisplay';
import { BarcodeScanner } from './BarcodeScanner';
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
      <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--theme-border-dim)' }}>
        <div style={{ height: '12px' }} />
        {children}
      </div>
    )}
  </div>
);

const PantryFilter = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`pantry-filter-chip ${active ? 'active' : ''}`}
    style={{ 
      padding: '12px 14px', 
      borderRadius: '14px', 
      fontSize: '11px', 
      fontWeight: '800', 
      textTransform: 'uppercase',
      cursor: 'pointer',
      border: 'none',
      color: active ? 'var(--theme-bg)' : 'var(--theme-text-dim)'
    }}>
    {label}
  </button>
);

const MacroPill = ({ label, val, unit, color }: { label: string, val: string | number, unit: string, color: string }) => (
  <div style={{ flex: 1, padding: '10px', background: 'var(--theme-panel-dim)', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--theme-border)' }}>
    <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '16px', fontWeight: '900', color }}>{val}<span style={{ fontSize: '10px', opacity: 0.8, color: 'inherit', marginLeft: '2px' }}>{unit}</span></div>
  </div>
);

const NutrientDetailRow = ({ label, value, unit, benefit }: { label: string, value: string | number, unit: string, benefit?: any }) => {
  const [showBenefit, setShowBenefit] = useState(false);
  return (
    <div style={{ padding: '10px 14px', background: 'var(--theme-panel-dim)', borderRadius: '16px', border: '1px solid var(--theme-border)', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '900', 
            color: 'var(--theme-text)', 
            background: 'var(--theme-panel)', 
            padding: '4px 12px', 
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            border: '1px solid var(--theme-border)'
          }}>{label}</span>
          {benefit && (
            <button onClick={() => setShowBenefit(!showBenefit)} style={{ background: 'none', border: 'none', color: showBenefit ? 'var(--theme-accent)' : 'var(--theme-text-dim)', cursor: 'pointer', padding: 4 }}>
              <Info size={14} />
            </button>
          )}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--theme-accent)' }}>{value}<span style={{fontSize:'10px', opacity:0.8, marginLeft: '2px'}}>{unit}</span></span>
      </div>
      {showBenefit && benefit && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--theme-text-dim)', fontStyle: 'italic', borderTop: '1px solid var(--theme-border)', paddingTop: '10px', fontWeight: '600', lineHeight: '1.4' }}>
           {typeof benefit === 'string' ? benefit : benefit.summary}
        </div>
      )}
    </div>
  );
};

const EntryField = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '10px', color: 'var(--theme-accent)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    <input 
      className="inp" 
      value={value || ''} 
      placeholder={placeholder}
      onChange={e => {
        const v = e.target.value;
        const cleaned = (v.length > 1 && v.startsWith('0') && !v.startsWith('0.')) ? v.substring(1) : v;
        onChange(cleaned);
      }}
      style={{ padding: '10px 12px', fontSize: '13px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text)', outline: 'none' }}
    />
  </div>
);

export const PantryView: React.FC = () => {
  const { 
    localCache, saveCustomFood, addFoodLog, updateCustomFood, deleteCustomFood
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
  const [activeTab, setActiveTab] = useState<SearchTab | 'saved'>('saved');
  const [pantryMode, setPantryMode] = useState<'list' | 'create'>('list');
  const [createTab, setCreateTab] = useState<'basics' | 'micros' | 'recipe'>('basics');
  
  const [sortBy] = useState<'recent' | 'name' | 'cal' | 'p'>('recent');
  const [filterType, setFilterType] = useState<'all' | 'fav' | 'high-p' | 'low-c' | 'recipe'>('all');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [innerGlobalSearchTab, setInnerGlobalSearchTab] = useState<SearchTab>('search');

  // Performance: Debounce for both searches
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (ingQuery.length > 2) handleIngSearch(undefined, ingQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [ingQuery]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (innerGlobalSearchTab === 'describe') return;
      if (searchQuery.length > 2) handleGlobalSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, innerGlobalSearchTab]);

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
        // Cap results at 50 for performance
        setSearchResults([...localMatches, ...globalRes].slice(0, 50));
      } else {
        setSearchResults(localMatches.slice(0, 50));
      }
    } catch {
      setSearchResults(localMatches.slice(0, 50));
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
    setSearchResults([]);
    setAiStagedResults([]);
    try {
      const res = await fetch('/api/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: searchQuery })
      });
      const body = await res.json();
      const detected = (body.foods || []) as Food[];
      setAiStagedResults(detected.map((f: Food) => {
        const norm = normalizeFoodResult(f);
        return { 
          ...norm, 
          stagedQty: f.stagedQty || f.sQty?.toString() || '1', 
          stagedUnit: f.stagedUnit || f.sUnit || 'piece',
          showNutrientIntel: false
        };
      }));
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
        const combined = [...localMatches, ...(body.foods || body.results || [])];
        setIngResults(combined.slice(0, 30)); // Capped for ingredient dropdown performance
      } else setIngResults(localMatches.slice(0, 30));
    } catch { setIngResults(localMatches.slice(0, 30)); }
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

  const handleAddPreviewClick = (food: Food) => {
    setConfiguringFood(food);
    setEditName(food.name || '');
    
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
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px', 
          marginBottom: '20px', 
          position: 'sticky', 
          top: '0', 
          zIndex: 100, 
          background: 'var(--theme-panel)', 
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          padding: '24px 20px 16px 20px', 
          borderBottom: '1px solid var(--theme-border)'
        }}>
        <button onClick={() => { setActiveTab('search'); clearSearchState(); }} 
          className={`pantry-filter-chip ${activeTab === 'search' ? 'active' : ''}`}
          style={{ padding: '12px 4px', borderRadius: '14px', border: 'none', color: activeTab === 'search' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center' }}>
          Discover
        </button>
        <button onClick={() => setActiveTab('saved')} 
          className={`pantry-filter-chip ${activeTab === 'saved' ? 'active' : ''}`}
          style={{ padding: '12px 4px', borderRadius: '14px', border: 'none', color: activeTab === 'saved' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center' }}>
          My Pantry
        </button>
      </div>

      {activeTab === 'search' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ height: '20px' }} />
          
          <SearchCoaster 
            activeTab={innerGlobalSearchTab} 
            onTabChange={(t) => { setInnerGlobalSearchTab(t); clearSearchState(); }} 
          />
            
          {innerGlobalSearchTab === 'scan' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
              <BarcodeScanner 
                onScanSuccess={(result) => {
                  if (typeof result === 'object' && result !== null) {
                    setAiStagedResults([{ ...result, stagedQty: '1', stagedUnit: 'serving' }]);
                    setIsAiReviewing(true);
                  } else {
                    setSearchQuery(String(result));
                    const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
                    handleGlobalSearch(dummyEvent);
                  }
                }}
                onScanError={(err) => setErrorMsg(err)}
              />
              <p style={{ fontSize: '13px', color: 'var(--theme-text-dim)', textAlign: 'center', maxWidth: '280px', lineHeight: '1.4', fontWeight: '600' }}>
                Scans <span style={{ color: 'var(--theme-accent)' }}>Nutrition Labels</span> and <span style={{ color: 'var(--theme-accent)' }}>Barcodes</span>. Take a clear photo for best results.
              </p>
            </div>
          ) : innerGlobalSearchTab === 'describe' ? (
            <div style={{ padding: '0 0 20px 0' }}>
              <div className="glass-card luminous-breath" style={{ 
                padding: '24px', 
                border: '1.5px solid rgba(255,255,255,0.12)', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                marginTop: '10px'
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
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        Analyze Meal Intelligence
                      </h3>
                      <div style={{ fontSize: '10px', color: 'var(--theme-text-dim-on-panel)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>AI-Powered Complex Parsing</div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.preventDefault(); handleGlobalAIDescribe(e); }}
                    disabled={isSearching || !searchQuery.trim()}
                    style={{ 
                      width: '100%', 
                      padding: '18px', 
                      background: 'linear-gradient(135deg, rgba(0, 201, 255, 0.25), rgba(0, 201, 255, 0.1))', 
                      border: '1.5px solid var(--theme-accent, #00C9FF)', 
                      borderRadius: '18px', 
                      color: '#FFFFFF', 
                      fontWeight: '900', 
                      fontSize: '13px',
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 32px rgba(0, 201, 255, 0.2)',
                      opacity: isSearching || !searchQuery.trim() ? 0.5 : 1
                    }}>
                    {isSearching ? <Loader2 className="spin" size={20} /> : <FileText size={20} />}
                    <span style={{ letterSpacing: '1.5px' }}>{isSearching ? 'ANALYZING MEAL...' : 'ANALYZE MEAL DESCRIPTION'}</span>
                  </button>

                  <textarea 
                    placeholder="Describe your whole meal here... (e.g. '3 scrambled eggs with spinach and a cup of black coffee')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                      width: '100%', 
                      minHeight: '160px', 
                      background: 'rgba(255,255,255,0.06)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
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
          ) : (
            <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                <form 
                  className="search-bar-wrap" 
                  onSubmit={innerGlobalSearchTab === 'search' ? handleGlobalSearch : handleGlobalAISearch}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input 
                      type="text" 
                      placeholder={innerGlobalSearchTab === 'search' ? "Search for foods, brands..." : "Explain food (AI search)..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-md)', padding: '12px 12px 12px 40px', color: 'var(--theme-text)', fontSize: '14px', outline: 'none' }}
                    />
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--theme-text-dim)' }}>
                      <Search size={18} />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    style={{ padding: '12px var(--space-lg)', background: 'var(--theme-accent)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--theme-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSearching ? <Loader2 className="spin" size={20} /> : (innerGlobalSearchTab === 'search' ? <Search size={20} /> : <Sparkles size={20} />)}
                  </button>
                </form>
            </div>
          )}

          {searchResults.length > 0 && !isAiReviewing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginTop: 'var(--space-md)', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {searchResults.map((f: Food, i) => (
                <div key={i} onClick={() => handleAddPreviewClick(f)} className="glass-card" style={{ padding: 'var(--space-sm) var(--space-md)', cursor: 'pointer', borderLeft: f.isLocal ? '4px solid var(--theme-success)' : '4px solid var(--theme-accent)', transition: 'transform 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: '900', fontSize: '14px', color: 'var(--theme-text)' }}>{f.name}</div>
                      {f.brand && <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', opacity: 0.6, fontWeight: '700' }}>• {f.brand}</div>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '4px', fontWeight: '600' }}>{f.serving} • {f.cal} kcal • P:{f.p}g C:{f.c}g F:{f.f}g</div>
                  </div>
                  {f.isLocal && <BookmarkCheck size={18} color="var(--theme-success)" />}
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && !isAiReviewing && (
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-xl)', marginTop: 'var(--space-md)', borderStyle: 'dashed' }}>
              <div style={{ color: 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '900', marginBottom: '16px', letterSpacing: '1px' }}>NO FOODS FOUND IN DATABASE</div>
              {/^\d+$/.test(searchQuery) && searchQuery.length >= 8 ? (
                <button 
                  onClick={() => {
                    setForm({...form, name: "New Product", barcode: searchQuery});
                    setActiveTab('saved');
                    setPantryMode('create');
                    setCreateTab('basics');
                  }}
                  style={{ 
                    width: '100%', padding: '14px', background: 'var(--theme-accent)', border: 'none', 
                    borderRadius: '16px', color: 'var(--theme-bg)', fontWeight: '900', fontSize: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                  }}
                >
                  <Plus size={18} /> CREATE FOOD WITH THIS BARCODE
                </button>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '600' }}>Try a broader search or add it manually in the Kitchen Lab</div>
              )}
            </div>
          )}
          
          {errorMsg && <div style={{ color: 'var(--theme-error)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{errorMsg}</div>}

              {/* AI Review Step */}
              {isAiReviewing && aiStagedResults.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', border: '1px solid var(--theme-accent)', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Sparkles size={18} color="var(--theme-accent)" /> REVIEW DETECTED MEAL
                    </div>
                    <button onClick={() => { setIsAiReviewing(false); setAiStagedResults([]); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--theme-text-dim)', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}><X size={18} /></button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {aiStagedResults.map((f, i) => {
                      const multiplier = computeMultiplier(f.serving || '100g', f.stagedUnit || 'serving', parseFloat(String(f.stagedQty)) || 1);
                      
                      return (
                        <div key={i} className="glass-card" style={{ 
                          padding: 'var(--space-md)', 
                          width: '100%',
                          boxSizing: 'border-box'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
                            <input 
                              value={f.name} 
                              onChange={(e) => {
                                const next = [...aiStagedResults];
                                next[i] = { ...f, name: e.target.value };
                                setAiStagedResults(next);
                              }}
                              style={{ 
                                flex: 1,
                                minWidth: '140px',
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid var(--theme-border)', 
                                borderRadius: '12px',
                                color: 'var(--theme-text)', 
                                fontWeight: '900', 
                                fontSize: '14px', 
                                outline: 'none', 
                                padding: '10px'
                              }}
                            />
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
                                  color: f.showNutrientIntel ? 'var(--theme-accent)' : 'var(--theme-text-dim)', 
                                  borderRadius: '8px', padding: '6px 10px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                <Info size={12} /> {f.showNutrientIntel ? 'HIDE' : 'INFO'}
                              </button>
                                <button onClick={() => {
                                  const next = aiStagedResults.filter((_, idx) => idx !== i);
                                  setAiStagedResults(next);
                                  if (next.length === 0) setIsAiReviewing(false);
                                }} style={{ background: 'none', border: 'none', color: 'var(--theme-error)', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
                              </div>
                          </div>

                          {/* Quick Stats Row - Distinguishing Bubble */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px', background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)', padding: '10px', borderRadius: '16px' }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '8px', color: 'var(--theme-text-dim)', fontWeight: '700' }}>KCAL</div><div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--theme-text)' }}>{Math.round((Number(f.cal) || 0) * multiplier)}</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '8px', color: 'var(--theme-text-dim)', fontWeight: '700' }}>P</div><div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--theme-error)' }}>{((Number(f.p) || 0) * multiplier).toFixed(1)}g</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '8px', color: 'var(--theme-text-dim)', fontWeight: '700' }}>C</div><div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--theme-accent)' }}>{((Number(f.c) || 0) * multiplier).toFixed(1)}g</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '8px', color: 'var(--theme-text-dim)', fontWeight: '700' }}>F</div><div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--theme-warning)' }}>{((Number(f.f) || 0) * multiplier).toFixed(1)}g</div></div>
                          </div>
                      
                        {/* Nutrition Intel Expandable Block */}
                        {f.showNutrientIntel && (
                          <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <NutritionFactsDisplay 
                              food={f} 
                              multiplier={multiplier} 
                              onEdit={(key, val) => {
                                const next = [...aiStagedResults];
                                next[i] = { ...f, [key]: val };
                                setAiStagedResults(next);
                              }}
                            />
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
                            {SERVING_UNITS.map(u => <option key={u.v} value={u.v} style={{ background: 'var(--theme-panel)', color: 'var(--theme-text)' }}>{u.v}</option>)}
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfiguringFood(f);
                              setEditName(f.name || '');
                              setServingQty(f.stagedQty || '1');
                              setServingUnit(f.stagedUnit || 'serving');
                            }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text)', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                          >
                            <Info size={12} color="var(--theme-accent)" /> TWEAK INGREDIENT
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>

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
                      background: 'rgba(0, 201, 255, 0.03)', 
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
                      marginBottom: '20px'
                    }}
                  >
                    <Plus size={18} /> ADD INGREDIENT
                  </button>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => {
                        aiStagedResults.forEach(f => {
                          const mult = computeMultiplier(f.serving || '', f.stagedUnit || 'serving', parseFloat(String(f.stagedQty)) || 1);
                          const scaled = scaleLegacyFoodByAmount(f, mult);
                          addFoodLog('Breakfast', scaled);
                        });
                        setIsAiReviewing(false);
                        setAiStagedResults([]);
                        alert("Meal logged to Breakfast!");
                      }}
                      style={{ flex: 1, minWidth: '140px', padding: '14px', background: 'var(--theme-accent)', border: 'none', borderRadius: '16px', color: 'var(--theme-bg)', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 15px var(--theme-accent-dim)' }}>
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
                      style={{ flex: 1, minWidth: '140px', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'var(--theme-text-on-panel)', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                      SAVE TO PANTRY
                    </button>
                  </div>
                </div>
              )}
            </div>
        )}

{activeTab === 'saved' && pantryMode === 'create' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => setPantryMode('list')} style={{ background: 'var(--theme-panel-dim)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronDown size={20} style={{ transform: 'rotate(90deg)' }} /></button>
            <div style={{ background: 'var(--theme-panel-dim)', padding: '6px 16px', borderRadius: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'rgba(255,255,255,0.9)' }}>{editingIndex !== null ? 'EDIT KITCHEN ITEM' : 'KITCHEN LAB'}</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <button onClick={() => setCreateTab('basics')} style={{ padding: '10px', borderRadius: '12px', border: createTab === 'basics' ? '1px solid var(--theme-accent)' : '1px solid transparent', background: createTab === 'basics' ? 'var(--theme-accent-dim)' : 'var(--theme-panel-dim)', color: createTab === 'basics' ? 'var(--theme-accent)' : 'rgba(255,255,255,0.9)', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>Basics</button>
            <button onClick={() => setCreateTab('micros')} style={{ padding: '10px', borderRadius: '12px', border: createTab === 'micros' ? '1px solid var(--theme-accent)' : '1px solid transparent', background: createTab === 'micros' ? 'var(--theme-accent-dim)' : 'var(--theme-panel-dim)', color: createTab === 'micros' ? 'var(--theme-accent)' : 'rgba(255,255,255,0.9)', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>Micros & Health</button>
            <button onClick={() => setCreateTab('recipe')} style={{ padding: '10px', borderRadius: '12px', border: createTab === 'recipe' ? '1px solid var(--theme-accent)' : '1px solid transparent', background: createTab === 'recipe' ? 'var(--theme-accent-dim)' : 'var(--theme-panel-dim)', color: createTab === 'recipe' ? 'var(--theme-accent)' : 'rgba(255,255,255,0.9)', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>Recipe Builder</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            <div style={{ display: createTab === 'basics' ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <EntryField label="Food Name" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="e.g. Grilled Chicken" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <EntryField label="Serving Amount" value={String(form.sQty || 100)} onChange={v => setForm({...form, sQty: parseFloat(v) || 0})} placeholder="100" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <label style={{ fontSize: '10px', color: 'var(--theme-accent)', fontWeight: '800' }}>SERVING UNIT</label>
                <select 
                  className="inp"
                  value={form.sUnit}
                  onChange={e => setForm({...form, sUnit: e.target.value})}
                  style={{ padding: '10px 12px', fontSize: '13px', background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text)', fontWeight: '800' }}>
                  {SERVING_UNITS.map(u => <option key={u.v} value={u.v} style={{background: 'var(--theme-panel)'}}>{u.v}</option>)}
                </select>
              </div>
            </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
                 <EntryField label="Protein (g)" value={String(form.p || 0)} onChange={v => {
                   const p = parseFloat(v) || 0;
                   const nextForm = {...form, p};
                   const smartCal = ((nextForm.p || 0) * 4) + ((nextForm.c || 0) * 4) + ((nextForm.f || 0) * 9);
                   setForm({...nextForm, cal: Math.round(smartCal)});
                 }} placeholder="0" />
                 <EntryField label="Carbs (g)" value={String(form.c || 0)} onChange={v => {
                   const c = parseFloat(v) || 0;
                   const nextForm = {...form, c};
                   const smartCal = ((nextForm.p || 0) * 4) + ((nextForm.c || 0) * 4) + ((nextForm.f || 0) * 9);
                   setForm({...nextForm, cal: Math.round(smartCal)});
                 }} placeholder="0" />
                 <EntryField label="Fat (g)" value={String(form.f || 0)} onChange={v => {
                   const f = parseFloat(v) || 0;
                   const nextForm = {...form, f};
                   const smartCal = ((nextForm.p || 0) * 4) + ((nextForm.c || 0) * 4) + ((nextForm.f || 0) * 9);
                   setForm({...nextForm, cal: Math.round(smartCal)});
                 }} placeholder="0" />
                 <div style={{ position: 'relative' }}>
                    <EntryField label="Calories (Total)" value={String(form.cal || 0)} onChange={v => setForm({...form, cal: parseFloat(v) || 0})} placeholder="0" />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '8px', color: 'var(--theme-accent)', fontWeight: '900' }}>P:4 C:4 F:9 SMART</div>
                 </div>
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

            </div>

            <div style={{ display: createTab === 'recipe' ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid var(--theme-border)' }}>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-accent)', marginBottom: '8px', display: 'block' }}>ADD INGREDIENTS</label>
              <form onSubmit={handleIngSearch} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  className="inp" placeholder="Search recipe ingredients..." 
                  value={ingQuery} onChange={e => {
                    setIngQuery(e.target.value);
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
                    width: '100%', padding: '10px', 
                    background: isPantryPickerOpen ? 'var(--theme-accent-dim)' : 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--theme-border)', borderRadius: '12px',
                    color: isPantryPickerOpen ? 'var(--theme-accent)' : 'var(--theme-text-dim)',
                    fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s'
                  }}>
                  <BookmarkCheck size={16} /> {isPantryPickerOpen ? 'Dismiss Pantry' : 'Browse Your Pantry'}
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
                            padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '12px', whiteSpace: 'nowrap', cursor: 'pointer', textAlign: 'left', minWidth: '140px', maxWidth: '200px', flexShrink: 0,
                            display: 'flex', flexDirection: 'column', gap: '2px'
                          }}>
                          <div style={{ 
                            fontSize: '11px', fontWeight: '800', color: '#fff', marginBottom: '2px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>{f.name}</div>
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
                {(form.ingredientItems || []).map((item: RecipeItem, i: number) => (
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
            </div>

            <div style={{ display: createTab === 'micros' ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Collapsible Sections */}
              <CollapsibleEntrySection 
                title="Fats & Fiber" 
                isOpen={openSection === 'fats' || true} 
                onToggle={() => setOpenSection(openSection === 'fats' ? null : 'fats')}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
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
                  isOpen={openSection === cat.cat || true} 
                  onToggle={() => setOpenSection(openSection === cat.cat ? null : cat.cat)}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
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
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--theme-border)', opacity: 0.3, margin: '8px 0' }} />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  const foodData: Food = { 
                    ...form,
                    serving: `${form.sQty || '1'} ${form.sUnit || 'serving'}`,
                    sQty: Number(form.sQty) || 1,
                    sUnit: form.sUnit || 'serving'
                  };
                  const keys = ['cal', 'p', 'c', 'f', 'fiber', 'sugars', 'sat', 'mono', 'poly', 'trans', 'chol', 'Sodium', 'Potassium', 'Calcium', 'Magnesium', ...ALL_MICRO_KEYS];
                  keys.forEach(k => {
                    const fd = foodData as any;
                    if (fd[k] !== undefined && fd[k] !== '') {
                      fd[k] = Number(fd[k]);
                    }
                  });
                  if (editingIndex !== null) updateCustomFood(editingIndex, foodData);
                  else saveCustomFood(foodData);
                  setPantryMode('list');
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
                style={{ flex: 2, padding: '14px', background: 'var(--theme-accent)', border: 'none', borderRadius: '12px', color: 'var(--theme-bg, #000)', fontWeight: '800', cursor: 'pointer' }}>
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
          </div>
        </div>
      )}


      {activeTab === 'saved' && pantryMode === 'list' && (
        <div className="section" style={{ marginTop: '0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
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
              setPantryMode('create');
              setCreateTab('basics');
            }}
            style={{ width: '100%', padding: '12px 16px', background: 'var(--theme-accent)', border: 'none', borderRadius: '16px', color: 'var(--theme-bg, #000)', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,201,255,0.2)' }}>
            <Plus size={16} /> CREATE NEW FOOD OR RECIPE
          </button>

          {/* Filters from Image 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
            <PantryFilter label="All" active={filterType === 'all'} onClick={() => setFilterType('all')} />
            <PantryFilter label="Favorites" active={filterType === 'fav'} onClick={() => setFilterType('fav')} />
            <PantryFilter label="Protein" active={filterType === 'high-p'} onClick={() => setFilterType('high-p')} />
            <PantryFilter label="Recipes" active={filterType === 'recipe'} onClick={() => setFilterType('recipe')} />
          </div>

          {[...customFoods]
            .filter((f: Food) => {
              if (filterType === 'fav') return f.favorite;
              if (filterType === 'high-p') return (f.p * 4) / (f.cal || 1) > 0.3;
              if (filterType === 'recipe') return (f.ingredientItems?.length || 0) > 0 || (f as any).type === 'recipe';
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
                  className="glass-card luminous-breath"
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer', 
                    borderLeft: '4px solid var(--theme-accent, #00C9FF)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--theme-text-on-panel)' }}>{f.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim-on-panel)', marginTop: '2px' }}>{f.serving} • {f.cal} kcal • P:{f.p}g C:{f.c}g F:{f.f}g</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm(f);
                        setEditingIndex(originalIdx);
                        setPantryMode('create');
                        setCreateTab('basics');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${f.name}" from your Pantry?`)) {
                          deleteCustomFood(originalIdx);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,0.5)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={18} />
                    </button>
                    <Plus size={18} color="var(--theme-accent)" />
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
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 1500, 
          background: 'rgba(0,0,0,0.85)', 
          backdropFilter: 'blur(10px)', 
          display: 'flex', 
          alignItems: 'flex-end' 
        }}>
          <div style={{ 
            width: '100%', 
            maxHeight: '85vh', 
            background: 'var(--theme-bg, #0a0d11)', 
            borderTop: '2px solid var(--theme-accent)', 
            borderRadius: '24px 24px 0 0', 
            padding: '24px 24px 120px 24px', 
            overflowY: 'auto' 
          }}>
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
                      const val = (Number((configuringFood as Food)[k as keyof Food]) || 0) * computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1);
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
                  style={{ width: '100%', padding: '16px', background: 'var(--theme-success, #92FE9D)', border: 'none', borderRadius: '16px', color: 'var(--theme-bg, #000)', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(146,254,157,0.15)' }}>
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
                    setActiveTab('saved');
                    setPantryMode('create');
                    setCreateTab('recipe');
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


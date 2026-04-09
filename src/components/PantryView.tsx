import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { Plus, Trash2, ChevronDown, ChevronUp, Search, Loader2, Utensils, BookmarkPlus, Edit3, Sparkles, Beaker, Check, X, Info, LogIn, Scale } from 'lucide-react';
import { ALL_MICRO_KEYS, MEALS, MICRO_UNITS } from '../lib/constants';
import { NUTRIENT_BENEFITS } from '../lib/nutrient-info';
import { computeMultiplier, scaleLegacyFoodByAmount, COMMON_UNITS } from '../lib/food/serving-converter';
import ReactDOM from 'react-dom';
import { calculateVitalityScore } from '../lib/scoring/vitality';
import { VitalityBadge } from './VitalityBadge';
import { ScannerModal } from './ScannerModal';
import { AddToDiaryTab } from './AddToDiaryTab';
import { SearchCoaster, type SearchTab } from './SearchCoaster';

export const PantryView: React.FC = () => {
  const { 
    localCache, saveCustomFood, updateCustomFood, deleteCustomFood, addFoodLog,
    stagingTray, addToTray, removeFromTray, updateTrayItem, clearTray
  } = useDiary();
  
  const [form, setForm] = useState<any>({ name: '', cal: '', p: '', c: '', f: '', ingredients: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showMicros, setShowMicros] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'manual' | 'saved' | 'diary'>('search');
  const [activeScanner, setActiveScanner] = useState<'barcode' | 'qr' | 'label' | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recipeSearchMode, setRecipeSearchMode] = useState<'keyword' | 'describe'>('keyword');
  const [innerGlobalSearchTab, setInnerGlobalSearchTab] = useState<SearchTab>('search');
  
  const customFoods = localCache.customFoods || [];
  const [loggingFood, setLoggingFood] = useState<any | null>(null);
  // Recipe Creator State
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [ingredientSearchResults, setIngredientSearchResults] = useState<any[]>([]);
  const [pickingIngredient, setPickingIngredient] = useState<any | null>(null);
  const [manualEntryMode, setManualEntryMode] = useState<'manual' | 'ai-describe'>('manual');
  const [mainFormAIDesc, setMainFormAIDesc] = useState('');
  
  // Staging Tray for AI Meals (Matching Modal)
  // REMOVED local state: const [stagingTray, setStagingTray] = useState<any[]>([]);
  const [showMealNutrition, setShowMealNutrition] = useState(false);
  const [logMealType, setLogMealType] = useState(MEALS[0]);

  const handleFieldChange = (key: string, value: string) => {
    const updatedForm = { ...form, [key]: value };
    
    // Auto-calculate calories if a macro was changed
    if (['p', 'c', 'f'].includes(key)) {
      const p = parseFloat(key === 'p' ? value : form.p) || 0;
      const c = parseFloat(key === 'c' ? value : form.c) || 0;
      const f = parseFloat(key === 'f' ? value : form.f) || 0;
      const calc = Math.round((p * 4) + (c * 4) + (f * 9));
      updatedForm.cal = String(calc);
    }
    
    setForm(updatedForm);
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error('API down');
      }
    } catch (err) {
      console.warn("Global Search error", err);
      setErrorMsg('Failed to search global database, showing local results only.');
      setSearchResults(localMatches);
    }
    setIsSearching(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.cal) return;
    
    const foodData: any = {
      name: form.name,
      cal: Number(form.cal) || 0,
      p: Number(form.p) || 0,
      c: Number(form.c) || 0,
      f: Number(form.f) || 0,
      serving: form.serving || '1 serving',
      sUnit: form.sUnit || 'serving',
      sQty: Number(form.sQty) || 1,
      ingredients: form.ingredients || ''
    };
    
    ALL_MICRO_KEYS.forEach(k => {
      if (form[k]) foodData[k] = Number(form[k]);
    });
    
    if (editingIndex !== null) {
      updateCustomFood(editingIndex, foodData);
      setEditingIndex(null);
    } else {
      saveCustomFood(foodData);
    }
    
    setForm({ name: '', cal: '', p: '', c: '', f: '', ingredients: '' });
    setRecipeIngredients([]); // Clear recipe
    if (editingIndex !== null) setActiveTab('saved');
  };

  const handleIngredientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientSearchQuery) return;
    setIsSearching(true);
    
    // Search both local and global
    const localMatches = customFoods.filter((f: any) => 
      f.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase())
    ).map((f: any) => ({ ...f, isLocal: true }));

    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(ingredientSearchQuery)}`);
      if (res.ok) {
        const body = await res.json();
        const globalRes = body.foods || body.results || [];
        setIngredientSearchResults([...localMatches, ...globalRes]);
      } else {
        setIngredientSearchResults(localMatches);
      }
    } catch (err) {
      setIngredientSearchResults(localMatches);
    }
    setIsSearching(false);
  };

  const handleIngredientDescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientSearchQuery) return;
    setIsSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: ingredientSearchQuery })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed AI ingredient parsing');
      
      if (body.foods && body.foods.length > 0) {
        setIngredientSearchResults(body.foods);
      } else {
        setErrorMsg('AI could not parse any ingredients from that description.');
      }
    } catch(err: any) {
      setErrorMsg(err.message);
    }
    setIsSearching(false);
  };

  const handleGlobalAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      if (res.ok) {
        const body = await res.json();
        setSearchResults(body.foods || []);
      } else {
        throw new Error('AI service error. Showing local results instead.');
      }
    } catch (err: any) {
      console.warn("AI Search Error:", err);
      const localMatches = customFoods.filter((f: any) => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).map((f: any) => ({ ...f, isLocal: true }));
      setSearchResults(localMatches);
      setErrorMsg(err.message);
    }
    setIsSearching(false);
  };

  const handleGlobalAIDescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: searchQuery, meal: logMealType })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed AI search parsing');
      
      if (body.foods && body.foods.length > 0) {
        body.foods.forEach((f: any) => addToTray(f));
        setSearchQuery('');
        setSearchResults([]); // Clear any keyword results
      } else {
        setErrorMsg('AI could not parse any foods from that description.');
      }
    } catch(err: any) {
      setErrorMsg(err.message);
    }
    setIsSearching(false);
  };



  const getCombinedTrayNutrition = () => {
    const totals = stagingTray.reduce((acc, item) => {
      const mult = computeMultiplier(item.serving || '', item.unit, item.qty);
      acc.cal += (Number(item.cal) || 0) * mult;
      acc.p += (Number(item.p) || 0) * mult;
      acc.c += (Number(item.c) || 0) * mult;
      acc.f += (Number(item.f) || 0) * mult;
      ALL_MICRO_KEYS.forEach(k => {
        if (item[k]) acc[k] = (acc[k] || 0) + (Number(item[k]) * mult);
      });
      return acc;
    }, { cal: 0, p: 0, c: 0, f: 0 } as any);
    return totals;
  };

  const handleLogMeal = () => {
    if (stagingTray.length === 0) return;
    
    stagingTray.forEach(item => {
      const mult = computeMultiplier(item.serving || '', item.unit, item.qty);
      const scaled = scaleLegacyFoodByAmount(item, mult);
      addFoodLog(logMealType, scaled);
    });
    
    clearTray();
    setShowMealNutrition(false);
  };

  const addIngredientToRecipe = (scaledFood: any) => {
    const newIngredients = [...recipeIngredients, scaledFood];
    setRecipeIngredients(newIngredients);
    
    // Recalculate totals
    const totals = newIngredients.reduce((acc, ing) => {
      acc.cal += Number(ing.cal) || 0;
      acc.p += Number(ing.p) || 0;
      acc.c += Number(ing.c) || 0;
      acc.f += Number(ing.f) || 0;
      return acc;
    }, { cal: 0, p: 0, c: 0, f: 0 });

    setForm({
      ...form,
      cal: String(Math.round(totals.cal)),
      p: String(Math.round(totals.p)),
      c: String(Math.round(totals.c)),
      f: String(Math.round(totals.f)),
      ingredients: newIngredients.map(i => `${i.name} (${i.serving})`).join(', ')
    });
    
    setIsAddingIngredient(false);
    setIngredientSearchResults([]);
    setIngredientSearchQuery('');
  };

  const handleMainFormAIDescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainFormAIDesc) return;
    setIsSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: mainFormAIDesc })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed AI form parsing');
      
      if (body.foods && body.foods.length > 0) {
        const food = body.foods[0];
        setForm({
          name: food.name,
          cal: String(food.cal),
          p: String(food.p),
          c: String(food.c),
          f: String(food.f),
          ingredients: food.ingredients || '',
          serving: food.serving || '1 serving',
          sUnit: food.sUnit || 'serving',
          sQty: food.sQty || 1
        });
        setManualEntryMode('manual'); // Switch to manual to review
        setMainFormAIDesc('');
      } else {
        setErrorMsg('AI could not parse food data from that description.');
      }
    } catch(err: any) {
      setErrorMsg(err.message);
    }
    setIsSearching(false);
  };

  const removeIngredient = (idx: number) => {
    const newIngredients = [...recipeIngredients];
    newIngredients.splice(idx, 1);
    setRecipeIngredients(newIngredients);
    
    const totals = newIngredients.reduce((acc, ing) => {
      acc.cal += Number(ing.cal) || 0;
      acc.p += Number(ing.p) || 0;
      acc.c += Number(ing.c) || 0;
      acc.f += Number(ing.f) || 0;
      return acc;
    }, { cal: 0, p: 0, c: 0, f: 0 });

    setForm({
      ...form,
      cal: String(Math.round(totals.cal)),
      p: String(Math.round(totals.p)),
      c: String(Math.round(totals.c)),
      f: String(Math.round(totals.f)),
      ingredients: newIngredients.map(i => `${i.name} (${i.serving})`).join(', ')
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setForm({ name: '', cal: '', p: '', c: '', f: '', ingredients: '' });
  };

  const handleEditRequest = (idx: number) => {
    const food = customFoods[idx];
    const raw: any = {
      name: food.name,
      cal: String(food.cal),
      p: String(food.p),
      c: String(food.c),
      f: String(food.f),
      ingredients: food.ingredients || '',
      serving: food.serving,
      sUnit: food.sUnit,
      sQty: food.sQty
    };
    ALL_MICRO_KEYS.forEach(k => {
      if (food[k] !== undefined) raw[k] = String(food[k]);
    });
    setForm(raw);
    setEditingIndex(idx);
    setActiveTab('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (index: number) => {
    if (confirm("Are you sure you want to delete this food from your pantry?")) {
      deleteCustomFood(index);
    }
  };

  const mapApiFoodToForm = (food: any) => {
    const raw: any = {
      name: food.name || '',
      cal: String(Math.round(food.cal || 0)),
      p: String(Math.round(food.protein || food.p || 0)),
      c: String(Math.round(food.carbs || food.c || 0)),
      f: String(Math.round(food.fat || food.f || 0)),
      ingredients: food.ingredients || '',
      serving: food.serving || '1 serving',
      sUnit: food.sUnit || 'serving',
      sQty: food.sQty || 1
    };
    ALL_MICRO_KEYS.forEach(k => {
      if (food[k] !== undefined) {
        raw[k] = String(food[k]);
      }
    });
    setForm(raw);
    setShowMicros(true);
    setActiveTab('manual');
  };

  // New QR logic can be added here or just handled via the unified scanner

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Premium Tab Switcher */}
      <div style={{ display: 'flex', background: 'var(--theme-panel-dim, rgba(255,255,255,0.03))', padding: '6px', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', marginBottom: '8px' }}>
          <button 
            onClick={() => setActiveTab('search')}
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', background: activeTab === 'search' ? 'var(--theme-accent-dim, rgba(0,201,255,0.1))' : 'transparent', color: activeTab === 'search' ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #8b8b9b)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Search size={16} /> Global Search
          </button>
          <button 
            onClick={() => { setActiveTab('manual'); if (editingIndex === null) setEditingIndex(null); }}
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', background: activeTab === 'manual' ? 'var(--theme-success-dim, rgba(146,254,157,0.1))' : 'transparent', color: activeTab === 'manual' ? 'var(--theme-success, #92FE9D)' : 'var(--theme-text-dim, #8b8b9b)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={16} /> {editingIndex !== null ? 'Edit Food' : 'Manual Entry'}
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', background: activeTab === 'saved' ? 'var(--theme-warning-dim, rgba(252,196,25,0.1))' : 'transparent', color: activeTab === 'saved' ? 'var(--theme-warning, #FCC419)' : 'var(--theme-text-dim, #8b8b9b)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Utensils size={16} /> My Library
          </button>
      </div>

      {activeTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <SearchCoaster 
                activeTab={innerGlobalSearchTab} 
                onTabChange={(tab) => {
                  if (tab === 'pantry') {
                    setActiveTab('saved');
                  } else if (tab === 'barcode' || tab === 'label') {
                    setActiveScanner(tab);
                  } else {
                    setInnerGlobalSearchTab(tab);
                  }
                }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text)' }}>
                {innerGlobalSearchTab === 'describe' ? <Sparkles size={18} color="var(--theme-accent, #00C9FF)" /> : <Search size={18} color="var(--theme-accent, #00C9FF)" />}
                {innerGlobalSearchTab === 'describe' ? 'AI Meal Description' : innerGlobalSearchTab === 'ai-search' ? 'AI Keyword Search' : 'Global Database Search'}
              </h2>
            </div>

            {innerGlobalSearchTab !== 'describe' ? (
              <form onSubmit={innerGlobalSearchTab === 'search' ? handleGlobalSearch : handleGlobalAISearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  className="inp"
                  placeholder={innerGlobalSearchTab === 'ai-search' ? "AI Keyword Search (e.g. 'sweet potato fries')..." : "Search millions of foods..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" disabled={isSearching} className="btn" style={{ marginTop: 0, width: 'auto', padding: '0 20px' }}>
                  {isSearching ? <Loader2 className="spin" size={18} /> : (innerGlobalSearchTab === 'ai-search' ? <Sparkles size={18} /> : <Search size={18} />)}
                </button>
              </form>
            ) : (
              <form onSubmit={handleGlobalAIDescribe} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <textarea 
                  className="inp"
                  placeholder="Describe what you ate... e.g. 'grilled salmon with asparagus and half a cup of brown rice'"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', padding: '12px' }}
                />
                <button type="submit" disabled={isSearching} className="btn" style={{ marginTop: 0, width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {isSearching ? <Loader2 className="spin" size={20} /> : <Sparkles size={20} />}
                  Parse Description
                </button>
              </form>
            )}

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', padding: '12px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-accent, #00C9FF)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Search Results</div>
                {searchResults.map((food, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px' }}>
                    <div onClick={() => { mapApiFoodToForm(food); setSearchResults([]); setSearchQuery(''); }} style={{ flex: 1, padding: '12px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '8px', cursor: 'pointer', borderLeft: food.isLocal ? '3px solid var(--theme-success, #92FE9D)' : '3px solid var(--theme-accent, #00C9FF)', transition: 'background 0.2s', color: 'var(--theme-text)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {food.name}
                          <VitalityBadge {...calculateVitalityScore(food)} />
                        </div>
                        {food.isLocal && <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--theme-success, #92FE9D)', background: 'var(--theme-success-dim, rgba(146,254,157,0.1))', padding: '2px 6px', borderRadius: '4px' }}>IN PANTRY</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)' }}>{food.cal} kcal • P:{food.p}g C:{food.c}g F:{food.f}g</div>
                    </div>
                    {!food.isLocal && (
                      <button 
                        onClick={() => {
                          saveCustomFood({
                            ...food,
                            p: Number(food.p) || 0,
                            c: Number(food.c) || 0,
                            f: Number(food.f) || 0,
                            cal: Number(food.cal) || 0,
                            serving: food.serving || '100g',
                            sUnit: food.sUnit || 'g',
                            sQty: food.sQty || 100
                          });
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                        title="Quick Save to Pantry"
                        style={{ padding: '12px', background: 'var(--theme-accent-dim, rgba(0,123,255,0.1))', border: 'none', borderRadius: '8px', color: 'var(--theme-accent, #007BFF)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookmarkPlus size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMsg && <div style={{ color: 'var(--theme-error, #FF6B6B)', fontSize: '13px', textAlign: 'center', padding: '10px' }}>{errorMsg}</div>}
        </div>
      )}

      {activeTab === 'manual' && (
        <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text)' }}>
              {editingIndex !== null ? <Edit3 size={18} color="var(--theme-accent, #00C9FF)" /> : <Plus size={18} color="var(--theme-success, #92FE9D)" />} 
              {editingIndex !== null ? 'Modify Pantry Item' : 'New Food Manual Entry'}
            </h2>
            <button 
              onClick={() => setActiveTab('search')}
              style={{ 
                background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', 
                border: '1px solid var(--theme-border, rgba(0,201,255,0.2))', 
                padding: '10px 18px', 
                borderRadius: '12px', 
                color: 'var(--theme-accent, #00C9FF)', 
                fontSize: '13px', 
                fontWeight: '700', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                whiteSpace: 'nowrap'
              }}>
              <Search size={16} /> Search Global
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.02))', padding: '4px', borderRadius: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
            <button 
              type="button"
              onClick={() => setManualEntryMode('manual')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: manualEntryMode === 'manual' ? 'var(--theme-accent-dim)' : 'transparent', color: manualEntryMode === 'manual' ? 'var(--theme-accent)' : '#8b8b9b', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
              Manual Macro Entry
            </button>
            <button 
              type="button"
              onClick={() => setManualEntryMode('ai-describe')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: manualEntryMode === 'ai-describe' ? 'var(--theme-accent-dim)' : 'transparent', color: manualEntryMode === 'ai-describe' ? 'var(--theme-accent)' : '#8b8b9b', fontWeight: '700', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI Description
            </button>
          </div>

          {manualEntryMode === 'ai-describe' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--theme-panel-dim, rgba(0,201,255,0.03))', padding: '16px', borderRadius: '16px', border: '1px dashed var(--theme-accent, rgba(0,201,255,0.2))' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-accent)', display: 'block', marginBottom: '8px' }}>AI Food Parser</label>
                <textarea 
                  className="inp"
                  value={mainFormAIDesc}
                  onChange={e => setMainFormAIDesc(e.target.value)}
                  placeholder="Describe your food... e.g. 'One cup of thick creamy whole milk greek yogurt with honey'"
                  style={{ width: '100%', minHeight: '100px', marginBottom: '12px' }}
                />
                <button 
                  type="button"
                  onClick={handleMainFormAIDescribe}
                  disabled={isSearching}
                  style={{ width: '100%', padding: '14px', background: 'var(--theme-accent)', color: 'var(--theme-panel-base)', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isSearching ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                  Auto-Fill Nutrition Data
                </button>
                <p style={{ fontSize: '11px', color: '#5b5b6b', marginTop: '12px', textAlign: 'center' }}>AI will analyze your description and automatically fill out the form below.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>Food Name</label>
              <input 
                required
                value={form.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                placeholder="e.g. My Grandma's Lasagna"
                style={{ width: '100%', padding: '12px', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--theme-text)' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {['cal', 'p', 'c', 'f'].map((key) => {
                const labels = { cal: 'Cals', p: 'Protein (g)', c: 'Carbs (g)', f: 'Fat (g)' } as any;
                return (
                  <div key={key}>
                    <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>{labels[key]}</label>
                    <input 
                      type="number"
                      step="0.1"
                      required={key === 'cal'}
                      value={form[key] || ''}
                      onChange={e => handleFieldChange(key, e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '12px', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--theme-text)', boxSizing: 'border-box' }}
                    />
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #5b5b6b)', background: 'var(--theme-panel-dim, rgba(255,255,255,0.02))', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--theme-border, rgba(255,255,255,0.03))' }}>
              <strong>💡 Intelligent Tip:</strong> Calories are automatically calculated using the <code style={{ color: 'var(--theme-accent, #00C9FF)' }}>4/4/9</code> formula (P/C/F) as you type.
            </div>

            {/* Recipe Ingredients Section */}
            <div style={{ padding: '16px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.02))', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-accent, #00C9FF)' }}>Recipe Ingredients ({recipeIngredients.length})</label>
                <button 
                  type="button" 
                  onClick={() => setIsAddingIngredient(!isAddingIngredient)}
                  style={{ background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', border: 'none', borderRadius: '8px', color: 'var(--theme-accent, #00C9FF)', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={14} /> {isAddingIngredient ? 'Close Search' : 'Add Ingredient'}
                </button>
              </div>

              {isAddingIngredient && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button 
                      type="button"
                      onClick={() => setRecipeSearchMode('keyword')}
                      style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: 'none', background: recipeSearchMode === 'keyword' ? 'var(--theme-accent-dim)' : 'transparent', color: recipeSearchMode === 'keyword' ? 'var(--theme-accent)' : '#8b8b9b', cursor: 'pointer' }}>
                      Keyword Search
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRecipeSearchMode('describe')}
                      style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: 'none', background: recipeSearchMode === 'describe' ? 'var(--theme-accent-dim)' : 'transparent', color: recipeSearchMode === 'describe' ? 'var(--theme-accent)' : '#8b8b9b', cursor: 'pointer' }}>
                      AI Describe
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {recipeSearchMode === 'keyword' ? (
                      <>
                        <input 
                          className="inp"
                          placeholder="Search items for recipe..."
                          value={ingredientSearchQuery}
                          onChange={e => setIngredientSearchQuery(e.target.value)}
                          onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleIngredientSearch(e); }}}
                        />
                        <button type="button" onClick={handleIngredientSearch} className="btn" style={{ marginTop: 0, padding: '0 16px' }} disabled={isSearching}>
                          {isSearching ? <Loader2 className="spin" size={16} /> : <Search size={16} />}
                        </button>
                      </>
                    ) : (
                      <>
                        <textarea 
                          className="inp"
                          placeholder="Describe ingredients... e.g. '2 cups of diced chicken breast'"
                          value={ingredientSearchQuery}
                          onChange={e => setIngredientSearchQuery(e.target.value)}
                          style={{ flex: 1, minHeight: '60px', padding: '12px' }}
                        />
                        <button type="button" onClick={handleIngredientDescribe} className="btn" style={{ marginTop: 0, padding: '0 16px' }} disabled={isSearching}>
                          {isSearching ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                        </button>
                      </>
                    )}
                  </div>

                  {ingredientSearchResults.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {ingredientSearchResults.map((food, i) => (
                        <div key={i} onClick={() => setPickingIngredient(food)} style={{ padding: '10px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', borderLeft: food.isLocal ? '3px solid var(--theme-success, #92FE9D)' : '3px solid var(--theme-accent, #00C9FF)' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--theme-text)' }}>{food.name} {food.isLocal && '(Pantry)'}</div>
                          <div style={{ fontSize: '10px', color: '#8b8b9b' }}>{food.cal} kcal • P:{food.p}g C:{food.c}g F:{food.f}g</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {recipeIngredients.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recipeIngredients.map((ing, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>{ing.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)' }}>{ing.serving} • {ing.cal} kcal</div>
                      </div>
                      <button type="button" onClick={() => removeIngredient(idx)} style={{ padding: '6px', background: 'none', border: 'none', color: 'var(--theme-error, #FF6B6B)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: '#5b5b6b', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                  No ingredients added yet. Build your food from items in your pantry!
                </div>
              )}
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>Ingredients List (Description)</label>
              <textarea 
                value={form.ingredients}
                onChange={e => setForm({...form, ingredients: e.target.value})}
                placeholder="e.g. Organic Oats, Cane Sugar, Natural Flavor..."
                style={{ width: '100%', padding: '12px', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--theme-text)', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div>
              <button type="button" onClick={() => setShowMicros(!showMicros)} style={{ background: 'none', border: 'none', color: 'var(--theme-accent, #00C9FF)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '0' }}>
                {showMicros ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {showMicros ? "Hide" : "Show"} all Micronutrients
              </button>
              {showMicros && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', marginTop: '12px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '12px', borderRadius: '12px' }}>
                  {ALL_MICRO_KEYS.map(k => (
                    <div key={k}>
                      <label style={{ fontSize: '10px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k}</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={form[k] || ''}
                        onChange={e => setForm({...form, [k]: e.target.value})}
                        placeholder="0"
                        style={{ width: '100%', padding: '6px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.4))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '10px', color: 'var(--theme-text, #fff)', boxSizing: 'border-box', fontSize: '12px' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" style={{ flex: 1, background: editingIndex !== null ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-success, #92FE9D)', color: 'var(--theme-panel-base, #000)', padding: '14px', borderRadius: '14px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                {editingIndex !== null ? <Check size={16} /> : <Plus size={16} />} 
                {editingIndex !== null ? 'Update Item' : 'Save to Pantry'}
              </button>
              {editingIndex !== null && (
                <button type="button" onClick={cancelEdit} style={{ flex: 1, background: 'var(--theme-panel, rgba(255,255,255,0.05))', color: 'var(--theme-text)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', padding: '14px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
            </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px', minHeight: '400px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text, #fff)' }}>
            <Utensils size={18} color="var(--theme-warning, #FCC419)" /> My Custom Database
          </h2>
          
          {customFoods.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--theme-text-dim, #8b8b9b)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🍱</div>
              <div style={{ fontWeight: '600' }}>Your pantry is empty.</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Add your first custom food or scan a label to get started!</div>
              <button onClick={() => setActiveTab('search')} style={{ marginTop: '20px', background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', border: '1px solid var(--theme-border, rgba(0,201,255,0.2))', padding: '10px 20px', borderRadius: '12px', color: 'var(--theme-accent, #00C9FF)', fontWeight: '600', cursor: 'pointer' }}>
                Go to Search
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {customFoods.map((f: any, idx: number) => (
                <SavedFoodItem 
                  key={idx} 
                  food={f} 
                  onDelete={() => handleDelete(idx)} 
                  onEdit={() => handleEditRequest(idx)}
                  onLogRequest={() => setLoggingFood(f)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'diary' && (
        <AddToDiaryTab customFoods={customFoods} />
      )}

      {activeScanner && (
        <ScannerModal 
          type={activeScanner}
          onClose={() => setActiveScanner(null)}
          onResult={(data) => {
            // ScannerModal now returns the food data directly for all scan types
            mapApiFoodToForm(data);
          }}
        />
      )}

      {pickingIngredient && (
        <IngredientPickerModal 
          food={pickingIngredient}
          onClose={() => setPickingIngredient(null)}
          onAdd={(scaled: any) => {
            addIngredientToRecipe(scaled);
            setPickingIngredient(null);
          }}
        />
      )}

      {loggingFood && (
        <PantryLogModal 
          food={loggingFood} 
          onClose={() => setLoggingFood(null)} 
        />
      )}
      
      {/* MEAL PREVIEW / STAGING TRAY (Matching Modal) */}
      {stagingTray.length > 0 && (
        <div style={{ 
          position: 'sticky',
          bottom: '20px',
          margin: '0 -10px',
          zIndex: 100,
          background: 'var(--theme-panel-base, #10141f)', 
          border: '1px solid var(--theme-border, rgba(255,255,255,0.1))',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 -20px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'var(--theme-accent, #00C9FF)', width: '10px', height: '10px', borderRadius: '5px' }}></div>
              <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--theme-text)' }}>Meal Preview ({stagingTray.length})</span>
            </div>
            <select 
              value={logMealType}
              onChange={(e) => setLogMealType(e.target.value)}
              style={{ padding: '6px 12px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '10px', color: 'var(--theme-text)', fontSize: '13px', fontWeight: '700', outline: 'none' }}
            >
              {MEALS.map(m => <option key={m} value={m} style={{ color: '#000' }}>{m}</option>)}
            </select>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
            {stagingTray.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '600' }}>{Math.round(item.cal * computeMultiplier(item.serving || '', item.unit, item.qty))} kcal</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={item.qty} 
                    onChange={(e) => updateTrayItem(idx, { qty: parseFloat(e.target.value) || 0 })}
                    style={{ width: '50px', padding: '8px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '8px', color: 'var(--theme-text)', fontSize: '13px', textAlign: 'center', fontWeight: '700' }}
                  />
                  <select 
                    value={item.unit}
                    onChange={(e) => updateTrayItem(idx, { unit: e.target.value })}
                    style={{ padding: '8px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '8px', color: 'var(--theme-text)', fontSize: '12px', fontWeight: '600', outline: 'none' }}
                  >
                    {COMMON_UNITS.map(u => <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.label}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => removeFromTray(idx)} style={{ background: 'var(--theme-panel-dim, rgba(255,107,107,0.1))', border: 'none', color: '#ff6b6b', width: '32px', height: '32px', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingTop: '12px' }}>
            <button 
              type="button"
              onClick={() => setShowMealNutrition(!showMealNutrition)}
              style={{ 
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.02))',
                border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '14px',
                color: 'var(--theme-text)', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
                <Beaker size={16} color="var(--theme-accent, #00C9FF)" /> Full Meal Nutrition Breakdown
              </div>
              {showMealNutrition ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showMealNutrition && (
              <div style={{ 
                marginBottom: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)',
                borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.03))',
                maxHeight: '250px', overflowY: 'auto'
              }}>
                <NutritionFactsDisplay food={getCombinedTrayNutrition()} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => clearTray()} style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-dim, #8b8b9b)', borderRadius: '14px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Clear</button>
              <button type="button" onClick={handleLogMeal} style={{ flex: 1, padding: '14px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', borderRadius: '14px', border: 'none', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(0,201,255,0.2)' }}>
                <Check size={20} /> Log to Diary Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NutrientDetailRow = ({ label, value, unit, benefit }: any) => {
  const [showBenefit, setShowBenefit] = useState(false);
  
  return (
    <div style={{ padding: '12px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', borderRadius: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.03))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--theme-text, #fff)' }}>{label}</span>
          {benefit && (
            <button 
              onClick={() => setShowBenefit(!showBenefit)}
              style={{ background: 'none', border: 'none', color: showBenefit ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #5b5b6b)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
              <Info size={14} />
            </button>
          )}
        </div>
        <span style={{ fontWeight: '800', fontSize: '12px', color: 'var(--theme-accent, #00C9FF)' }}>{value}{unit}</span>
      </div>
      
      {showBenefit && benefit && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', lineHeight: '1.4', fontStyle: 'italic', marginBottom: '8px' }}>
            {benefit.summary}
          </div>
          {benefit.points && benefit.points.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {benefit.points.map((p: string, pi: number) => (
                <div key={pi} style={{ display: 'flex', gap: '6px', fontSize: '10px', color: 'var(--theme-text-dim, #c0c0d0)', lineHeight: '1.3' }}>
                  <span style={{ color: 'var(--theme-accent, #00C9FF)' }}>•</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SavedFoodItem = ({ food, onDelete, onEdit, onLogRequest }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', borderRadius: '16px', borderLeft: '3px solid var(--theme-success, #92FE9D)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            style={{ 
              background: isOpen ? 'var(--theme-accent-dim, rgba(0,201,255,0.1))' : 'var(--theme-panel, rgba(255,255,255,0.05))', 
              border: 'none', 
              color: isOpen ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #8b8b9b)', 
              padding: '8px 12px', 
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isOpen ? 'HIDE' : 'DETAILS'}
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: '600', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {food.name}
              <VitalityBadge {...calculateVitalityScore(food)} />
            </div>
            <div style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>(P:{food.p}g C:{food.c}g F:{food.f}g)</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span>{food.cal} kcal</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
          <button 
            onClick={onEdit} 
            title="Edit this food"
            style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', color: 'var(--theme-text-dim, #8b8b9b)', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>
            <Edit3 size={16} />
          </button>
          <button 
            onClick={onLogRequest}
            title="Log to today's diary"
            style={{ background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', border: 'none', color: 'var(--theme-accent, #00C9FF)', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LogIn size={16} /> <span style={{ fontSize: '12px', fontWeight: '700' }}>LOG</span>
          </button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--theme-error, #FF6B6B)', cursor: 'pointer', padding: '8px' }}>
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{ margin: '4px 12px 12px 24px', padding: '20px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
           <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-accent, #00C9FF)', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>Nutrition Intelligence</div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '9px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', marginBottom: '2px' }}>Protein</div>
              <div style={{ fontWeight: '800', color: 'var(--theme-error, #FF6B6B)', fontSize: '16px' }}>{food.p}g</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '9px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', marginBottom: '2px' }}>Carbs</div>
              <div style={{ fontWeight: '800', color: '#4DABF7', fontSize: '16px' }}>{food.c}g</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '9px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', marginBottom: '2px' }}>Fat</div>
              <div style={{ fontWeight: '800', color: 'var(--theme-warning, #FCC419)', fontSize: '16px' }}>{food.f}g</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Protein', ...ALL_MICRO_KEYS].map(k => {
               const val = food[k];
               if (val !== undefined && val !== 0) {
                 const benefit = (NUTRIENT_BENEFITS as any)[k];
                 const unit = (MICRO_UNITS as any)[k] || 'g';
                 return (
                   <NutrientDetailRow 
                    key={k}
                    label={k}
                    value={val}
                    unit={unit}
                    benefit={benefit}
                   />
                 );
               }
               return null;
            })}
          </div>

          {food.ingredients && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--theme-accent, #00C9FF)', letterSpacing: '2px', marginBottom: '10px', textTransform: 'uppercase' }}>Ingredients Label</div>
              <div style={{ 
                fontSize: '11px', 
                color: 'var(--theme-text-dim, #c0c0d0)', 
                lineHeight: '1.6', 
                background: 'var(--theme-panel-dim, rgba(255,255,255,0.03))', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid var(--theme-border, rgba(255,255,255,0.02))',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                {food.ingredients}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PantryLogModal = ({ food, onClose }: { food: any, onClose: () => void }) => {
  const { addFoodLog } = useDiary();
  const [meal, setMeal] = useState('Breakfast');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('serving');

  const currentMultiplier = computeMultiplier(food.serving || '1 serving', unit, parseFloat(qty) || 0);
  const previewCals = Math.round((food.cal || 0) * currentMultiplier);

  const handleConfirm = () => {
    const q = parseFloat(qty) || 1;
    const mult = computeMultiplier(food.serving || '1 serving', unit, q);
    const updated = scaleLegacyFoodByAmount(food, mult);
    
    const unitLabel = COMMON_UNITS.find((u: any) => u.id === unit)?.label || unit;
    updated.serving = `${q} ${unitLabel} (Scaled)`;
    
    addFoodLog(meal, updated);
    onClose();
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'var(--theme-bg, rgba(0,0,0,0.85))', backdropFilter: 'blur(12px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--theme-panel-base, #10141f)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '28px', width: '100%', maxWidth: '420px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--theme-text)' }}>
            <Scale size={20} color="var(--theme-accent, #00C9FF)" /> Quick Log Food
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim, #8b8b9b)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--theme-panel, rgba(255,255,255,0.03))', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: 'var(--theme-accent, #00C9FF)' }}>{food.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)' }}>Base Serving: {food.serving}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>Target Meal</label>
            <select className="inp" value={meal} onChange={e => setMeal(e.target.value)} style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.5))', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', borderRadius: '12px', padding: '12px', color: 'var(--theme-text, white)', outline: 'none' }}>
              {MEALS.map(m => <option key={m} value={m} style={{ color: '#000' }}>{m}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>Quantity</label>
              <input 
                type="number"
                step="0.1"
                className="inp"
                value={qty}
                onChange={e => setQty(e.target.value)}
                style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.5))', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', borderRadius: '12px', padding: '12px', color: 'var(--theme-text, white)', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>Unit</label>
              <select 
                className="inp"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.5))', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', borderRadius: '12px', padding: '12px', color: 'var(--theme-text, white)', outline: 'none' }}
              >
                {COMMON_UNITS.map(u => <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--theme-accent-dim, rgba(0,201,255,0.05))', borderRadius: '16px', border: '1px solid var(--theme-accent-dim, rgba(0,201,255,0.1))' }}>
            <div style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '4px' }}>Resulting Intake</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--theme-success, #92FE9D)' }}>{previewCals} <span style={{ fontSize: '14px', fontWeight: '500' }}>kcal</span></div>
          </div>

          <button onClick={handleConfirm} style={{ background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', marginTop: 0, height: '54px', fontSize: '16px', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Check size={18} /> Add to Diary
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const IngredientPickerModal = ({ food, onClose, onAdd }: any) => {
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('serving');

  const currentMultiplier = computeMultiplier(food.serving || '1 serving', unit, parseFloat(qty) || 0);
  const preview = scaleLegacyFoodByAmount(food, currentMultiplier);

  const handleConfirm = () => {
    const q = parseFloat(qty) || 1;
    const mult = computeMultiplier(food.serving || '1 serving', unit, q);
    const scaled = scaleLegacyFoodByAmount(food, mult);
    
    const unitLabel = COMMON_UNITS.find((u: any) => u.id === unit)?.label || unit;
    scaled.serving = `${q} ${unitLabel}`;
    
    onAdd(scaled);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#1a1d23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '380px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>Add Ingredient</h3>
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--theme-accent, #00C9FF)' }}>{food.name}</div>
          <div style={{ fontSize: '11px', color: '#8b8b9b' }}>Base: {food.serving}</div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label className="lbl" style={{ marginBottom: '4px', display: 'block' }}>Qty</label>
            <input type="number" step="0.1" className="inp" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div style={{ flex: 2 }}>
            <label className="lbl" style={{ marginBottom: '4px', display: 'block' }}>Unit</label>
            <select className="inp" value={unit} onChange={e => setUnit(e.target.value)}>
              {COMMON_UNITS.map(u => <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(146,254,157,0.05)', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--theme-success, #92FE9D)' }}>{Math.round(preview.cal)} kcal</div>
          <div style={{ fontSize: '10px', color: '#8b8b9b' }}>P:{preview.p}g C:{preview.c}g F:{preview.f}g</div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleConfirm} style={{ flex: 1, padding: '12px', background: 'var(--theme-success, #92FE9D)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Add</button>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {macros.map(([k, v]) => {
          const labels: any = { cal: 'Calories', p: 'Protein', c: 'Carbs', f: 'Fat', fb: 'Fiber', sugars: 'Sugars', sat: 'Saturated', mono: 'Monounsaturated', poly: 'Polyunsaturated', trans: 'Trans Fat', chol: 'Cholesterol', Sodium: 'Sodium', Potassium: 'Potassium' };
          const units: any = { cal: 'kcal', p: 'g', c: 'g', f: 'g', fb: 'g', sugars: 'g', sat: 'g', mono: 'g', poly: 'g', trans: 'g', chol: 'mg', Sodium: 'mg', Potassium: 'mg' };
          return (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '12px', color: '#8b8b9b' }}>{labels[k] || k}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text)' }}>{Math.round(Number(v))}{units[k] || 'g'}</span>
            </div>
          );
        })}
      </div>
      
      {micros.length > 0 && (
        <>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {micros.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '11px', color: '#5b5b6b' }}>{k}</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--theme-accent, #00C9FF)' }}>{Math.round(Number(v))}{unitMap[k] || 'mg'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

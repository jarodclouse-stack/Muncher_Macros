import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { 
  Plus, Check, X, Search, Sparkles, ChevronDown, 
  Flame, Activity, Trash2, Loader2, BookmarkCheck,
  Info, Edit2, Camera, Brain, Lightbulb, ClipboardList, CheckCircle,
  AlertTriangle, TrendingDown, Zap, Egg, Wheat, Salad, Apple, Coffee,
  GlassWater, Cookie, Utensils, Dumbbell
} from 'lucide-react';
import { ALL_MICRO_KEYS, SERVING_UNITS, MICRO_CATEGORIES } from '../lib/constants';
import { computeMultiplier, normalizeFoodResult, scaleLegacyFoodByAmount, calculateMacroBalance, scaleToTarget, getCarbClassification, estimateNutriScore, getQuantityForUnit } from '../lib/food/serving-converter';
import { getPairingSuggestions } from '../lib/food/smart-pairing';

import { SearchCoaster, type SearchTab } from './SearchCoaster';
import { NutritionFactsDisplay } from './NutritionFactsDisplay';
import { BarcodeScanner } from './BarcodeScanner';
import { ConfirmDialog } from './ConfirmDialog';
import { PromptDialog } from './PromptDialog';
import { NutriScorePopup } from './NutriScorePopup';
import type { Food, RecipeItem } from '../types/food';

const getCategoryIcon = (cat: string, size = 16) => {
  switch (String(cat).toLowerCase()) {
    case 'protein': return <Egg size={size} color="#F2994A" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'grain': return <Wheat size={size} color="#F2C94C" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'vegetable': return <Salad size={size} color="#27AE60" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'fruit': return <Apple size={size} color="#EB5757" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'dairy': return <GlassWater size={size} color="#56CCF2" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'sauce':
    case 'condiment': return <GlassWater size={size} color="#E08030" opacity={0.8} style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'topping': return <Sparkles size={size} color="#F2C94C" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'side': return <Utensils size={size} color="#BDBDBD" opacity={0.8} style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'beverage': return <Coffee size={size} color="#8D5B4C" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'dessert':
    case 'snack': return <Cookie size={size} color="#D35400" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
    default: return <Utensils size={size} color="#BDBDBD" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
  }
};

const getMineralIcon = (key: string, size = 11) => {
  if (key === 'iron') return <Dumbbell size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
  if (key === 'sodium') return <AlertTriangle size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
  if (key === 'calcium') return <Activity size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
  if (key === 'potassium') return <Zap size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
  return null;
};

const getCarbClassIcon = (key: string, size = 11) => {
  switch (key) {
    case 'sustained-energy': return <Wheat size={size} color="#F2C94C" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
    case 'natural-carbs': return <Apple size={size} color="#EB5757" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
    case 'refined-carbs': return <Cookie size={size} color="#D35400" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
    case 'simple-carbs': return <GlassWater size={size} color="#56CCF2" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
    case 'none':
    case 'low-carb': return <Salad size={size} color="#27AE60" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
    default: return <Utensils size={size} color="#BDBDBD" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />;
  }
};

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

const getSmartDefaultMeal = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Breakfast';
  if (hour >= 11 && hour < 16) return 'Lunch';
  if (hour >= 16 && hour < 22) return 'Dinner';
  return 'Snacks';
};

interface PantryViewProps {
  initialMeal?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const PantryView: React.FC<PantryViewProps> = ({ initialMeal, onClose, isModal = false }) => {
  const { 
    localCache, saveCustomFood, addFoodLog, updateCustomFood, deleteCustomFood
  } = useDiary();
  
  const [targetMeal, setTargetMeal] = useState<string>(initialMeal || getSmartDefaultMeal());
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
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
  const [activeTab, setActiveTab] = useState<SearchTab | 'saved'>('search');
  const [showGuide, setShowGuide] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('mm_pantry_guide_dismissed') !== 'true';
  });
  const [guideExpanded, setGuideExpanded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mm_pantry_guide_expanded') === 'true';
  });
  const [pantryMode, setPantryMode] = useState<'list' | 'create'>('list');
  const [createTab, setCreateTab] = useState<'basics' | 'micros' | 'recipe'>('recipe');
  
  const [sortBy] = useState<'recent' | 'name' | 'cal' | 'p'>('recent');
  const [filterType, setFilterType] = useState<'all' | 'fav' | 'high-p' | 'low-c' | 'recipe'>('all');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [innerGlobalSearchTab, setInnerGlobalSearchTab] = useState<SearchTab>('search');
  const [hasSearched, setHasSearched] = useState(false);
  const [promptDialog, setPromptDialog] = useState<{ title: string; message?: string; defaultValue?: string; placeholder?: string; onConfirm: (v: string) => void } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // States for custom save meal recipe configuration
  const [saveRecipeConfig, setSaveRecipeConfig] = useState<{
    recipeItems: RecipeItem[];
    totals: Record<string, number>;
  } | null>(null);
  const [recipeSaveName, setRecipeSaveName] = useState('AI Detected Meal');
  const [recipeServingQty, setRecipeServingQty] = useState('1');
  const [recipeServingUnit, setRecipeServingUnit] = useState('serving');
  const [recipeTotalServings, setRecipeTotalServings] = useState('1');

  // New states for descriptive overall physical portions and dual-unit toggles
  const [aiTotalServingQty, setAiTotalServingQty] = useState<number>(1);
  const [aiTotalServingUnit, setAiTotalServingUnit] = useState<string>('serving');
  const [selectedServingUnitToggle, setSelectedServingUnitToggle] = useState<'meal' | 'physical'>('meal');
  const [loggedPortionsVal, setLoggedPortionsVal] = useState<string>('1');

  const searchCache = React.useRef<Record<string, Food[]>>({});
  const aiSearchCache = React.useRef<Record<string, Food[]>>({});

  const clearSearchState = () => {
    setSearchResults([]);
    setSearchQuery('');
    setErrorMsg('');
    setHasSearched(false);
  };

  const handleIngSearch = async (e?: React.FormEvent, forcedQuery?: string) => {
    if (e) e.preventDefault();
    const q = (forcedQuery || ingQuery).trim();
    if (!q) return;
    setIsIngSearching(true);
    const localMatches = customFoods.filter((f: Food) => f.name.toLowerCase().includes(q.toLowerCase())).map((f: Food) => ({ ...f, isLocal: true }));
    
    // 1. Immediately render local matches synchronously
    setIngResults(localMatches.slice(0, 30));

    // 2. Check in-memory query cache
    if (searchCache.current[q.toLowerCase()]) {
      const cached = searchCache.current[q.toLowerCase()];
      setIngResults([...localMatches, ...cached].slice(0, 30));
      setIsIngSearching(false);
      return;
    }

    try {
      // Step 1: DB search — show results instantly
      const dbResponse = await fetch('/api/db-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) })
        .then(r => r.ok ? r.json() : { foods: [], expandedQuery: q }).catch(() => ({ foods: [], expandedQuery: q }));
      const dbResults = (dbResponse.foods || []).map(normalizeFoodResult);
      const offQuery = dbResponse.expandedQuery || q;

      searchCache.current[q.toLowerCase()] = dbResults;
      setIngResults([...localMatches, ...dbResults].slice(0, 30));
      setIsIngSearching(false);

      // Step 2: OFF search — streams in branded results
      fetch('/api/off-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: offQuery }) })
        .then(r => r.ok ? r.json() : { foods: [] })
        .then(offBody => {
          const offResults = (offBody.foods || offBody.results || []).map(normalizeFoodResult);
          if (offResults.length > 0) {
            const seen = new Set(dbResults.map((f: Food) => (f.name + '|' + f.cal).toLowerCase()));
            const merged = [...dbResults];
            for (const f of offResults) {
              if (!seen.has((f.name + '|' + f.cal).toLowerCase())) {
                merged.push(f);
                seen.add((f.name + '|' + f.cal).toLowerCase());
              }
            }
            searchCache.current[q.toLowerCase()] = merged;
            setIngResults([...localMatches, ...merged].slice(0, 30));
          }
        })
        .catch(() => {});
    } catch {
      // Keep displaying the immediate local matches
      setIsIngSearching(false);
    }
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
    Object.keys(totals).forEach(k => { (newForm as unknown as Record<string, string>)[k] = totals[k as keyof typeof totals] ? totals[k as keyof typeof totals].toFixed(1) : ''; });
    setForm(newForm);
    setPairingSuggestions(getPairingSuggestions(items));
  };

  // Performance: Debounce for both searches
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (ingQuery.length > 2) handleIngSearch(undefined, ingQuery);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingQuery]);

  // As-you-type search for global search (300ms debounce)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1 && innerGlobalSearchTab === 'search') {
        handleGlobalSearch(undefined, searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);


  const [aiStagedResults, setAiStagedResults] = useState<Food[]>([]);
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  
  const [scanningIngredients, setScanningIngredients] = useState<number | null>(null);

  // Photo verification state
  const [isVerifyingPhoto, setIsVerifyingPhoto] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    summary: string;
    portionAssessment: string;
    confidence: string;
    significantDifference: boolean;
    adjustedItems: Array<{ name: string; adjustedQty: number; adjustedUnit: string; adjustedCal: number; adjustedP: number; adjustedC: number; adjustedF: number; reason: string }>;
  } | null>(null);

  const handleIngredientScan = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setScanningIngredients(index);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/ai-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mediaType: file.type })
        });
        const data = await res.json();
        if (data.ingredients) {
          const next = [...aiStagedResults];
          next[index] = { ...next[index], ingredients: data.ingredients };
          setAiStagedResults(next);
        }
        setScanningIngredients(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setScanningIngredients(null);
    }
  };

  const handleVerifyWithPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same photo can be re-selected
    e.target.value = '';
    setIsVerifyingPhoto(true);
    setVerifyResult(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/ai-verify-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            mediaType: file.type,
            originalItems: aiStagedResults.map(f => ({
              name: f.name,
              stagedQty: f.stagedQty,
              stagedUnit: f.stagedUnit,
              sQty: f.sQty,
              sUnit: f.sUnit,
              cal: f.cal,
              p: f.p,
              c: f.c,
              f: f.f
            }))
          })
        });
        const data = await res.json();
        if (data.summary) {
          setVerifyResult(data);
        } else {
          showNotification('Could not verify photo. Try again.');
        }
        setIsVerifyingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      showNotification('Photo verification failed.');
      setIsVerifyingPhoto(false);
    }
  };

  const [isPantryPickerOpen, setIsPantryPickerOpen] = useState(false);
  
  const customFoods: Food[] = localCache.customFoods || [];

  const handleGlobalSearch = async (e?: React.FormEvent, forcedQuery?: string) => {
    if (e) e.preventDefault();
    const q = (forcedQuery !== undefined ? forcedQuery : searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    setErrorMsg('');
    
    const localMatches = customFoods.filter((f: Food) => 
      f.name.toLowerCase().includes(q.toLowerCase())
    ).map((f: Food) => ({ ...f, isLocal: true }));

    // 1. Immediately render local custom matches so the UI updates instantaneously!
    setSearchResults(localMatches.slice(0, 50));
    setHasSearched(true);

    // 2. Check if we already have the global query in our in-memory cache
    if (searchCache.current[q.toLowerCase()]) {
      const cachedGlobal = searchCache.current[q.toLowerCase()];
      setSearchResults([...localMatches, ...cachedGlobal].slice(0, 50));
      setIsSearching(false);
      return;
    }

    try {
      // Step 1: DB search — show results instantly (~100ms)
      const dbResponse = await fetch('/api/db-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) })
        .then(r => r.ok ? r.json() : { foods: [], expandedQuery: q }).catch(() => ({ foods: [], expandedQuery: q }));
      const dbResults = (dbResponse.foods || []).map(normalizeFoodResult);
      const offQuery = dbResponse.expandedQuery || q;

      // Show DB results immediately — don't wait for OFF
      searchCache.current[q.toLowerCase()] = dbResults;
      setSearchResults([...localMatches, ...dbResults].slice(0, 50));
      setIsSearching(false);

      // Step 2: OFF search — streams in branded results (~1-2s later)
      setIsLoadingMore(true);
      fetch('/api/off-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: offQuery }) })
        .then(r => r.ok ? r.json() : { foods: [] })
        .then(offBody => {
          const offResults = (offBody.foods || offBody.results || []).map(normalizeFoodResult);
          if (offResults.length > 0) {
            const seen = new Set(dbResults.map((f: Food) => (f.name + '|' + f.cal).toLowerCase()));
            const merged = [...dbResults];
            for (const f of offResults) {
              if (!seen.has((f.name + '|' + f.cal).toLowerCase())) {
                merged.push(f);
                seen.add((f.name + '|' + f.cal).toLowerCase());
              }
            }
            searchCache.current[q.toLowerCase()] = merged;
            setSearchResults([...localMatches, ...merged].slice(0, 50));
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingMore(false));
    } catch {
      setSearchResults(localMatches.slice(0, 50));
      setIsSearching(false);
    }
  };

  const handleGlobalAISearch = async (e?: React.SyntheticEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setErrorMsg('');

    const localMatches = customFoods.filter((f: Food) => 
      f.name.toLowerCase().includes(q.toLowerCase())
    ).map((f: Food) => ({ ...f, isLocal: true }));

    // 1. Instantly display local custom matches
    setSearchResults(localMatches.slice(0, 50));
    setHasSearched(true);

    // 2. Check if query is in cache
    if (aiSearchCache.current[q.toLowerCase()]) {
      const cachedAi = aiSearchCache.current[q.toLowerCase()];
      setSearchResults([...localMatches, ...cachedAi].slice(0, 50));
      setIsSearching(false);
      return;
    }

    try {
      const res = await fetch('/api/ai-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      if (res.ok) {
        const body = await res.json();
        const detected = (body.foods || []) as Food[];
        const normalized = detected.map(normalizeFoodResult);
        
        // Cache the AI results
        aiSearchCache.current[q.toLowerCase()] = normalized;
        
        setSearchResults([...localMatches, ...normalized].slice(0, 50));
      } else {
        setErrorMsg("AI Lookup failed.");
      }
    } catch {
      setErrorMsg("AI Lookup failed.");
    }
    setIsSearching(false);
  };

  const handleGlobalAIDescribe = async (e?: React.SyntheticEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResults([]);
    setAiStagedResults([]);
    setSelectedServingUnitToggle('meal'); // Reset toggle
    try {
      const res = await fetch('/api/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: searchQuery })
      });
      const body = await res.json();
      const detected = (body.foods || []) as Food[];
      
      const qty = Number(body.totalServingQty || 1);
      let unit = String(body.totalServingUnit || 'serving');
      const lowerUnit = unit.toLowerCase().trim();
      if (lowerUnit === 'meal' || lowerUnit === 'meals' || lowerUnit === 'plate' || lowerUnit === 'plates') {
        unit = 'serving';
      }
      setAiTotalServingQty(qty);
      setAiTotalServingUnit(unit);

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
  
  const [configuringFood, setConfiguringFood] = useState<Food | null>(null);
  const [configuringFromRecipe, setConfiguringFromRecipe] = useState(false);
  const [editName, setEditName] = useState('');
  const [servingQty, setServingQty] = useState('1');
  const [servingUnit, setServingUnit] = useState('serving');
  const [showFullNutrition, setShowFullNutrition] = useState(false);
  const [showNutriPopup, setShowNutriPopup] = useState(false);

  const handleAddPreviewClick = (food: Food) => {
    setConfiguringFood(food);
    setEditName(food.name || '');
    
    // SMART PORTIONING: Try to extract quantity and unit from serving string
    let parsedQty = '';
    let parsedUnit = '';

    const matchUnit = (unitStr: string): string | null => {
      const normalized = unitStr.toLowerCase().trim();
      let target = normalized;
      if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters') target = 'ml';
      else if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') target = 'g';
      else if (normalized === 'cup' || normalized === 'cups') target = 'cup';
      else if (normalized === 'serving' || normalized === 'servings') target = 'serving';
      else if (normalized === 'piece' || normalized === 'pieces') target = 'piece';
      else if (normalized === 'slice' || normalized === 'slices') target = 'slice';
      else if (normalized === 'tbsp' || normalized === 'tablespoon' || normalized === 'tablespoons') target = 'tbsp';
      else if (normalized === 'tsp' || normalized === 'teaspoon' || normalized === 'teaspoons') target = 'tsp';
      else if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') target = 'oz';

      const found = SERVING_UNITS.find(u => u.v.toLowerCase() === target);
      return found ? found.v : null;
    };

    const servingStr = food.serving || '';
    
    if (food._src === 'ai') {
      parsedQty = '1';
      parsedUnit = 'serving';
    } else {
      // 1. Try parentheses first (e.g. "1 cup (240ml)")
      const parenMatch = servingStr.match(/\(([^)]+)\)/);
      if (parenMatch) {
        const inside = parenMatch[1];
        const match = inside.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z\s]+)/);
        if (match) {
          const mapped = matchUnit(match[2]);
          if (mapped) {
            parsedQty = match[1];
            parsedUnit = mapped;
          }
        }
      }

      // 2. If no valid match in parentheses, search whole serving string (e.g. "1 cup")
      if (!parsedQty || !parsedUnit) {
        const match = servingStr.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z\s]+)/);
        if (match) {
          const mapped = matchUnit(match[2]);
          if (mapped) {
            parsedQty = match[1];
            parsedUnit = mapped;
          }
        }
      }
    }

    // 3. Fallback to food.sQty and food.sUnit if extraction failed
    if (parsedQty && parsedUnit) {
      setServingQty(parsedQty);
      setServingUnit(parsedUnit);
    } else {
      setServingQty(String(food.sQty || '1'));
      const fallbackUnit = food.sUnit ? matchUnit(food.sUnit) : null;
      setServingUnit(fallbackUnit || 'serving');
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

  const handleConfirmSaveRecipe = () => {
    if (!saveRecipeConfig) return;
    const { recipeItems, totals } = saveRecipeConfig;
    const saveName = recipeSaveName.trim() || 'AI Detected Meal';
    const servingQty = parseFloat(recipeServingQty) || 1;
    const servingUnit = recipeServingUnit.trim() || 'serving';
    const batchServings = Math.max(1, parseFloat(recipeTotalServings) || 1);

    const ingredientsText = recipeItems.map(item => {
      const categoryLabel = item.food.category && item.food.category !== 'unknown' ? ` (${item.food.category})` : '';
      return `${item.qty} ${item.unit} of ${item.food.name}${categoryLabel}`;
    }).join(', ');

    const mealData: Food = {
      name: saveName,
      serving: `${servingQty} ${servingUnit}`,
      sQty: servingQty,
      sUnit: servingUnit,
      isLocal: true,
      type: 'recipe',
      ingredientItems: recipeItems,
      ingredients: ingredientsText,
      cal: Math.round((totals.cal || 0) / batchServings),
      p: parseFloat(((totals.p || 0) / batchServings).toFixed(1)),
      c: parseFloat(((totals.c || 0) / batchServings).toFixed(1)),
      f: parseFloat(((totals.f || 0) / batchServings).toFixed(1)),
      fiber: parseFloat(((totals.fiber || 0) / batchServings).toFixed(1)),
      sugars: parseFloat(((totals.sugars || 0) / batchServings).toFixed(1)),
      sat: parseFloat(((totals.sat || 0) / batchServings).toFixed(1)),
      mono: parseFloat(((totals.mono || 0) / batchServings).toFixed(1)),
      poly: parseFloat(((totals.poly || 0) / batchServings).toFixed(1)),
      trans: parseFloat(((totals.trans || 0) / batchServings).toFixed(1)),
      chol: Math.round((totals.chol || 0) / batchServings),
      Sodium: Math.round((totals.Sodium || 0) / batchServings),
      Potassium: Math.round((totals.Potassium || 0) / batchServings),
      Calcium: Math.round((totals.Calcium || 0) / batchServings),
      Magnesium: Math.round((totals.Magnesium || 0) / batchServings),
      id: `recipe-${Date.now()}`
    };

    saveCustomFood(mealData);
    setSaveRecipeConfig(null);
    setIsAiReviewing(false);
    setAiStagedResults([]);
    showNotification(`"${saveName}" saved to Kitchen Pantry!`);
  };

  return (
    <div style={{ paddingBottom: '40px', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Premium glassmorphic toast notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          padding: '14px 24px',
          background: 'linear-gradient(135deg, rgba(146, 254, 157, 0.95) 0%, rgba(0, 201, 255, 0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '18px',
          boxShadow: '0 15px 35px rgba(0, 201, 255, 0.3)',
          color: '#03080c',
          fontWeight: '900',
          fontSize: '13px',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <Check size={16} strokeWidth={3} />
          <span>{notification}</span>
        </div>
      )}

      {/* Styled slideDownFade keyframe */}
      <style>{`
        @keyframes slideDownFade {
          from {
            transform: translate(-50%, -20px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
      
      {isModal && (
        <div style={{ 
          width: '100%', 
          padding: '24px 20px 0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'var(--theme-panel)', 
          backdropFilter: 'blur(25px)', 
          WebkitBackdropFilter: 'blur(25px)'
        }}>
          <div>
            <h2 style={{ color: 'var(--theme-text)', fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>ADD FOOD</h2>
            <div style={{ color: 'var(--theme-accent, #00C9FF)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px' }}>{targetMeal}</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'var(--theme-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={24} />
            </button>
          )}
        </div>
      )}

      {/* Tab Switcher */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px', 
          marginBottom: isModal ? '8px' : '10px', 
          position: 'sticky', 
          top: '0', 
          zIndex: 100, 
          background: 'transparent',
          padding: isModal ? '28px 20px 12px 20px' : '40px 20px 12px 20px'
        }}>
        <button onClick={() => { setActiveTab('search'); clearSearchState(); }} 
          className={`pantry-main-tab ${activeTab === 'search' ? 'active' : ''}`}
          style={{ padding: '12px 4px', borderRadius: '14px', border: 'none', color: activeTab === 'search' ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center' }}>
          Discover
        </button>
        <button onClick={() => setActiveTab('saved')}
          className={`pantry-main-tab ${activeTab === 'saved' ? 'active' : ''}`}
          style={{ padding: '12px 4px', borderRadius: '14px', border: 'none', color: activeTab === 'saved' ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center' }}>
          My Pantry
        </button>
      </div>

      {activeTab === 'search' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ height: isModal ? '8px' : '10px' }} />

          {showGuide && (
            <div className="card" style={{ 
              padding: '18px 20px', 
              display: 'flex', 
              flexDirection: 'column',
              gap: guideExpanded ? '14px' : '0px', 
              position: 'relative',
              marginBottom: '16px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s'
            }}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.dismiss-btn')) return;
              const next = !guideExpanded;
              setGuideExpanded(next);
              localStorage.setItem('mm_pantry_guide_expanded', String(next));
            }}
            >
              {/* Close Button */}
              <button 
                onClick={() => {
                  setShowGuide(false);
                  localStorage.setItem('mm_pantry_guide_dismissed', 'true');
                }}
                className="dismiss-btn hover-dim"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--theme-text-dim, #8b8b9b)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                  zIndex: 2
                }}
              >
                <X size={14} />
              </button>

              {/* Top Row (Always Visible) */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', width: '100%' }}>
                {/* Sparkles Icon */}
                <div style={{ background: 'var(--theme-panel-dim)', padding: '8px', borderRadius: '12px', color: 'var(--theme-accent)', border: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Sparkles size={16} />
                </div>

                {/* Content Area */}
                <div style={{ paddingRight: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--theme-text-on-panel)' }}>
                      Pantry & Discovery Guide
                    </h3>
                    <ChevronDown size={16} style={{ color: 'var(--theme-text-dim-on-panel)', transform: guideExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--theme-text-dim-on-panel)', margin: '0 0 8px 0', lineHeight: '1.5', fontWeight: '500' }}>
                    Welcome! Use our flexible search tools to easily track and log virtually any food or multi-ingredient meal to your food log.
                  </p>

                  {/* Explicit Text Toggle Button for Obvious Call-to-Action */}
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    color: 'var(--theme-accent)', 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    marginTop: '2px',
                    transition: 'all 0.2s'
                  }}>
                    <span>{guideExpanded ? 'Hide Details' : 'Show Details'}</span>
                    <ChevronDown size={12} style={{ transform: guideExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                </div>
              </div>

              {/* Collapsible Tool List (Full Width - stretched under Sparkles column) */}
              {guideExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--theme-text-dim-on-panel)', marginTop: '4px', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--theme-accent)', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', width: '105px', flexShrink: 0 }}>
                      <Search size={14} /> Search:
                    </span>
                    <span style={{ lineHeight: '1.5', flex: 1 }}>
                      Our dual-mode tool merges database queries and semantic AI search:
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li><strong>Standard Search:</strong> Queries the global database—ideal for scanning barcodes and logging branded, packaged grocery products (like <em>Lays Chips</em> or <em>Yoplait Yogurt</em>).</li>
                        <li><strong>AI Search:</strong> Uses semantic intelligence—perfect for raw whole ingredients, fresh produce, and unbranded foods or restaurant dishes.</li>
                      </ul>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--theme-accent)', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', width: '105px', flexShrink: 0 }}>
                      <Camera size={14} /> Scan:
                    </span>
                    <span style={{ lineHeight: '1.5', flex: 1 }}>
                      Activates your device camera to <strong>scan food barcodes</strong> (perfect for instantly logging standard packaged products and groceries without any manual entry).
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--theme-accent)', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', width: '105px', flexShrink: 0 }}>
                      <Brain size={14} /> Muncher:
                    </span>
                    <span style={{ lineHeight: '1.5', flex: 1 }}>
                      Describe <strong>whole multi-ingredient meals</strong> in natural language and Muncher Meal Intelligence automatically breaks them down into macros!
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
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
                    const displayQuery = String(result);
                    setInnerGlobalSearchTab('search');
                    setSearchQuery(displayQuery);
                    const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
                    handleGlobalSearch(dummyEvent, displayQuery);
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
                          Muncher Meal Intelligence
                        </h3>
                        <div style={{ fontSize: '10px', color: 'color-mix(in srgb, var(--theme-accent) 70%, white)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>AI-Powered Complex Parsing</div>
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
                    {isSearching ? <Loader2 className="spin" size={20} /> : <Sparkles size={20} />}
                    <span style={{ letterSpacing: '1.5px' }}>{isSearching ? 'MUNCHER IS THINKING...' : 'ASK MUNCHER'}</span>
                  </button>

                  {isSearching && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '20px', 
                      borderRadius: '16px', 
                      background: 'var(--theme-panel-dim, rgba(255,255,255,0.02))', 
                      border: '1px dashed var(--theme-border, rgba(255,255,255,0.15))',
                      textAlign: 'center'
                    }}>
                      <Loader2 className="spin" size={20} color="var(--theme-accent)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--theme-accent)', marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          Muncher Meal Intelligence
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, rgba(255,255,255,0.6))', fontWeight: '600', lineHeight: '1.4', maxWidth: '320px' }}>
                          Muncher is breaking down your meal into individual ingredients with precise macro breakdowns. This can take a few seconds...
                        </div>
                    </div>
                  )}

                  <textarea 
                    className="force-white-placeholder"
                    placeholder="Describe your whole meal here... (e.g. '3 scrambled eggs with spinach and a cup of black coffee')"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setHasSearched(false); }}
                    style={{ 
                      width: '100%', 
                      minHeight: '160px', 
                      background: 'rgba(255,255,255,0.06)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: '20px', 
                      padding: '20px', 
                      color: '#FFF', 
                      outline: 'none', 
                      fontSize: '15px', 
                      lineHeight: '1.6',
                      fontFamily: 'inherit',
                      resize: 'none'
                    }}
                  />



                  {/* Simplified serving size reminder */}
                  <div style={{ 
                    background: 'rgba(255, 193, 7, 0.08)', 
                    border: '1px solid rgba(255, 193, 7, 0.25)', 
                    borderRadius: '16px', 
                    padding: '12px 16px', 
                    display: 'flex', 
                    gap: '10px', 
                    alignItems: 'flex-start',
                    marginTop: '-4px'
                  }}>
                    <Lightbulb size={16} color="var(--theme-accent)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.4', fontWeight: '500' }}>
                      <strong>Serving Size Tip:</strong> AI portion sizes are smart guesses and might not be perfect. Don't worry! You can easily tweak and change them on the next screen before adding them to your food log.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                {(innerGlobalSearchTab === 'search' || innerGlobalSearchTab === 'ai-search') && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', background: 'var(--theme-panel-dim, rgba(18, 21, 32, 0.4))', padding: '4px', borderRadius: '999px', border: '1px solid var(--theme-border)' }}>
                      <button 
                        type="button"
                        onClick={() => { setInnerGlobalSearchTab('search'); clearSearchState(); }}
                        style={{ 
                          padding: '6px 16px', 
                          border: 'none', 
                          borderRadius: '999px', 
                          background: innerGlobalSearchTab === 'search' ? 'var(--theme-accent)' : 'transparent', 
                          color: innerGlobalSearchTab === 'search' ? '#000' : 'var(--theme-text-dim-on-panel, #BDC4C6)', 
                          fontSize: '12px', 
                          fontWeight: '800', 
                          cursor: 'pointer', 
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent'
                        }}>
                        <Search size={12} /> Search
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setInnerGlobalSearchTab('ai-search'); clearSearchState(); }}
                        style={{ 
                          padding: '6px 16px', 
                          border: 'none', 
                          borderRadius: '999px', 
                          background: innerGlobalSearchTab === 'ai-search' ? 'var(--theme-accent)' : 'transparent', 
                          color: innerGlobalSearchTab === 'ai-search' ? '#000' : 'var(--theme-text-dim-on-panel, #BDC4C6)', 
                          fontSize: '12px', 
                          fontWeight: '800', 
                          cursor: 'pointer', 
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent'
                        }}>
                        <Sparkles size={12} /> AI Search
                      </button>
                    </div>
                  </div>
                )}
                <form 
                  className="search-bar-wrap" 
                  onSubmit={innerGlobalSearchTab === 'search' ? handleGlobalSearch : handleGlobalAISearch}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input 
                      type="text" 
                      placeholder={innerGlobalSearchTab === 'search' ? "Search for foods, brands..." : "Search any food..."}
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setHasSearched(false); }}
                      style={{ width: '100%', background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-md)', padding: '12px 12px 12px 40px', color: 'var(--theme-text)', fontSize: '14px', outline: 'none' }}
                    />
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--theme-text-dim)' }}>
                      <Search size={18} />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    style={{ 
                      padding: innerGlobalSearchTab === 'search' ? '12px var(--space-lg)' : '12px 24px', 
                      background: 'var(--theme-accent)', 
                      border: 'none', 
                      borderRadius: 'var(--radius-md)', 
                      color: '#000000', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: innerGlobalSearchTab === 'search' ? '14px' : '13px',
                      textTransform: 'lowercase'
                    }}>
                    {isSearching ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
                  </button>
                </form>

                {isSearching && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '20px', 
                    marginTop: '20px', 
                    borderRadius: '16px', 
                    background: 'var(--theme-panel-dim, rgba(255,255,255,0.02))', 
                    border: '1px dashed var(--theme-border, rgba(255,255,255,0.15))',
                    textAlign: 'center'
                  }}>
                    <Loader2 className="spin" size={20} color="var(--theme-accent)" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--theme-accent)', marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {innerGlobalSearchTab === 'search' ? 'Searching Database' : 'Searching Macros'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, rgba(255,255,255,0.6))', fontWeight: '600', lineHeight: '1.4', maxWidth: '320px' }}>
                      {innerGlobalSearchTab === 'search' 
                        ? 'Fetching nutrition records from the global database. This will only take a quick moment...' 
                        : 'Muncher AI is parsing your request to construct mathematically accurate macro & calorie breakdowns...'}
                    </div>
                  </div>
                )}
            </div>
          )}

          {searchResults.length > 0 && !isAiReviewing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginTop: 'var(--space-md)', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {searchResults.map((f: Food, i) => (
                <div key={i} 
                  onClick={() => handleAddPreviewClick(f)} 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddPreviewClick(f);
                  }}
                  style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '16px', 
                  borderRadius: '18px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: f.isLocal ? '4px solid var(--theme-success)' : '4px solid var(--theme-accent)', 
                  '--theme-text': '#FFF', 
                  '--theme-text-dim': 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                } as React.CSSProperties}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: '900', fontSize: '14px', color: 'var(--theme-text)' }}>{f.name}</div>
                      {f.brand && <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', opacity: 0.6, fontWeight: '700' }}>• {f.brand}</div>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '4px', fontWeight: '600' }}>{f.serving} • {Math.round(Number(f.cal) || 0)} kcal • P:{f.p}g C:{f.c}g F:{f.f}g</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {(() => {
                      const { grade: g, estimated } = estimateNutriScore(f);
                      if (!g) return null;
                      const nsColor: Record<string,string> = { a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11' };
                      const bg = nsColor[g] || '#888';
                      return (
                        <div title={`Nutri-Score ${g.toUpperCase()}${estimated ? ' (est.)' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                          <span style={{ fontSize: '6px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3px' }}>{estimated ? '~' : ''}NUTRI</span>
                          <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#000', boxShadow: `0 0 8px ${bg}70` }}>{g.toUpperCase()}</span>
                        </div>
                      );
                    })()}
                    {f.isLocal && <BookmarkCheck size={18} color="var(--theme-success)" />}
                  </div>
                </div>
              ))}
              {isLoadingMore && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', color: 'var(--theme-text-dim)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                  <Loader2 className="spin" size={14} color="var(--theme-accent)" /> Loading branded results...
                </div>
              )}
            </div>
          )}

          {!isSearching && hasSearched && searchQuery && searchResults.length === 0 && !isAiReviewing && (
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-xl)', marginTop: 'var(--space-md)', borderStyle: 'dashed' }}>
              <div style={{ color: 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '900', marginBottom: '16px', letterSpacing: '1px' }}>NO FOODS FOUND IN DATABASE</div>
              <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '600' }}>Try a broader search or add it manually in The Lab</div>
            </div>
          )}
          
          {errorMsg && <div style={{ color: 'var(--theme-error)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{errorMsg}</div>}

              {/* AI Review Step */}
              {isAiReviewing && aiStagedResults.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', border: '1px solid var(--theme-accent)', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Sparkles size={18} color="var(--theme-accent)" /> MUNCHER MEAL INTELLIGENCE
                    </div>
                    <button onClick={() => { setIsAiReviewing(false); setAiStagedResults([]); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--theme-text-dim)', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}><X size={18} /></button>
                  </div>

                  {/* Photo Verify Section at the Top */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '16px' }}>
                    {/* Photo Verify Button */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        id="meal-verify-photo-input"
                        style={{ display: 'none' }}
                        onChange={handleVerifyWithPhoto}
                      />
                      <label
                        htmlFor="meal-verify-photo-input"
                        style={{
                          width: '100%',
                          padding: '13px',
                          background: isVerifyingPhoto
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0, 201, 255, 0.06)',
                          border: '1px solid var(--theme-accent)',
                          borderRadius: '16px',
                          color: 'var(--theme-accent)',
                          fontWeight: '900',
                          fontSize: '13px',
                          cursor: isVerifyingPhoto ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxSizing: 'border-box',
                          opacity: isVerifyingPhoto ? 0.6 : 1,
                          transition: 'all 0.2s',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {isVerifyingPhoto
                          ? <><Loader2 size={16} className="spin" /> VERIFYING PHOTO...</>
                          : <><Camera size={16} /> VERIFY WITH PHOTO</>
                        }
                      </label>
                    </div>

                    {/* Photo Verify Result Card */}
                    {verifyResult && (
                      <div style={{
                        background: verifyResult.significantDifference
                          ? 'rgba(255, 107, 107, 0.07)'
                          : 'rgba(146, 254, 157, 0.06)',
                        border: `1px solid ${verifyResult.significantDifference ? 'rgba(255,107,107,0.4)' : 'rgba(146,254,157,0.35)'}`,
                        borderRadius: '18px',
                        padding: '16px',
                        animation: 'slideDown 0.25s ease-out'
                      }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                              {verifyResult.portionAssessment === 'accurate' ? <CheckCircle size={16} color="var(--theme-success)" /> :
                               verifyResult.portionAssessment === 'too_large' ? <AlertTriangle size={16} color="var(--theme-warning)" /> :
                               verifyResult.portionAssessment === 'too_small' ? <TrendingDown size={16} color="var(--theme-error)" /> :
                               <Search size={16} color="var(--theme-accent)" />}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: verifyResult.significantDifference ? 'var(--theme-error)' : 'var(--theme-success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {verifyResult.significantDifference ? 'Adjustment Suggested' : 'Looks Good!'}
                            </span>
                          </div>
                          <button
                            onClick={() => setVerifyResult(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim)', cursor: 'pointer', padding: '2px', lineHeight: 1 }}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Claude's Summary */}
                        <p style={{ fontSize: '13px', color: 'var(--theme-text)', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                          {verifyResult.summary}
                        </p>

                        {/* Per-item breakdown if differences found */}
                        {verifyResult.significantDifference && verifyResult.adjustedItems.some(a => a.reason !== 'Looks accurate') && (
                          <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {verifyResult.adjustedItems
                              .filter(a => a.reason !== 'Looks accurate')
                              .map((item, idx) => (
                                <div key={idx} style={{ fontSize: '11px', color: 'var(--theme-text-dim)', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--theme-text)' }}>{item.name}</span>
                                  <span style={{ textAlign: 'right' }}>{item.adjustedQty} {item.adjustedUnit} · {item.adjustedCal} kcal</span>
                                </div>
                              ))
                            }
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            onClick={() => setVerifyResult(null)}
                            style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'var(--theme-text)', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Keep Original
                          </button>
                          <button
                            onClick={() => {
                              if (!verifyResult.adjustedItems) return;
                              const updated = aiStagedResults.map(original => {
                                const match = verifyResult.adjustedItems.find(a =>
                                  a.name.toLowerCase() === original.name.toLowerCase()
                                );
                                if (!match || match.reason === 'Looks accurate') return original;
                                return {
                                  ...original,
                                  stagedQty: String(match.adjustedQty),
                                  stagedUnit: match.adjustedUnit,
                                  cal: match.adjustedCal,
                                  p: match.adjustedP,
                                  c: match.adjustedC,
                                  f: match.adjustedF,
                                };
                              });
                              setAiStagedResults(updated);
                              setVerifyResult(null);
                              showNotification('Meal updated with photo verification!');
                            }}
                            style={{ padding: '10px', background: verifyResult.significantDifference ? 'rgba(255,107,107,0.15)' : 'rgba(146,254,157,0.15)', border: `1px solid ${verifyResult.significantDifference ? 'rgba(255,107,107,0.4)' : 'rgba(146,254,157,0.4)'}`, borderRadius: '12px', color: verifyResult.significantDifference ? 'var(--theme-error)' : 'var(--theme-success)', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Accept Adjustment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Physical serving size toggle & amount selection */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px', 
                    padding: '14px', 
                    marginBottom: '16px' 
                  }}>
                    {aiTotalServingUnit !== 'serving' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ClipboardList size={12} color="var(--theme-accent)" /> Portion Unit
                        </span>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedServingUnitToggle !== 'meal') {
                                const oldQty = parseFloat(loggedPortionsVal);
                                const baseQty = Math.max(0.1, aiTotalServingQty || 1);
                                const convertedQty = isNaN(oldQty) ? 1 : oldQty / baseQty;
                                const roundedQty = Math.round(convertedQty * 100) / 100;
                                setLoggedPortionsVal(roundedQty.toString());
                              }
                              setSelectedServingUnitToggle('meal');
                            }}
                            style={{
                              padding: '5px 12px',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: selectedServingUnitToggle === 'meal' ? 'var(--theme-accent)' : 'transparent',
                              color: selectedServingUnitToggle === 'meal' ? '#000' : 'var(--theme-text-dim)'
                            }}
                          >
                            1 Serving
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedServingUnitToggle !== 'physical') {
                                const oldQty = parseFloat(loggedPortionsVal);
                                const baseQty = Math.max(0.1, aiTotalServingQty || 1);
                                const convertedQty = isNaN(oldQty) ? baseQty : oldQty * baseQty;
                                const roundedQty = Math.round(convertedQty * 100) / 100;
                                setLoggedPortionsVal(roundedQty.toString());
                              }
                              setSelectedServingUnitToggle('physical');
                            }}
                            style={{
                              padding: '5px 12px',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: selectedServingUnitToggle === 'physical' ? 'var(--theme-accent)' : 'transparent',
                              color: selectedServingUnitToggle === 'physical' ? '#000' : 'var(--theme-text-dim)'
                            }}
                          >
                            {aiTotalServingQty} {aiTotalServingUnit}
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
                        Amount to Log:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={loggedPortionsVal}
                          onChange={(e) => setLoggedPortionsVal(e.target.value)}
                          style={{
                            width: '70px',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(0,0,0,0.2)',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: '700',
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--theme-accent)', fontWeight: '700', textTransform: 'lowercase' }}>
                          {selectedServingUnitToggle === 'meal' ? (parseFloat(loggedPortionsVal) === 1 ? 'serving' : 'servings') : aiTotalServingUnit}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {aiStagedResults.map((f, i) => {
                      const scaleFactor = selectedServingUnitToggle === 'meal'
                        ? (parseFloat(loggedPortionsVal) || 1)
                        : (parseFloat(loggedPortionsVal) || 1) / Math.max(0.1, aiTotalServingQty);
                      const multiplier = computeMultiplier(f.serving || '100g', f.stagedUnit || 'serving', parseFloat(String(f.stagedQty)) || 1) * scaleFactor;
                      
                      return (
                        <div key={i} className="glass-card ai-staged-food-card" style={{ 
                          padding: 'var(--space-md)', 
                          width: '100%',
                          boxSizing: 'border-box',
                          border: f._src === 'off' || innerGlobalSearchTab === 'scan' ? '2px solid var(--theme-accent)' : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: f._src === 'off' || innerGlobalSearchTab === 'scan' ? '0 0 15px var(--theme-accent-dim)' : 'none',
                          '--theme-text-dim': 'rgba(255,255,255,0.6)',
                          '--theme-panel-dim': 'rgba(255,255,255,0.05)',
                          '--theme-border': 'rgba(255,255,255,0.1)',
                          '--theme-input-bg': 'rgba(255,255,255,0.03)'
                        } as React.CSSProperties}>
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

                          {/* Confidence badge + category chip */}
                          {((f as any).confidence === 'low' || (f as any).confidence === 'medium' || ((f as any).category && (f as any).category !== 'unknown')) && (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                              {(f as any).confidence === 'low' && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                                  background: 'rgba(255, 180, 0, 0.12)', border: '1px solid rgba(255, 180, 0, 0.35)',
                                  color: '#ffb400', borderRadius: '6px', padding: '2px 7px',
                                  fontSize: '9px', fontWeight: '800', letterSpacing: '0.3px'
                                }}>~ ESTIMATED</span>
                              )}
                              {(f as any).confidence === 'medium' && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                                  color: 'rgba(255,255,255,0.45)', borderRadius: '6px', padding: '2px 7px',
                                  fontSize: '9px', fontWeight: '800', letterSpacing: '0.3px'
                                }}>~ APPROX</span>
                              )}
                              {(f as any).category && (f as any).category !== 'unknown' && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.85)', borderRadius: '6px', padding: '2px 7px',
                                  fontSize: '9px', fontWeight: '700', letterSpacing: '0.3px', textTransform: 'lowercase'
                                }}>
                                  {getCategoryIcon(String((f as any).category), 11)}
                                  <span style={{ marginLeft: '4px' }}>{(f as any).category}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Quick Stats Row - Distinguishing Bubble */}
                          <div className="quick-stats-bubble-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px', background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)', padding: '10px', borderRadius: '16px' }}>
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
                              const newUnit = e.target.value;
                              const oldUnit = f.stagedUnit || 'g';
                              const oldQty = parseFloat(f.stagedQty || '') || 1;
                              
                              const currentMult = computeMultiplier(f.serving || '', oldUnit, oldQty);
                              const newQtyVal = getQuantityForUnit(f.serving || '', currentMult, newUnit);
                              const roundedQty = Math.round(newQtyVal * 100) / 100;

                              const next = [...aiStagedResults];
                              next[i] = { ...f, stagedQty: roundedQty.toString(), stagedUnit: newUnit };
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
                            <Info size={12} color="var(--theme-accent)" /> TWEAK
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = [...aiStagedResults];
                              next[i] = { ...f, ingredients: f.ingredients !== undefined ? undefined : (f.ingredients || '') };
                              setAiStagedResults(next);
                            }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(255,255,255,0.03)', border: f.ingredients !== undefined ? '1px solid var(--theme-accent)' : '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text)', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                          >
                            <Info size={12} color="var(--theme-accent)" /> {f.ingredients !== undefined ? 'HIDE INGREDIENTS' : 'INGREDIENTS'}
                          </button>
                        </div>
                        {f.ingredients !== undefined && (
                          <div style={{ marginTop: '10px', animation: 'slideDown 0.2s ease-out', position: 'relative' }}>
                            <textarea 
                              className="force-white-placeholder"
                              placeholder="Type ingredients here... (e.g. Water, Sugar, Salt)"
                              value={f.ingredients || ''}
                              onChange={(e) => {
                                const next = [...aiStagedResults];
                                next[i] = { ...f, ingredients: e.target.value };
                                setAiStagedResults(next);
                              }}
                              style={{ width: '100%', height: '60px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--theme-text)', fontSize: '13px', padding: '12px', paddingRight: '44px', outline: 'none', fontWeight: '600', resize: 'none' }}
                            />
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment" 
                              id={`pantry-ing-cam-${i}`}
                              style={{ display: 'none' }}
                              onChange={(e) => handleIngredientScan(e, i)}
                            />
                            <label 
                              htmlFor={`pantry-ing-cam-${i}`}
                              style={{ 
                                position: 'absolute', right: '10px', bottom: '10px', 
                                background: 'var(--theme-accent)', color: '#000', 
                                padding: '6px', borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: scanningIngredients === i ? 0.5 : 1
                              }}>
                              {scanningIngredients === i ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
                            </label>
                          </div>
                        )}
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

                  {/* Assign to Meal Selector for AI Review */}
                  <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '18px', border: '1px solid var(--theme-border)' }}>
                    <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-accent)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Log Entire Meal To</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTargetMeal(m)}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: targetMeal === m ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-border, rgba(255,255,255,0.08))',
                            background: targetMeal === m ? 'var(--theme-accent-dim, rgba(0, 201, 255, 0.1))' : 'rgba(255,255,255,0.03)',
                            color: targetMeal === m ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim)',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>

                    <button 
                      onClick={() => {
                        const scaleFactor = selectedServingUnitToggle === 'meal'
                          ? (parseFloat(loggedPortionsVal) || 1)
                          : (parseFloat(loggedPortionsVal) || 1) / Math.max(0.1, aiTotalServingQty);

                        aiStagedResults.forEach(f => {
                          const mult = computeMultiplier(f.serving || '', f.stagedUnit || 'serving', parseFloat(String(f.stagedQty)) || 1);
                          const scaled = scaleLegacyFoodByAmount(f, mult * scaleFactor);
                          addFoodLog(targetMeal, scaled);
                        });
                        setIsAiReviewing(false);
                        setAiStagedResults([]);
                        setVerifyResult(null);
                        showNotification(`Entire meal logged to ${targetMeal}!`);
                      }}
                      style={{ width: '100%', padding: '14px', background: 'var(--theme-accent)', border: 'none', borderRadius: '16px', color: '#000000', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px var(--theme-accent-dim)' }}>
                      <Check size={18} /> CONFIRM ALL TO FOOD LOG
                    </button>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
                      <button 
                        onClick={() => {
                          const recipeItems: RecipeItem[] = aiStagedResults.map(f => ({
                            food: f,
                            qty: String(f.stagedQty || '1'),
                            unit: f.stagedUnit || 'serving'
                          }));

                          const totals: Record<string, number> = { cal: 0, p: 0, c: 0, f: 0 };
                          const keysToSum = ['cal', 'p', 'c', 'f', 'fiber', 'sugars', 'sat', 'mono', 'poly', 'trans', 'chol', 'Sodium', 'Potassium', 'Calcium', 'Magnesium'];

                          recipeItems.forEach(item => {
                            const mult = computeMultiplier(item.food.serving || '', item.unit, parseFloat(item.qty) || 0);
                            const scaled = scaleLegacyFoodByAmount(item.food, mult);
                            keysToSum.forEach(k => {
                              if (scaled[k] != null) {
                                totals[k] = (totals[k] || 0) + Number(scaled[k]);
                              }
                            });
                          });

                          setRecipeSaveName(searchQuery.trim().substring(0, 35) || 'AI Detected Meal');
                          
                          // Pre-fill recipe serving fields based on currently toggled unit
                          if (selectedServingUnitToggle === 'meal') {
                            setRecipeServingQty(loggedPortionsVal);
                            setRecipeServingUnit('serving');
                            setRecipeTotalServings('1');
                          } else {
                            setRecipeServingQty(loggedPortionsVal);
                            setRecipeServingUnit(aiTotalServingUnit);
                            setRecipeTotalServings('1');
                          }
                          
                          setSaveRecipeConfig({ recipeItems, totals });
                        }}
                        style={{ padding: '14px 5px', background: 'rgba(0, 201, 255, 0.1)', border: '1px solid var(--theme-accent)', borderRadius: '16px', color: 'var(--theme-accent)', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Sparkles size={14} color="var(--theme-accent)" /> SAVE AS MEAL
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
                          showNotification("All items saved individually!");
                        }}
                        style={{ padding: '14px 5px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'var(--theme-text-on-panel)', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Plus size={14} /> SAVE INDIVIDUALS
                      </button>
                    </div>
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
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'rgba(255,255,255,0.9)' }}>{editingIndex !== null ? 'EDIT ITEM' : 'THE LAB'}</h2>
            </div>
          </div>



          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            <div style={{ display: (createTab === 'recipe' || createTab === 'basics') ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <EntryField label="Food Name" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="e.g. Grilled Chicken" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <EntryField label="Serving Amount" value={String(form.sQty || 100)} onChange={v => setForm({...form, sQty: parseFloat(v) || 0})} placeholder="100" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <label style={{ fontSize: '10px', color: 'var(--theme-accent)', fontWeight: '800' }}>SERVING UNIT</label>
                <select 
                  className="inp"
                  value={form.sUnit}
                  onChange={e => {
                    const newUnit = e.target.value;
                    const oldUnit = form.sUnit || 'g';
                    const oldQty = form.sQty || 100;
                    
                    const oldUnitDef = SERVING_UNITS.find(u => u.v === oldUnit) || { factor: 1 };
                    const newUnitDef = SERVING_UNITS.find(u => u.v === newUnit) || { factor: 1 };
                    
                    const newQtyVal = oldQty * (oldUnitDef.factor / newUnitDef.factor);
                    const roundedQty = Math.round(newQtyVal * 100) / 100;
                    
                    setForm({
                      ...form,
                      sQty: roundedQty,
                      sUnit: newUnit
                    });
                  }}
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
                  onClick={() => setPromptDialog({ title: 'Scale to Calories', message: 'Enter target Calories:', defaultValue: '500', onConfirm: (v) => { setPromptDialog(null); const val = parseFloat(v); if (val > 0) setForm(scaleToTarget(form, 'cal', val)); } })}
                  style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '10px', color: 'var(--theme-accent)', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  SCALE TO KCAL
                </button>
                <button
                  onClick={() => setPromptDialog({ title: 'Scale to Protein', message: 'Enter target Protein (g):', defaultValue: '50', onConfirm: (v) => { setPromptDialog(null); const val = parseFloat(v); if (val > 0) setForm(scaleToTarget(form, 'p', val)); } })}
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

            <div style={{ display: (createTab === 'recipe' || createTab === 'basics') ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--space-md)' }}>
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
                          onClick={() => { setConfiguringFromRecipe(true); handleAddPreviewClick(f); }}
                          style={{ 
                            padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '12px', whiteSpace: 'nowrap', cursor: 'pointer', textAlign: 'left', minWidth: '140px', maxWidth: '200px', flexShrink: 0,
                            display: 'flex', flexDirection: 'column', gap: '2px'
                          }}>
                          <div style={{ 
                            fontSize: '11px', fontWeight: '800', color: '#fff', marginBottom: '2px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>{f.name}</div>
                          <div style={{ fontSize: '9px', color: 'var(--theme-text-dim)' }}>{Math.round(Number(f.cal) || 0)} kcal</div>
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
                      onClick={() => { setConfiguringFromRecipe(true); handleAddPreviewClick(r); }}
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
                        const newUnit = e.target.value;
                        const oldUnit = item.unit || 'g';
                        const oldQty = parseFloat(item.qty) || 0;
                        
                        const oldUnitDef = SERVING_UNITS.find(u => u.v === oldUnit) || { factor: 1 };
                        const newUnitDef = SERVING_UNITS.find(u => u.v === newUnit) || { factor: 1 };
                        
                        const newQtyVal = oldQty * (oldUnitDef.factor / newUnitDef.factor);
                        const roundedQty = Math.round(newQtyVal * 100) / 100;

                        const newItems = [...(form.ingredientItems || [])];
                        newItems[i] = { ...item, qty: roundedQty.toString(), unit: newUnit };
                        calculateRecipeTotals(newItems);
                      }}
                      style={{ padding: '4px 6px', fontSize: '11px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '6px' }}>
                      {SERVING_UNITS.map(u => <option key={u.v} value={u.v}>{u.v}</option>)}
                    </select>
                    <button onClick={() => {
                        const newItems = (form.ingredientItems || []).filter((_: RecipeItem, idx: number) => idx !== i);
                        calculateRecipeTotals(newItems);
                      }} 
                      style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,0.7)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
            </div>

            <CollapsibleEntrySection title="Micros & Health" isOpen={openSection === 'micros-health'} onToggle={() => setOpenSection(openSection === 'micros-health' ? null : 'micros-health')}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
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
                        value={String((form as unknown as Record<string, unknown>)[k.k] || 0)} 
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
            </CollapsibleEntrySection>
            
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
                    const fd = foodData as unknown as Record<string, unknown>;
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
                style={{ flex: 2, padding: '14px', background: 'var(--theme-accent)', border: 'none', borderRadius: '12px', color: '#000000', fontWeight: '800', cursor: 'pointer' }}>
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
            style={{ width: '100%', padding: '12px 16px', background: 'var(--theme-accent)', border: 'none', borderRadius: '16px', color: '#000000', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,201,255,0.2)' }}>
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
              if (filterType === 'recipe') return (f.ingredientItems?.length || 0) > 0 || (f as Food & { type?: string }).type === 'recipe';
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
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '16px', 
                    borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderLeft: '4px solid var(--theme-accent)', 
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  } as React.CSSProperties}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: '900', fontSize: '14px', color: 'var(--theme-text, #fff)' }}>{f.name}</div>
                      {f.brand && <div style={{ fontSize: '10px', color: 'var(--theme-text-dim, rgba(255,255,255,0.6))', opacity: 0.6, fontWeight: '700' }}>• {f.brand}</div>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, rgba(255,255,255,0.6))', marginTop: '4px', fontWeight: '600' }}>{f.serving} • {Math.round(Number(f.cal) || 0)} kcal • P:{f.p}g C:{f.c}g F:{f.f}g</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {(() => {
                      const { grade: g, estimated } = estimateNutriScore(f);
                      if (!g) return null;
                      const nsColor: Record<string,string> = { a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11' };
                      const bg = nsColor[g] || '#888';
                      return (
                        <div title={`Nutri-Score ${g.toUpperCase()}${estimated ? ' (est.)' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                          <span style={{ fontSize: '6px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3px' }}>{estimated ? '~' : ''}NUTRI</span>
                          <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#000', boxShadow: `0 0 8px ${bg}70` }}>{g.toUpperCase()}</span>
                        </div>
                      );
                    })()}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm(f);
                        setEditingIndex(originalIdx);
                        setPantryMode('create');
                        setCreateTab('basics');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim, rgba(255,255,255,0.6))', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDialog({ title: 'Delete Food', message: `Are you sure you want to delete "${f.name}" from your Pantry?`, onConfirm: () => { setConfirmDialog(null); deleteCustomFood(originalIdx); } });
                      }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={16} />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  {(() => {
                    const { grade: g, estimated } = estimateNutriScore(configuringFood);
                    if (!g) return null;
                    const nsColor: Record<string,string> = { a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11' };
                    const bg = nsColor[g] || '#888';
                    return (
                      <button 
                        onClick={() => setShowNutriPopup(true)}
                        title={`Nutri-Score ${g.toUpperCase()}${estimated ? ' (estimated)' : ''} — tap to learn more`} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          gap: '6px',
                          background: `${bg}18`,
                          border: `1px solid ${bg}44`,
                          borderRadius: '10px',
                          padding: '3px 8px',
                          boxShadow: `0 0 8px ${bg}20`,
                          height: '32px',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          const btn = e.currentTarget as HTMLButtonElement;
                          btn.style.boxShadow = `0 0 12px ${bg}50`;
                          btn.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={e => {
                          const btn = e.currentTarget as HTMLButtonElement;
                          btn.style.boxShadow = `0 0 8px ${bg}20`;
                          btn.style.transform = 'scale(1)';
                        }}
                      >
                        <span style={{ fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{estimated ? '~' : ''}NUTRI</span>
                        <span style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '6px', 
                          background: bg, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '11px', 
                          fontWeight: '900', 
                          color: '#000', 
                          boxShadow: `0 0 6px ${bg}80` 
                        }}>
                          {g.toUpperCase()}
                        </span>
                      </button>
                    );
                  })()}
                  <button onClick={() => { setConfiguringFood(null); setConfiguringFromRecipe(false); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                </div>
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
                const fb = (Number(configuringFood.fb || configuringFood.fiber || configuringFood.Fiber) || 0) * multiplier;
                const sugars = (Number(configuringFood.sugars) || 0) * multiplier;
                const totalCal = (Number(configuringFood.cal) || 0) * multiplier;
                
                const isHighProtein = (p * 4) / (totalCal || 1) > 0.35;
                const isHighCarb = (c * 4) / (totalCal || 1) > 0.6;
                const isHighFat = (f * 9) / (totalCal || 1) > 0.5;

                // Mineral density flags — named specifically so user knows which mineral
                const ironMg = (Number((configuringFood as any).Iron) || 0) * multiplier;
                const sodiumMg = (Number((configuringFood as any).Sodium || (configuringFood as any).sodium) || 0) * multiplier;
                const calciumMg = (Number((configuringFood as any).Calcium || (configuringFood as any).calcium) || 0) * multiplier;
                const potassiumMg = (Number((configuringFood as any).Potassium || (configuringFood as any).potassium) || 0) * multiplier;

                const mineralBadges: { label: string; key: string }[] = [];
                if (ironMg > 4) mineralBadges.push({ label: 'Dense in Iron', key: 'iron' });
                if (sodiumMg > 600) mineralBadges.push({ label: 'Dense in Sodium', key: 'sodium' });
                if (calciumMg > 300) mineralBadges.push({ label: 'Dense in Calcium', key: 'calcium' });
                if (potassiumMg > 400) mineralBadges.push({ label: 'Dense in Potassium', key: 'potassium' });

                const carbClass = getCarbClassification({ c, sugars, fb, f, p, cal: totalCal });

                return (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {isHighProtein && (
                      <div style={{ padding: '4px 10px', background: 'rgba(146, 254, 157, 0.1)', border: '1px solid var(--theme-success)', borderRadius: '10px', color: 'var(--theme-success)', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={10} /> PROTEIN POWERHOUSE
                      </div>
                    )}
                    {isHighCarb && carbClass.key !== 'none' && (
                      <div style={{ 
                        padding: '4px 10px', 
                        background: carbClass.key === 'sustained-energy' 
                          ? 'rgba(146, 254, 157, 0.1)' 
                          : (carbClass.key === 'refined-carbs' || carbClass.key === 'simple-carbs' 
                            ? 'rgba(255, 107, 107, 0.1)' 
                            : (carbClass.key === 'hybrid-bites' ? 'rgba(252, 196, 25, 0.1)' : 'rgba(0, 201, 255, 0.1)')), 
                        border: `1px solid ${
                          carbClass.key === 'sustained-energy' 
                            ? 'var(--theme-success)' 
                            : (carbClass.key === 'refined-carbs' || carbClass.key === 'simple-carbs' 
                              ? '#FF6B6B' 
                              : (carbClass.key === 'hybrid-bites' ? '#FCC419' : 'var(--theme-accent)'))
                        }`, 
                        borderRadius: '10px', 
                        color: carbClass.key === 'sustained-energy' 
                          ? 'var(--theme-success)' 
                          : (carbClass.key === 'refined-carbs' || carbClass.key === 'simple-carbs' 
                            ? '#FF6B6B' 
                            : (carbClass.key === 'hybrid-bites' ? '#FCC419' : 'var(--theme-accent)')), 
                        fontSize: '10px', 
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {getCarbClassIcon(carbClass.key, 10)}
                        <span>{carbClass.name.toUpperCase()}</span>
                      </div>
                    )}
                    {isHighFat && (
                      <div style={{ padding: '4px 10px', background: 'rgba(255, 107, 107, 0.1)', border: '1px solid #FF6B6B', borderRadius: '10px', color: '#FF6B6B', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={10} /> HIGH FAT CONTENT
                      </div>
                    )}

                    {mineralBadges.map(b => (
                      <div key={b.label} style={{ padding: '4px 10px', background: 'rgba(0, 201, 255, 0.08)', border: '1px solid rgba(0,201,255,0.35)', borderRadius: '10px', color: 'var(--theme-accent)', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {getMineralIcon(b.key, 10)}
                        <span>{b.label.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Config Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', display: 'block', marginBottom: '6px' }}>AMOUNT</label>
                    <input 
                      className="config-input"
                      type="number" 
                      inputMode="decimal"
                      value={servingQty}
                      onChange={(e) => setServingQty(e.target.value)}
                      style={{ width: '100%', background: 'var(--theme-panel, rgba(0,0,0,0.2))', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '12px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#8b8b9b', display: 'block', marginBottom: '6px' }}>UNIT</label>
                    <select 
                      className="config-input"
                      value={servingUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value;
                        const oldUnit = servingUnit || 'g';
                        const oldQty = parseFloat(servingQty) || 1;
                        
                        const currentMult = computeMultiplier(configuringFood?.serving || '', oldUnit, oldQty);
                        const newQtyVal = getQuantityForUnit(configuringFood?.serving || '', currentMult, newUnit);
                        const roundedQty = Math.round(newQtyVal * 100) / 100;

                        setServingQty(roundedQty.toString());
                        setServingUnit(newUnit);
                      }}
                      style={{ width: '100%', background: 'var(--theme-panel, rgba(0,0,0,0.2))', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '12px', outline: 'none' }}>
                      {SERVING_UNITS.map(u => <option key={u.v} value={u.v}>{u.v}</option>)}
                    </select>
                  </div>
                </div>

                {/* Intelligence Scaling Row */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPromptDialog({ title: 'Scale to Calories', message: 'Enter target Calories (kcal):', defaultValue: '500', onConfirm: (v) => { setPromptDialog(null); const targetKcal = Number(v); const baseKcal = Number(configuringFood.cal) || 0; if (baseKcal > 0) { const multForOne = computeMultiplier(configuringFood.serving, servingUnit, 1); setServingQty((targetKcal / (baseKcal * multForOne)).toFixed(1)); } } })}
                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-accent, #00C9FF)', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Flame size={12}/> SCALE TO KCAL
                  </button>
                  <button
                    onClick={() => setPromptDialog({ title: 'Scale to Protein', message: 'Enter target Protein (g):', defaultValue: '30', onConfirm: (v) => { setPromptDialog(null); const targetP = Number(v); const baseP = Number(configuringFood.p) || 0; if (baseP > 0) { const multForOne = computeMultiplier(configuringFood.serving || '', servingUnit, 1); setServingQty((targetP / (baseP * multForOne)).toFixed(1)); } } })}
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
                  <div style={{ marginTop: '12px' }}>
                    <NutritionFactsDisplay 
                      food={configuringFood} 
                      multiplier={computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1)} 
                    />
                  </div>
                )}
              </div>

              {/* Assign to Meal Selector */}
              <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '18px', border: '1px solid var(--theme-border)' }}>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-accent)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assign to Meal</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTargetMeal(m)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: targetMeal === m ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-border, rgba(255,255,255,0.08))',
                        background: targetMeal === m ? 'var(--theme-accent-dim, rgba(0, 201, 255, 0.1))' : 'rgba(255,255,255,0.03)',
                        color: targetMeal === m ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim)',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {!configuringFromRecipe && (
                <button 
                  onClick={() => {
                    const mult = computeMultiplier(configuringFood.serving || '', servingUnit, parseFloat(servingQty) || 1);
                    const scaled = scaleLegacyFoodByAmount(configuringFood, mult);
                    // Stamp the actual amount the user configured so DiaryView shows the right weight
                    scaled.serving = `${servingQty} ${servingUnit}`;
                    scaled.sQty = parseFloat(servingQty) || 1;
                    scaled.sUnit = servingUnit;
                    addFoodLog(targetMeal, scaled);
                    setConfiguringFood(null);
                    showNotification(`Added to ${targetMeal}!`);
                  }}
                  style={{ width: '100%', padding: '16px', background: 'var(--theme-success, #92FE9D)', border: 'none', borderRadius: '16px', color: '#000000', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(146,254,157,0.15)' }}>
                  <Plus size={20} /> ADD TO FOOD LOG
                </button>
                )}

                <button 
                  onClick={() => {
                    const qty = parseFloat(servingQty) || 1;
                    const newItems = [...(form.ingredientItems || []), { food: configuringFood, qty: qty.toString(), unit: servingUnit }];
                    calculateRecipeTotals(newItems);
                    setConfiguringFood(null);
                    setConfiguringFromRecipe(false);
                    setIngResults([]);
                    setIngQuery('');
                    setActiveTab('saved');
                    setPantryMode('create');
                    setCreateTab('recipe');
                  }}
                  style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border)', borderRadius: '16px', color: 'var(--theme-text)', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Sparkles size={18} color="var(--theme-accent)" /> USE AS INGREDIENT
                </button>

                {!configuringFromRecipe && (
                <button 
                  onClick={handleConfirmAddPantry}
                  style={{ width: '100%', padding: '14px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'var(--theme-text-dim)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                  RE-SAVE TO PANTRY
                </button>
                )}
              </div>
          </div>
        </div>
      )}
      {showNutriPopup && configuringFood && (
        <NutriScorePopup food={configuringFood} onClose={() => setShowNutriPopup(false)} />
      )}
      {promptDialog && <PromptDialog title={promptDialog.title} message={promptDialog.message} defaultValue={promptDialog.defaultValue} placeholder={promptDialog.placeholder} onConfirm={promptDialog.onConfirm} onCancel={() => setPromptDialog(null)} />}
      {confirmDialog && <ConfirmDialog title={confirmDialog.title} message={confirmDialog.message} danger onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />}

      {saveRecipeConfig && (() => {
        const totalServings = Math.max(1, parseFloat(recipeTotalServings) || 1);
        const getValPerServing = (val: number | undefined) => {
          if (val === undefined || isNaN(val)) return 0;
          return val / totalServings;
        };

        const renderNutrientRow = (label: string, key: string, unit: string, color: string) => {
          const totalVal = Number(saveRecipeConfig.totals[key]) || 0;
          const perServingVal = getValPerServing(totalVal);
          
          let displayTotal = '';
          let displayPerServing = '';
          
          if (key === 'cal') {
            displayTotal = `${Math.round(totalVal)} ${unit}`;
            displayPerServing = `${Math.round(perServingVal)} ${unit}`;
          } else {
            displayTotal = `${totalVal.toFixed(1)} ${unit}`;
            displayPerServing = `${perServingVal.toFixed(1)} ${unit}`;
          }

          return (
            <div 
              key={key} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '8px 12px', 
                background: 'rgba(255,255,255,0.02)', 
                borderBottom: '1px solid rgba(255,255,255,0.04)', 
                borderRadius: '8px', 
                fontSize: '12px' 
              }}
            >
              <span style={{ fontWeight: '700', color }}>{label}</span>
              <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
                <span style={{ color: 'var(--theme-text-dim)', minWidth: '80px' }}>{displayTotal}</span>
                <span style={{ color: 'var(--theme-accent, #00C9FF)', fontWeight: '800', minWidth: '80px' }}>{displayPerServing}</span>
              </div>
            </div>
          );
        };

        return (
          <div style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 8000, 
            background: 'rgba(0,0,0,0.85)', 
            backdropFilter: 'blur(12px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px' 
          }}>
            <div style={{ 
              background: 'var(--theme-panel, #121520)', 
              border: '1px solid var(--theme-border, rgba(255,255,255,0.08))', 
              borderRadius: '24px', 
              padding: '24px', 
              maxWidth: '560px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              boxShadow: '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)', 
              animation: 'pdIn 0.25s ease-out' 
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(0,201,255,0.1)', padding: '8px', borderRadius: '10px' }}>
                    <Sparkles size={18} color="var(--theme-accent)" />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>
                    SAVE MEAL TO PANTRY
                  </h3>
                </div>
                <button 
                  onClick={() => setSaveRecipeConfig(null)} 
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--theme-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Meal Name Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Meal / Recipe Name
                </label>
                <input 
                  value={recipeSaveName}
                  onChange={(e) => setRecipeSaveName(e.target.value)}
                  placeholder="e.g. Teriyaki Chicken with Rice"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: '1.5px solid var(--theme-border, rgba(255,255,255,0.15))', 
                    background: 'rgba(0,0,0,0.25)', 
                    color: '#fff', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    outline: 'none', 
                    boxSizing: 'border-box' 
                  }}
                />
              </div>

              {/* Serving Size & Batch Definition */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Default Portion Logged */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Default Portion Size
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="number"
                      min="0.1"
                      step="any"
                      value={recipeServingQty}
                      onChange={(e) => setRecipeServingQty(e.target.value)}
                      style={{ 
                        width: '60px', 
                        padding: '10px', 
                        borderRadius: '12px', 
                        border: '1.5px solid var(--theme-border, rgba(255,255,255,0.15))', 
                        background: 'rgba(0,0,0,0.25)', 
                        color: '#fff', 
                        fontSize: '13px', 
                        fontWeight: '700', 
                        textAlign: 'center', 
                        outline: 'none' 
                      }}
                    />
                    <input 
                      value={recipeServingUnit}
                      onChange={(e) => setRecipeServingUnit(e.target.value)}
                      placeholder="serving, meal"
                      style={{ 
                        flex: 1, 
                        padding: '10px 12px', 
                        borderRadius: '12px', 
                        border: '1.5px solid var(--theme-border, rgba(255,255,255,0.15))', 
                        background: 'rgba(0,0,0,0.25)', 
                        color: '#fff', 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        outline: 'none', 
                        boxSizing: 'border-box' 
                      }}
                    />
                  </div>
                </div>

                {/* Number of Servings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Servings in Batch
                  </label>
                  <input 
                    type="number"
                    min="1"
                    step="any"
                    value={recipeTotalServings}
                    onChange={(e) => setRecipeTotalServings(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: '12px', 
                      border: '1.5px solid var(--theme-border, rgba(255,255,255,0.15))', 
                      background: 'rgba(0,0,0,0.25)', 
                      color: '#fff', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      outline: 'none', 
                      boxSizing: 'border-box' 
                    }}
                  />
                </div>
              </div>

              {/* Nutrient Comparison Preview Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Nutrient Breakdown
                  </label>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '10px', fontWeight: '800', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <span style={{ minWidth: '80px', textAlign: 'right' }}>Total Batch</span>
                    <span style={{ minWidth: '80px', textAlign: 'right', color: 'var(--theme-accent, #00C9FF)' }}>Per Serving</span>
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '16px', 
                  padding: '8px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px' 
                }}>
                  {renderNutrientRow('Calories', 'cal', 'kcal', 'var(--theme-text)')}
                  {renderNutrientRow('Protein', 'p', 'g', '#00C9FF')}
                  {renderNutrientRow('Carbs', 'c', 'g', '#FCC419')}
                  {renderNutrientRow('Fat', 'f', 'g', '#FF6B6B')}
                  {renderNutrientRow('Fiber', 'fiber', 'g', 'rgba(255,255,255,0.85)')}
                  {renderNutrientRow('Sugars', 'sugars', 'g', 'rgba(255,255,255,0.7)')}
                  {renderNutrientRow('Sodium', 'Sodium', 'mg', 'rgba(255,255,255,0.6)')}
                  {renderNutrientRow('Potassium', 'Potassium', 'mg', 'rgba(255,255,255,0.6)')}
                  {renderNutrientRow('Calcium', 'Calcium', 'mg', 'rgba(255,255,255,0.6)')}
                  {renderNutrientRow('Magnesium', 'Magnesium', 'mg', 'rgba(255,255,255,0.6)')}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px', marginTop: '8px' }}>
                <button 
                  onClick={() => setSaveRecipeConfig(null)}
                  style={{ 
                    padding: '14px', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    background: 'rgba(255,255,255,0.04)', 
                    color: 'var(--theme-text-dim)', 
                    fontSize: '13px', 
                    fontWeight: '800', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s' 
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmSaveRecipe}
                  style={{ 
                    padding: '14px', 
                    borderRadius: '16px', 
                    border: 'none', 
                    background: 'var(--theme-accent, #00C9FF)', 
                    color: '#000', 
                    fontSize: '13px', 
                    fontWeight: '900', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    boxShadow: '0 4px 15px var(--theme-accent-dim)' 
                  }}
                >
                  <Check size={16} /> Save to Pantry
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};


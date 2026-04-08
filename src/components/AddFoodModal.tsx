import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDiary } from '../context/DiaryContext';
import { FOOD_DB } from '../lib/constants';
import { computeMultiplier, scaleLegacyFoodByAmount, COMMON_UNITS } from '../lib/food/serving-converter';
import { Search, Camera, FileText, Sparkles, Plus, Check, Scan, ChevronLeft } from 'lucide-react';
import { calculateVitalityScore } from '../lib/scoring/vitality';
import { VitalityBadge } from './VitalityBadge';
import { BrowserMultiFormatReader } from '@zxing/library';

type Tab = 'search' | 'ai-search' | 'describe' | 'barcode' | 'label' | 'pantry';

interface AddFoodModalProps {
  meal: string;
  onClose: () => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({ meal, onClose }) => {
  const { localCache, addFoodLog } = useDiary();
  const [activeTab, setActiveTab] = useState<Tab>('search');
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Describe meal state
  const [mealDesc, setMealDesc] = useState('');
  
  // Configuring single food
  const [configuringFood, setConfiguringFood] = useState<any | null>(null);
  const [servingQty, setServingQty] = useState('1');
  const [servingUnit, setServingUnit] = useState('serving');

  // Scanner status
  const [scanStatus, setScanStatus] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeReader = new BrowserMultiFormatReader();

  const handleBackToSearch = () => {
    setConfiguringFood(null);
  };

  const handleAddFoodClick = (food: any) => {
    setConfiguringFood(food);
    setServingQty('1');
    setServingUnit('serving');
  };

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (configuringFood) {
      const qty = parseFloat(servingQty) || 1;
      const mult = computeMultiplier(configuringFood.serving || '', servingUnit, qty);
      const scaledFood = scaleLegacyFoodByAmount(configuringFood, mult);
      
      const unitLabel = COMMON_UNITS.find((u: any) => u.id === servingUnit)?.label || servingUnit;
      scaledFood.serving = `${qty} ${unitLabel} (Customized)`;
      
      addFoodLog(meal, scaledFood);
      onClose();
    }
  };

  const addDirectly = (food: any) => {
    addFoodLog(meal, food);
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
      const res = await fetch(`/api/ai-lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed AI search');
        setResults(body.foods || []);
      } else {
        throw new Error('Our AI services are temporarily resting. Using local search fallback...');
      }
    } catch(err: any) {
      console.warn("AI Search Error:", err);
      // Fallback to local
      const q = query.toLowerCase();
      const pantry = localCache.customFoods || [];
      const combinedDB = [...pantry, ...FOOD_DB];
      const localFallbacks = combinedDB.filter((f: any) => f.name.toLowerCase().includes(q));
      setResults(localFallbacks);
      setErrorMsg(err.message.includes('JSON') ? 'AI service error. Showing local matches.' : err.message);
    }
    setSearching(false);
  };

  const handleDescribeMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealDesc) return;
    setSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/ai-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: mealDesc, meal })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed AI meal estimation');
      
      // For describe meal, we directly add all returned foods or show them as results
      setResults(body.foods || []);
    } catch(err: any) {
      setErrorMsg(err.message);
    }
    setSearching(false);
  };

  // --- Photo Scanners ---
  
  const handleBarcodeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanStatus('Decoding barcode...');
    const url = URL.createObjectURL(file);
    try {
      const result = await codeReader.decodeFromImageUrl(url);
      setScanStatus(`Barcode found: ${result.getText()}. Fetching food...`);
      setQuery(result.getText());
      
      // Auto trigger search using the barcode as query
      setSearching(true);
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(result.getText())}`);
      if (res.ok) {
        const body = await res.json();
        setResults(body.foods || body.results || []);
        if ((body.foods || body.results || []).length === 0) {
          setErrorMsg('Barcode scanned but no product found in database.');
        } else {
          setScanStatus('');
        }
      } else {
        throw new Error('API error during barcode lookup');
      }
      setSearching(false);
    } catch (err) {
      console.error(err);
      setScanStatus('');
      setErrorMsg('Could not detect a clear barcode in the image. Please try typing it manually.');
    }
    URL.revokeObjectURL(url);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLabelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanStatus('Analyzing label with AI...');
    setErrorMsg('');
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/ai-label', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: base64Str, mediaType: file.type })
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed AI label scan');
        
        // Auto-configure the single food returned
        if (body.food) {
          setConfiguringFood(body.food);
          setServingQty('1');
          setServingUnit('serving');
          setScanStatus('');
        } else {
          setErrorMsg('No food data extracted from label.');
          setScanStatus('');
        }
      } catch (err: any) {
        setScanStatus('');
        setErrorMsg(err.message || 'Error processing nutrition label image.');
      }
    };
    reader.onerror = () => {
      setScanStatus('');
      setErrorMsg('Failed to process image file.');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Rendering ---

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'var(--theme-bg, #001114)', zIndex: 99999, display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div style={{ background: 'var(--theme-panel-base, #10141f)', padding: '16px 16px 0 16px', borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--theme-text)' }}>Add to {meal}</h3>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--theme-text)', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>

        {/* TABS */}
        {!configuringFood && (
          <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            <TabBtn active={activeTab==='search'} onClick={() => setActiveTab('search')} icon={<Search size={14}/>} label="Search" />
            <TabBtn active={activeTab==='pantry'} onClick={() => setActiveTab('pantry')} icon={<Plus size={14}/>} label="Pantry" />
            <TabBtn active={activeTab==='ai-search'} onClick={() => setActiveTab('ai-search')} icon={<Sparkles size={14}/>} label="AI Search" />
            <TabBtn active={activeTab==='describe'} onClick={() => setActiveTab('describe')} icon={<FileText size={14}/>} label="Describe Meal" />
            <TabBtn active={activeTab==='barcode'} onClick={() => setActiveTab('barcode')} icon={<Scan size={14}/>} label="Barcode" />
            <TabBtn active={activeTab==='label'} onClick={() => setActiveTab('label')} icon={<Camera size={14}/>} label="Label Scan" />
          </div>
        )}
      </div>

      {/* CONTENT PORTION */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        
        {/* SERVING CONFIGURATOR MODE */}
        {configuringFood ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <button onClick={handleBackToSearch} style={{ background: 'none', border: 'none', color: 'var(--theme-accent, #00C9FF)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0, marginBottom: '20px', fontWeight: '600' }}>
              <ChevronLeft size={16} /> Back to results
            </button>
            <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--theme-text)' }}>{configuringFood.name}</h4>
              <div style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '13px', marginBottom: '20px' }}>Base: {configuringFood.serving} • {configuringFood.cal} kcal</div>
              
              <form id="serving-form" onSubmit={handleConfirmAdd} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '6px' }}>Amount</label>
                  <input type="number" step="0.1" required value={servingQty} onChange={e => setServingQty(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', padding: '12px', color: 'var(--theme-text)', borderRadius: '12px' }} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '6px' }}>Unit</label>
                  <select value={servingUnit} onChange={e => setServingUnit(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', padding: '12px', color: 'var(--theme-text)', borderRadius: '12px', WebkitAppearance: 'none' }}>
                    {COMMON_UNITS.map((u: any) => <option key={u.id} value={u.id} style={{ background: 'var(--theme-panel, #fff)', color: 'var(--theme-panel-base, #000)' }}>{u.label}</option>)}
                  </select>
                </div>
              </form>
            </div>
            <button form="serving-form" type="submit" style={{ marginTop: 'auto', padding: '16px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Check size={18} /> Add to Diary
            </button>
          </div>
        ) : (
          /* STANDARD TAB MODES */
          <>
            {activeTab === 'pantry' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--theme-text)' }}>Your Saved Pantry</h3>
                {localCache.customFoods && localCache.customFoods.length > 0 ? (
                  localCache.customFoods.map((f: any, i: number) => (
                    <div key={i} onClick={() => handleAddFoodClick(f)} style={{ padding: '16px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid var(--theme-success, #92FE9D)' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text)' }}>
                          {f.name}
                          <VitalityBadge {...calculateVitalityScore(f)} />
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--theme-text-dim, #8b8b9b)' }}>{f.cal} kcal • P:{f.p}g C:{f.c}g F:{f.f}g</div>
                      </div>
                      <Plus size={20} color="var(--theme-accent, #00C9FF)" />
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '14px' }}>Your pantry is empty. Use the "Pantry" tab in the dashboard to add foods!</div>
                )}
              </div>
            )}

            {(activeTab === 'search' || activeTab === 'ai-search') && (
              <form onSubmit={activeTab === 'search' ? handleStandardSearch : handleAISearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  autoFocus
                  placeholder={activeTab === 'search' ? "Search USDA & OpenFoodFacts..." : "AI Keyword Search (e.g. 'sweet potato fries')..."}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', color: 'var(--theme-text)', outline: 'none' }}
                />
                <button type="submit" disabled={searching} style={{ padding: '0 16px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  <Search size={18} />
                </button>
              </form>
            )}

            {activeTab === 'describe' && (
              <form onSubmit={handleDescribeMeal} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <textarea 
                  autoFocus
                  rows={4}
                  placeholder="Describe your entire meal naturally... e.g. 'I had 3 large eggs scrambled with a slice of american cheese and 2 pieces of whole wheat toast'"
                  value={mealDesc}
                  onChange={e => setMealDesc(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.2))', background: 'var(--theme-input-bg, rgba(0,0,0,0.3))', color: 'var(--theme-text)', outline: 'none', resize: 'vertical' }}
                />
                <button type="submit" disabled={searching} style={{ padding: '12px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', borderRadius: '12px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Sparkles size={18} /> Parse & Estimate
                </button>
              </form>
            )}

            {activeTab === 'barcode' && (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '16px', marginBottom: '16px' }}>
                <Scan size={48} color="var(--theme-accent, #00C9FF)" style={{ marginBottom: '16px' }} />
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--theme-text)' }}>Scan Barcode</h4>
                <p style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '13px', marginBottom: '24px' }}>Take a photo of a barcode. We'll automatically decode it and look it up.</p>
                <input type="file" accept="image/*" onChange={handleBarcodeFile} ref={fileInputRef} id="barcode-upload" style={{ display: 'none' }} />
                <label htmlFor="barcode-upload" style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }}>
                  Upload / Take Photo
                </label>
              </div>
            )}

            {activeTab === 'label' && (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '16px', marginBottom: '16px' }}>
                <Camera size={48} color="var(--theme-accent, #00C9FF)" style={{ marginBottom: '16px' }} />
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--theme-text)' }}>Nutritional Label Scan</h4>
                <p style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '13px', marginBottom: '24px' }}>Take a clear picture of any nutrition label. Claude AI will read the exact macros and micros directly into your log.</p>
                <input type="file" accept="image/*" onChange={handleLabelFile} ref={fileInputRef} id="label-upload" style={{ display: 'none' }} />
                <label htmlFor="label-upload" style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }}>
                  Capture Label
                </label>
              </div>
            )}

            {/* STATUS / ERRORS */}
            {(searching || scanStatus) && (
              <div style={{ textAlign: 'center', color: 'var(--theme-text-dim, #8b8b9b)', padding: '20px' }}>
                <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--theme-accent, #00C9FF)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                <div>{scanStatus || 'Searching...'}</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {errorMsg && (
              <div style={{ padding: '12px', background: 'var(--theme-error-dim, rgba(255,107,107,0.1))', color: 'var(--theme-error, #FF6B6B)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                {errorMsg}
              </div>
            )}

            {/* RESULTS LIST */}
            {!searching && results.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeTab === 'describe' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--theme-success, #92FE9D)', fontSize: '13px', fontWeight: '600' }}>AI generated {results.length} items:</span>
                    <button onClick={() => { results.forEach(addDirectly); onClose(); }} style={{ background: 'var(--theme-success, #92FE9D)', color: 'var(--theme-panel-base, #000)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>Add All</button>
                  </div>
                )}
                {results.map((res: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text)' }}>
                        {res.name}
                        <VitalityBadge {...calculateVitalityScore(res)} />
                      </div>
                      <div style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '13px' }}>{res.serving} • {Math.round(res.cal || 0)} kcal • {res._src === 'usda' ? '🏛️ USDA' : res._src === 'ai' ? '🤖 AI' : '📦 Label'}</div>
                    </div>
                    <button 
                      onClick={() => handleAddFoodClick(res)} 
                      style={{ width: '36px', height: '36px', borderRadius: '18px', background: 'var(--theme-accent-dim, rgba(0,201,255,0.2))', border: 'none', color: 'var(--theme-accent, #00C9FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {!searching && (activeTab === 'search' || activeTab === 'ai-search' || activeTab === 'barcode') && query && results.length === 0 && !errorMsg && (
              <div style={{ textAlign: 'center', color: '#8b8b9b', padding: '40px 20px' }}>No results found.</div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} style={{ 
    display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
    padding: '8px 12px', borderRadius: '20px', 
    background: active ? 'var(--theme-accent-dim, rgba(0,201,255,0.15))' : 'transparent', 
    color: active ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #8b8b9b)', 
    border: `1px solid ${active ? 'var(--theme-accent, rgba(0,201,255,0.3))' : 'var(--theme-border, rgba(255,255,255,0.1))'}`,
    fontWeight: active ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s',
    fontSize: '13px'
  }}>
    {icon} {label}
  </button>
);

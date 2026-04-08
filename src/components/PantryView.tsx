import React, { useState, useRef } from 'react';
import { useDiary } from '../context/DiaryContext';
import { Plus, Trash2, Camera, Scan, ChevronDown, ChevronUp, Search, Loader2, Utensils, BookmarkPlus, LogIn, Scale, Check, X, Info, Edit3 } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { ALL_MICRO_KEYS, MEALS, MICRO_UNITS } from '../lib/constants';
import { NUTRIENT_BENEFITS } from '../lib/nutrient-info';
import { computeMultiplier, scaleLegacyFoodByAmount, COMMON_UNITS } from '../lib/food/serving-converter';
import ReactDOM from 'react-dom';
import { calculateVitalityScore } from '../lib/scoring/vitality';
import { VitalityBadge } from './VitalityBadge';

export const PantryView: React.FC = () => {
  const { localCache, saveCustomFood, updateCustomFood, deleteCustomFood } = useDiary();
  
  const [form, setForm] = useState<any>({ name: '', cal: '', p: '', c: '', f: '', ingredients: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showMicros, setShowMicros] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'add' | 'saved'>('add');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeReader = new BrowserMultiFormatReader();
  
  const customFoods = localCache.customFoods || [];
  const [loggingFood, setLoggingFood] = useState<any | null>(null);

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
    if (editingIndex !== null) setActiveTab('saved');
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
    setActiveTab('add');
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
  };

  const handleBarcodeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanStatus('Decoding barcode...');
    setErrorMsg('');
    const url = URL.createObjectURL(file);
    try {
      const result = await codeReader.decodeFromImageUrl(url);
      setScanStatus(`Barcode found: ${result.getText()}. Fetching food...`);
      
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(result.getText())}`);
      if (res.ok) {
        const body = await res.json();
        const results = body.foods || body.results || [];
        if (results.length > 0) {
          mapApiFoodToForm(results[0]);
          setScanStatus('');
        } else {
          setErrorMsg('Barcode scanned but no product found in database.');
          setScanStatus('');
        }
      } else {
        throw new Error('API error during barcode lookup');
      }
    } catch (err) {
      console.error(err);
      setScanStatus('');
      setErrorMsg('Could not detect a clear barcode in the image.');
    }
    URL.revokeObjectURL(url);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLabelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanStatus('Analyzing label with AI...');
    setErrorMsg('');
    
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
        
        if (body.food) {
          mapApiFoodToForm(body.food);
          setScanStatus('');
        } else {
          setErrorMsg('No food data extracted from label.');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Premium Tab Switcher */}
      <div style={{ display: 'flex', background: 'var(--theme-panel-dim, rgba(255,255,255,0.03))', padding: '6px', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', marginBottom: '8px' }}>
          <button 
            onClick={() => { setActiveTab('add'); if (editingIndex === null) setEditingIndex(null); }}
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', background: activeTab === 'add' ? 'var(--theme-accent-dim, rgba(0,201,255,0.1))' : 'transparent', color: activeTab === 'add' ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #8b8b9b)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={16} /> {editingIndex !== null ? 'Edit Food' : 'Add Foods'}
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', background: activeTab === 'saved' ? 'var(--theme-success-dim, rgba(146,254,157,0.1))' : 'transparent', color: activeTab === 'saved' ? 'var(--theme-success, #92FE9D)' : 'var(--theme-text-dim, #8b8b9b)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Utensils size={16} /> My Saved Foods ({customFoods.length})
          </button>
      </div>

      {activeTab === 'add' && (
        <>
          {editingIndex === null && (
            <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text)' }}>
                <Search size={18} color="var(--theme-accent, #00C9FF)" /> Search Global Database
              </h2>
              <form onSubmit={handleGlobalSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  className="inp"
                  placeholder="Search millions of foods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" disabled={isSearching} className="btn" style={{ marginTop: 0, width: 'auto', padding: '0 20px' }}>
                  {isSearching ? <Loader2 className="spin" size={18} /> : 'Search'}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', padding: '8px', background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', borderRadius: '12px' }}>
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
          )}

          {/* Create/Edit Food Form */}
          <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text)' }}>
              {editingIndex !== null ? <Edit3 size={18} color="var(--theme-accent, #00C9FF)" /> : <Plus size={18} color="var(--theme-success, #92FE9D)" />} 
              {editingIndex !== null ? 'Modify Pantry Item' : 'New Pantry Manual Entry'}
            </h2>

            {editingIndex === null && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <input type="file" accept="image/*" onChange={handleBarcodeFile} ref={fileInputRef} id="pantry-barcode" style={{ display: 'none' }} />
                <label htmlFor="pantry-barcode" style={{ flex: 1, padding: '12px', background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', color: 'var(--theme-accent, #00C9FF)', border: '1px dashed var(--theme-accent, rgba(0,201,255,0.3))', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <Scan size={18} /> Scan Barcode
                </label>
                
                <input type="file" accept="image/*" onChange={handleLabelFile} id="pantry-label" style={{ display: 'none' }} />
                <label htmlFor="pantry-label" style={{ flex: 1, padding: '12px', background: 'var(--theme-success-dim, rgba(146,254,157,0.1))', color: 'var(--theme-success, #92FE9D)', border: '1px dashed var(--theme-success, rgba(146,254,157,0.3))', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <Camera size={18} /> Scan Label
                </label>
              </div>
            )}

            {scanStatus && <div style={{ color: 'var(--theme-accent, #00C9FF)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>🔄 {scanStatus}</div>}
            {errorMsg && <div style={{ color: 'var(--theme-error, #FF6B6B)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</div>}

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
              
              <div>
                <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>Ingredients List</label>
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
          </div>
        </>
      )}

      {/* Pantry List (Saved Foods Tab) */}
      {activeTab === 'saved' && (
        <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px', minHeight: '400px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text, #fff)' }}>
            <Utensils size={18} color="var(--theme-success, #92FE9D)" /> My Custom Database
          </h2>
          
          {customFoods.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--theme-text-dim, #8b8b9b)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🍱</div>
              <div style={{ fontWeight: '600' }}>Your pantry is empty.</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Add your first custom food or scan a label to get started!</div>
              <button onClick={() => setActiveTab('add')} style={{ marginTop: '20px', background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', border: '1px solid var(--theme-border, rgba(0,201,255,0.2))', padding: '10px 20px', borderRadius: '12px', color: 'var(--theme-accent, #00C9FF)', fontWeight: '600', cursor: 'pointer' }}>
                Go to Add Foods
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

      {loggingFood && (
        <PantryLogModal 
          food={loggingFood} 
          onClose={() => setLoggingFood(null)} 
        />
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

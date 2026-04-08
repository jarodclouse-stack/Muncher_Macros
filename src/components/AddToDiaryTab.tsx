import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { Search, Plus, Check, Scale, ChevronDown, Utensils } from 'lucide-react';
import { computeMultiplier, scaleLegacyFoodByAmount } from '../lib/food/serving-converter';
import { VitalityBadge } from './VitalityBadge';
import { calculateVitalityScore } from '../lib/scoring/vitality';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const COMMON_UNITS = [
  { id: 'serving', label: 'Serving' },
  { id: 'g', label: 'Grams (g)' },
  { id: 'oz', label: 'Ounces (oz)' },
  { id: 'cup', label: 'Cups' },
  { id: 'tbsp', label: 'Tablespoons' },
  { id: 'tsp', label: 'Teaspoons' },
  { id: 'piece', label: 'Pieces/Items' }
];

export const AddToDiaryTab: React.FC<{ customFoods: any[] }> = ({ customFoods }) => {
  const { addFoodLog } = useDiary();
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [meal, setMeal] = useState('Breakfast');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = customFoods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleLog = () => {
    if (!selectedFood) return;
    const q = parseFloat(qty) || 1;
    const mult = computeMultiplier(selectedFood.serving || '1 serving', unit, q);
    const scaled = scaleLegacyFoodByAmount(selectedFood, mult);
    
    // Add info about the logged serving
    const unitLabel = COMMON_UNITS.find(u => u.id === unit)?.label || unit;
    scaled.serving = `${q} ${unitLabel} (from Pantry)`;
    
    addFoodLog(meal, scaled);
    
    setSuccessMsg(`Added ${selectedFood.name} to ${meal}!`);
    setTimeout(() => {
      setSuccessMsg(null);
      setSelectedFood(null);
      setQty('1');
    }, 2000);
  };

  const currentMultiplier = selectedFood ? computeMultiplier(selectedFood.serving || '1 serving', unit, parseFloat(qty) || 0) : 0;
  const previewCals = selectedFood ? Math.round((selectedFood.cal || 0) * currentMultiplier) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search Filter */}
      <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--theme-text-dim, #8b8b9b)' }} />
          <input 
            className="inp"
            placeholder="Search your pantry..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '44px' }}
          />
      </div>

      {successMsg && (
        <div style={{ background: 'var(--theme-success-dim, rgba(146,254,157,0.1))', color: 'var(--theme-success, #92FE9D)', padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '700', border: '1px solid var(--theme-success-dim, rgba(146,254,157,0.2))' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Food List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--theme-text-dim, #8b8b9b)' }}>
            <Utensils size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
            <div>No matching foods found in pantry.</div>
          </div>
        ) : (
          filtered.map((food, idx) => (
            <div key={idx} style={{ 
              background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', 
              borderRadius: '20px', 
              padding: '16px', 
              border: selectedFood === food ? '2px solid var(--theme-accent, #00C9FF)' : '1px solid var(--theme-border, rgba(255,255,255,0.05))',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {food.name}
                      <VitalityBadge {...calculateVitalityScore(food)} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)' }}>
                      {food.cal} kcal | P:{food.p}g C:{food.c}g F:{food.f}g
                    </div>
                </div>
                <button 
                  onClick={() => setSelectedFood(selectedFood === food ? null : food)}
                  style={{ background: selectedFood === food ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-panel, rgba(255,255,255,0.05))', color: selectedFood === food ? '#000' : 'var(--theme-text)', border: 'none', borderRadius: '12px', padding: '10px 16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedFood === food ? <ChevronDown size={16} /> : <Plus size={16} />} 
                  {selectedFood === food ? 'Close' : 'Add'}
                </button>
              </div>

              {selectedFood === food && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '4px' }}>Meal</label>
                      <select className="inp" value={meal} onChange={e => setMeal(e.target.value)} style={{ padding: '10px' }}>
                        {MEALS.map(m => <option key={m} value={m} style={{ color: '#000' }}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '4px' }}>Quantity</label>
                      <input type="number" step="0.1" className="inp" value={qty} onChange={e => setQty(e.target.value)} style={{ padding: '10px' }} />
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '4px' }}>Unit</label>
                    <select className="inp" value={unit} onChange={e => setUnit(e.target.value)} style={{ padding: '10px' }}>
                      {COMMON_UNITS.map(u => <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.label}</option>)}
                    </select>
                  </div>

                  <div style={{ background: 'var(--theme-panel, rgba(0,0,0,0.4))', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--theme-border, rgba(255,255,255,0.03))' }}>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '4px' }}>Logging Preview</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--theme-success, #92FE9D)' }}>
                      {previewCals} <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-dim, #8b8b9b)' }}>kcal</span>
                    </div>
                  </div>

                  <button onClick={handleLog} style={{ background: 'var(--theme-success, #92FE9D)', color: '#000', padding: '14px', borderRadius: '14px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Scale size={18} /> Confirm Add to Diary
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};

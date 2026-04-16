import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useDiary } from '../context/DiaryContext';
import { computeMultiplier, scaleLegacyFoodByAmount, COMMON_UNITS } from '../lib/food/serving-converter';
import { Check, X, Scale } from 'lucide-react';

interface PortionEditModalProps {
  meal: string;
  idx: number; // local index within the meal
  originalFood: any;
  onClose: () => void;
}

export const PortionEditModal: React.FC<PortionEditModalProps> = ({ meal, idx, originalFood, onClose }) => {
  const { updateFoodLog } = useDiary();
  
  // We allow adjusting the qty relative to the CURRENT log state.
  // The user interaction for "choosing portions" on an existing log
  // usually means updating the multiplier.
  const [qty, setQty] = useState('1'); 
  const [unit, setUnit] = useState('serving');

  const base = originalFood._base || originalFood;
  const currentMultiplier = computeMultiplier(base.serving || '', unit, parseFloat(qty) || 0);
  const previewCals = Math.round((base.calories || base.cal || 0) * currentMultiplier);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(qty) || 1;
    
    const base = originalFood._base || originalFood;
    // Compute multiplier relative to the *original* base state
    const mult = computeMultiplier(base.serving || '', unit, q);
    const updated = scaleLegacyFoodByAmount(base, mult);
    updated._base = base; // Retain base reference
    
    const unitLabel = COMMON_UNITS.find((u: any) => u.id === unit)?.label || unit;
    updated.serving = `${q} ${unitLabel} (Adjusted)`;
    
    updateFoodLog(meal, idx, updated);
    onClose();
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--theme-panel, #10141f)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '28px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--theme-text, #fff)' }}>
            <Scale size={20} color="var(--theme-accent, #00C9FF)" /> Adjust Portion
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim, #8b8b9b)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.03))', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: 'var(--theme-accent, #00C9FF)' }}>{originalFood.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)' }}>Current: {originalFood.serving}</div>
        </div>

        <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>Quantity</label>
              <input 
                type="number"
                step="0.1"
                className="mm-input"
                value={qty}
                onChange={e => setQty(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>Unit</label>
              <select 
                className="mm-select"
                value={unit}
                onChange={e => setUnit(e.target.value)}
              >
                {COMMON_UNITS.map(u => <option key={u.id} value={u.id} style={{ background: 'var(--theme-panel-base)', color: 'var(--theme-text)' }}>{u.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--theme-accent-dim, rgba(0,201,255,0.05))', borderRadius: '12px', border: '1px solid var(--theme-accent-dim, rgba(0,201,255,0.1))' }}>
            <div style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '4px' }}>Resulting Calories</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--theme-success, #92FE9D)' }}>{previewCals} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>kcal</span></div>
          </div>

          <button type="submit" style={{ width: '100%', padding: '16px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-bg, #000)', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,201,255,0.2)' }}>
            <Check size={18} /> Update Log
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

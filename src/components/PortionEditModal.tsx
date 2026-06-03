import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useDiary } from '../context/DiaryContext';
import { computeMultiplier, scaleLegacyFoodByAmount, getQuantityForUnit } from '../lib/food/serving-converter';
import { Check, X, Scale } from 'lucide-react';

interface PortionEditModalProps {
  meal: string;
  idx: number;
  originalFood: any;
  onClose: () => void;
}

// ── All units the app understands ────────────────────────────────────────────
const ALL_UNITS = [
  { id: 'serving',  label: 'Serving(s)' },
  { id: 'g',        label: 'Grams (g)' },
  { id: 'kg',       label: 'Kilograms (kg)' },
  { id: 'oz',       label: 'Ounces (oz)' },
  { id: 'lb',       label: 'Pounds (lb)' },
  { id: 'cup',      label: 'Cups' },
  { id: 'ml',       label: 'Milliliters (ml)' },
  { id: 'l',        label: 'Liters (l)' },
  { id: 'tbsp',     label: 'Tablespoons (tbsp)' },
  { id: 'tsp',      label: 'Teaspoons (tsp)' },
  { id: 'piece',    label: 'Piece(s)' },
  { id: 'slice',    label: 'Slice(s)' },
  { id: 'whole',    label: 'Whole' },
];

// ── Small units (< ~½ cup / ~120g) ───────────────────────────────────────────
const SMALL_UNITS = ['serving', 'tsp', 'tbsp', 'ml', 'oz', 'cup', 'g'];
// ── Large units (≥ ~½ cup / ~120g) ───────────────────────────────────────────
const LARGE_UNITS = ['serving', 'cup', 'oz', 'g', 'kg', 'lb'];

/**
 * Decide which unit list to show by default based on the food's base serving.
 * Rule: if the base serving is < ½ cup (roughly < 120g or uses tsp/tbsp/ml as unit), 
 * it's "small". Otherwise it's "large".
 */
function inferUnitCategory(food: any): 'small' | 'large' {
  const unit = (food.sUnit || food.unit || food.stagedUnit || '').toLowerCase().trim();
  const qty  = Number(food.sQty || food.qty || food.stagedQty || 1);

  // Explicit small-unit signals
  if (['tsp', 'teaspoon', 'tablespoon', 'tbsp', 'ml', 'milliliter'].includes(unit)) return 'small';
  // A piece/whole that weighs ≤ 30g is also "small"
  if (['piece', 'pieces', 'whole'].includes(unit) && qty <= 30) return 'small';

  // Try the serving string for a weight clue
  const servingStr = (food.serving || '').toLowerCase();
  const weightMatch = servingStr.match(/(\d+(?:\.\d+)?)\s*(g|ml)/);
  if (weightMatch) {
    const grams = parseFloat(weightMatch[1]);
    if (grams < 120) return 'small';
  }

  // If the unit itself is cup and qty < 0.5 → small
  if (unit === 'cup' && qty < 0.5) return 'small';

  return 'large';
}

function getDefaultUnits(food: any): string[] {
  const cat = inferUnitCategory(food);
  return cat === 'small' ? SMALL_UNITS : LARGE_UNITS;
}

const NUTRI_COLOR: Record<string,string> = {
  a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11'
};

export const PortionEditModal: React.FC<PortionEditModalProps> = ({ meal, idx, originalFood, onClose }) => {
  const { updateFoodLog } = useDiary();

  const base = originalFood._base || originalFood;
  const defaultUnits = useMemo(() => getDefaultUnits(base), [base]);

  const [qty,         setQty]         = useState('1');
  const [unit,        setUnit]        = useState('serving'); // always start on Serving(s)
  const [showAll,     setShowAll]     = useState(false);

  const activeUnits = showAll ? ALL_UNITS : ALL_UNITS.filter(u => defaultUnits.includes(u.id));

  const currentMultiplier = computeMultiplier(base.serving || '', unit, parseFloat(qty) || 0);
  const previewCals       = Math.round((base.calories || base.cal || 0) * currentMultiplier);

  const handleUnitChange = (newUnit: string) => {
    if (newUnit === '__other__') {
      setShowAll(true);
      return;
    }
    const currentMult   = computeMultiplier(base.serving || '', unit, parseFloat(qty) || 0);
    const newQtyVal     = getQuantityForUnit(base.serving || '', currentMult, newUnit);
    const roundedQty    = Math.round(newQtyVal * 100) / 100;
    setQty(roundedQty.toString());
    setUnit(newUnit);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const q    = parseFloat(qty) || 1;
    const mult = computeMultiplier(base.serving || '', unit, q);
    const updated = scaleLegacyFoodByAmount(base, mult);
    updated._base = base;
    const unitLabel = ALL_UNITS.find(u => u.id === unit)?.label || unit;
    updated.serving = `${q} ${unitLabel} (Adjusted)`;
    updateFoodLog(meal, idx, updated);
    onClose();
  };

  const grade = base.nutriscore_grade ? String(base.nutriscore_grade).toLowerCase().trim() : null;
  const nsColor = grade ? (NUTRI_COLOR[grade] || '#888') : null;

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="portion-edit-modal" style={{ background: 'var(--theme-panel, #10141f)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '28px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--theme-text, #fff)' }}>
            <Scale size={20} color="var(--theme-accent, #00C9FF)" /> Adjust Portion
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim, #8b8b9b)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* Food info + Nutri-Score */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.03))', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: 'var(--theme-accent, #00C9FF)' }}>{originalFood.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)' }}>Current: {originalFood.serving}</div>
            </div>
            {grade && nsColor && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '8px 12px', borderRadius: '12px',
                background: `${nsColor}18`, border: `1px solid ${nsColor}55`,
                boxShadow: `0 0 12px ${nsColor}30`,
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.45)', letterSpacing: '1px' }}>NUTRI-SCORE</span>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: nsColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '900', color: '#000',
                  boxShadow: `0 0 14px ${nsColor}80`,
                }}>
                  {grade.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Qty + Unit */}
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
              <label style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', display: 'block', marginBottom: '6px' }}>
                Unit
                {!showAll && (
                  <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--theme-accent, #00C9FF)', fontWeight: '600', opacity: 0.7 }}>
                    (smart)
                  </span>
                )}
              </label>
              <select
                className="mm-select"
                value={unit}
                onChange={e => handleUnitChange(e.target.value)}
              >
                {activeUnits.map(u => (
                  <option key={u.id} value={u.id} style={{ background: 'var(--theme-panel-base)', color: 'var(--theme-text)' }}>
                    {u.label}
                  </option>
                ))}
                {!showAll && (
                  <option value="__other__" style={{ background: 'var(--theme-panel-base)', color: 'var(--theme-accent)' }}>
                    ＋ Other…
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="portion-result-box" style={{ textAlign: 'center', padding: '16px', background: 'var(--theme-accent-dim, rgba(0,201,255,0.05))', borderRadius: '12px', border: '1px solid var(--theme-accent-dim, rgba(0,201,255,0.1))' }}>
            <div style={{ fontSize: '12px', color: 'var(--theme-text, #8b8b9b)', opacity: 0.7, marginBottom: '4px', fontWeight: '600' }}>Resulting Calories</div>
            <div className="portion-result-value" style={{ fontSize: '24px', fontWeight: '800' }}>{previewCals} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>kcal</span></div>
          </div>

          <button type="submit" style={{ width: '100%', padding: '16px', background: 'var(--theme-accent, #00C9FF)', color: '#000000', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,201,255,0.2)' }}>
            <Check size={18} /> Update Log
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

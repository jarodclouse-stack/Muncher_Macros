import React from 'react';
import ReactDOM from 'react-dom';
import { X, Info } from 'lucide-react';
import { estimateNutriScore } from '../lib/food/serving-converter';

// Nutri-Score colours
export const NS_COLOR: Record<string, string> = { 
  a: '#038141', 
  b: '#85bb2f', 
  c: '#fecb02', 
  d: '#ee8100', 
  e: '#e63e11' 
};

// Derive traffic-light level from a per-100g value using UK FSA thresholds
function deriveLevel(nutrient: 'fat'|'sat'|'sugars'|'salt', per100g: number): 'low'|'moderate'|'high' {
  if (nutrient === 'fat')    return per100g < 3    ? 'low' : per100g <= 17.5 ? 'moderate' : 'high';
  if (nutrient === 'sat')    return per100g < 1.5  ? 'low' : per100g <= 5    ? 'moderate' : 'high';
  if (nutrient === 'sugars') return per100g < 5    ? 'low' : per100g <= 12.5 ? 'moderate' : 'high';
  /* salt */                 return per100g < 0.3  ? 'low' : per100g <= 1.5  ? 'moderate' : 'high';
}

const LEVEL_COLOR = { low: '#038141', moderate: '#ee8100', high: '#e63e11' };
const LEVEL_BG    = { low: 'rgba(3,129,65,0.15)', moderate: 'rgba(238,129,0,0.15)', high: 'rgba(230,62,17,0.15)' };

const NS_GRADE_DESC: Record<string, string> = {
  a: 'Excellent nutritional quality. Very low in saturated fat, sugars, and salt. High in beneficial nutrients.',
  b: 'Good nutritional quality. Mostly well-balanced macros with limited levels of unfavorable nutrients.',
  c: 'Average nutritional quality. Moderate levels of fat, sugars, or salt — consume in reasonable portions.',
  d: 'Poor nutritional quality. Relatively high in saturated fat, sugars, or salt. Best enjoyed occasionally.',
  e: 'Very poor nutritional quality. High in saturated fat, sugars, and/or salt. Limit consumption.',
};

interface NutriScorePopupProps {
  food: any;
  onClose: () => void;
}

export const NutriScorePopup: React.FC<NutriScorePopupProps> = ({ food, onClose }) => {
  const [showExplain, setShowExplain] = React.useState(false);
  const { grade: g, estimated } = estimateNutriScore(food);
  if (!g) return null;
  const bg = NS_COLOR[g] || '#888';

  // Build traffic-light rows — prefer stored nutrient_levels, fallback to derivation
  const nl = food.nutrient_levels || {};
  const sQty = Number(food.sQty ?? food.stagedQty ?? 1) || 1;
  const sUnit = String(food.sUnit ?? food.stagedUnit ?? 'g').toLowerCase();
  let grams = 100;
  if (sUnit === 'g' || sUnit === 'ml') grams = sQty;
  else if (sUnit === 'oz') grams = sQty * 28.3495;
  else if (sUnit === 'lb') grams = sQty * 453.592;
  else if (sUnit === 'kg') grams = sQty * 1000;
  const sc = grams > 0 ? 100 / grams : 1;

  const fatLevel    = nl.fat             || deriveLevel('fat',    Number(food.f   ?? 0) * sc);
  const satLevel    = nl['saturated-fat'] || deriveLevel('sat',    Number(food.sat ?? 0) * sc);
  const sugarLevel  = nl.sugars          || deriveLevel('sugars', Number(food.sugars ?? 0) * sc);
  // salt = sodium mg × 2.5 / 1000 = sodium g × 0.0025
  const saltPer100g = (Number(food.Sodium ?? food.sodium ?? 0) * sc) * 0.0025;
  const saltLevel   = nl.salt            || deriveLevel('salt', saltPer100g);

  const rows = [
    { label: 'Fat',           level: fatLevel   as 'low'|'moderate'|'high', value: `${(Number(food.f ?? 0) * sc).toFixed(1)}g / 100g` },
    { label: 'Saturated Fat', level: satLevel   as 'low'|'moderate'|'high', value: `${(Number(food.sat ?? 0) * sc).toFixed(1)}g / 100g` },
    { label: 'Sugars',        level: sugarLevel as 'low'|'moderate'|'high', value: `${(Number(food.sugars ?? 0) * sc).toFixed(1)}g / 100g` },
    { label: 'Salt (Sodium)', level: saltLevel  as 'low'|'moderate'|'high', value: `${(Number(food.Sodium ?? food.sodium ?? 0) * sc).toFixed(0)}mg / 100g` },
  ];

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#0d1a1f', border: `1px solid ${bg}55`, borderRadius: '24px', width: '100%', maxWidth: '360px', padding: '28px 24px', boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${bg}20` }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Nutri-Score{estimated ? ' (estimated)' : ''}</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', lineHeight: '1.3' }}>{food.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Grade display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: `${bg}14`, borderRadius: '16px', border: `1px solid ${bg}40` }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '900', color: '#000', boxShadow: `0 0 20px ${bg}80`, flexShrink: 0 }}>
            {g.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: bg, fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Grade {g.toUpperCase()}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>{NS_GRADE_DESC[g]}</div>
          </div>
        </div>

        {/* A–E scale bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {['a','b','c','d','e'].map(grade => (
            <div key={grade} style={{ flex: 1, height: '32px', borderRadius: '8px', background: grade === g ? NS_COLOR[grade] : `${NS_COLOR[grade]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900', color: grade === g ? '#000' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s', boxShadow: grade === g ? `0 0 12px ${NS_COLOR[grade]}80` : 'none' }}>
              {grade.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Nutrient traffic lights */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>Nutrient Levels (per 100g)</div>
          <button 
            type="button"
            onClick={() => setShowExplain(!showExplain)}
            style={{
              background: 'none',
              border: 'none',
              color: showExplain ? 'var(--theme-accent, #00C9FF)' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              borderRadius: '4px',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            title="Why per 100g?"
          >
            <Info size={14} />
          </button>
        </div>

        {showExplain && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '12px',
            fontSize: '11px',
            lineHeight: '1.4',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <div style={{ fontWeight: '800', color: 'var(--theme-accent, #00C9FF)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              💡 Why per 100g?
            </div>
            Nutri-Score grades are calculated per 100g so different foods can be compared fairly side-by-side. If grades were based on serving sizes, unhealthy foods could claim a healthy rating by just declaring a tiny "1 gram" serving size.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rows.map(({ label, level, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', background: LEVEL_BG[level], border: `1px solid ${LEVEL_COLOR[level]}30` }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: LEVEL_COLOR[level], flexShrink: 0, boxShadow: `0 0 6px ${LEVEL_COLOR[level]}` }} />
              <div style={{ flex: 1, fontSize: '13px', fontWeight: '700', color: '#fff' }}>{label}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{value}</div>
              <div style={{ fontSize: '11px', fontWeight: '900', color: LEVEL_COLOR[level], textTransform: 'uppercase', letterSpacing: '0.5px' }}>{level}</div>
            </div>
          ))}
        </div>

        {estimated && (
          <div style={{ marginTop: '16px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: '1.4' }}>
            ~ Score estimated from macro data · Search via Open Food Facts for an official rating
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

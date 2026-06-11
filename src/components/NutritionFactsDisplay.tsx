import React from 'react';
import { ALL_MICRO_KEYS, MICRO_UNITS } from '../lib/constants';
import { getCal } from '../lib/food/serving-converter';

interface NutritionFactsDisplayProps {
  food: any;
  multiplier: number;
  onEdit?: (key: string, value: number) => void;
  /** When true, hides sub-nutrient rows (sugars, soluble/insoluble fiber).
   *  Edit mode always shows all rows regardless of this flag. */
  hideSubNutrients?: boolean;
}

/**
 * A shared, comprehensive "Nutrition Facts" panel.
 * Supports an 'Editable' mode for the Staging Tray.
 */
export const NutritionFactsDisplay: React.FC<NutritionFactsDisplayProps> = ({ food, multiplier, onEdit, hideSubNutrients = false }) => {
  const f = food || {};
  
  const renderRow = (label: string, key: string, unit: string = 'g', isMacro: boolean = false, isSubRow: boolean = false) => {
    const rawVal = key === 'cal' ? getCal(f) : (Number(f[key]) || 0);
    const displayVal = Math.round(rawVal * multiplier * 10) / 10;

    return (
      <div 
        key={key} 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '6px 0', 
          paddingLeft: isSubRow ? '16px' : '0',
          borderBottom: '1px solid var(--theme-border-dim, rgba(255,255,255,0.05))' 
        }}
      >
        <span className="micro-bubble" style={{ 
          fontSize: '10px', 
          fontWeight: isSubRow ? '600' : '900', 
          color: isSubRow ? 'var(--theme-text-dim, rgba(255,255,255,0.6))' : 'var(--theme-accent)',
          background: isSubRow ? 'transparent' : 'var(--theme-panel)',
          padding: isSubRow ? '3px 0' : '3px 10px',
          borderRadius: isSubRow ? '0' : '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          border: isSubRow ? 'none' : '1px solid var(--theme-border)',
          boxShadow: isSubRow ? 'none' : '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {isSubRow ? `↳ ${label}` : label}
        </span>

        
        {onEdit ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input 
              className="inp micro-input"
              type="number"
              step="any"
              value={rawVal}
              onChange={(e) => onEdit(key, parseFloat(e.target.value) || 0)}
              style={{ 
                width: '70px', 
                background: 'var(--theme-input-bg)', 
                border: '1px solid var(--theme-border)', 
                borderRadius: '8px', 
                color: 'var(--theme-accent)', 
                fontSize: '13px', 
                fontWeight: '900', 
                padding: '6px 8px', 
                textAlign: 'right',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--theme-text-dim)', fontWeight: '800' }}>{unit}</span>
          </div>
        ) : (
          <span style={{ fontSize: '13px', fontWeight: '900', color: isMacro ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
            {displayVal}<span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '2px', fontWeight: '600' }}>{unit}</span>
          </span>
        )}
      </div>
    );
  };

  const levels = f.nutrient_levels || null;

  return (
    <div className="nutrition-facts-display" style={{ display: 'flex', flexDirection: 'column', background: 'var(--theme-panel-dim)', padding: '20px', borderRadius: '24px', border: '1px solid var(--theme-border)' }}>
      <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--theme-accent)', marginBottom: '16px', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center' }}>
        {onEdit ? 'EDIT SCAN DATA (TOTAL CONTROL)' : 'Nutrition Intelligence Profile'}
      </div>


      {/* Nutrient Levels Section */}
      {levels && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '18px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--theme-text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>
            Nutrient Levels
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', lineHeight: '1.4', marginBottom: '6px', fontWeight: '500' }}>
            The percentage shows how much of the food's weight is made of that nutrient. For example, 10% Fat means if you split the food into 10 equal bites, 1 whole bite is pure fat!
          </div>
          
          {([
            { key: 'fat', label: 'Fat', valueKey: 'f', unit: 'g', isSalt: false },
            { key: 'saturated-fat', label: 'Saturated fat', valueKey: 'sat', unit: 'g', isSalt: false },
            { key: 'sugars', label: 'Sugars', valueKey: 'sugars', unit: 'g', isSalt: false },
            { key: 'salt', label: 'Salt', valueKey: 'Sodium', unit: 'mg', isSalt: true }
          ] as const).map(({ key, label, valueKey, unit, isSalt }) => {
            const rawLevel = levels[key] || levels[key.replace('-', '')] || levels[key === 'saturated-fat' ? 'saturatedFat' : ''];
            if (!rawLevel) return null;

            const lvl = String(rawLevel).toLowerCase().trim();
            const color = lvl === 'low' ? '#00E676' : lvl === 'moderate' ? '#FFD600' : '#FF1744';
            
            // Get actual quantity
            const rawVal = Number(f[valueKey]) || 0;
            const displayVal = Math.round(rawVal * multiplier * 10) / 10;
            const quantityText = isSalt 
              ? `${displayVal}mg sodium`
              : `${displayVal}${unit}`;

            const pctVal = f.nutrient_percentages 
              ? (f.nutrient_percentages[key] ?? f.nutrient_percentages[key.replace('-', '')] ?? f.nutrient_percentages[key === 'saturated-fat' ? 'saturatedFat' : '']) 
              : undefined;

            const pctText = pctVal !== undefined && pctVal !== null ? `${pctVal}%` : quantityText;

            return (
              <div 
                key={key} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--theme-text)' }}>
                    {label} in {lvl} quantity
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: color }}>
                  ({pctText})
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Macros */}
      {renderRow('Calories', 'cal', ' kcal', true)}
      {renderRow('Protein', 'p', 'g', true)}
      {renderRow('Carbs', 'c', 'g', true)}
      {/* Sub-nutrient: only show sugars when editing or hideSubNutrients is false */}
      {(!hideSubNutrients || onEdit) && renderRow('Sugars', 'sugars', 'g', false, true)}
      {renderRow('Fat', 'f', 'g', true)}

      {/* Additional Macros — hidden in compact (scan result) view */}
      {(!hideSubNutrients || onEdit) && (
        <>
          {renderRow('Fiber', 'fb', 'g')}
          {renderRow('Soluble Fiber', 'solubleFiber', 'g', false, true)}
          {renderRow('Insoluble Fiber', 'insolubleFiber', 'g', false, true)}
          {renderRow('Sat Fat', 'sat', 'g')}
          {renderRow('Sodium', 'Sodium', 'mg')}
          {renderRow('Potassium', 'Potassium', 'mg')}
          {/* Dynamic Micros from Constants */}
          {ALL_MICRO_KEYS.filter(k => !['Sodium', 'Potassium', 'Fiber', 'Soluble Fiber', 'Insoluble Fiber'].includes(k)).map(k => (
            renderRow(k, k, MICRO_UNITS[k] || 'mg')
          ))}
        </>
      )}
    </div>
  );
};

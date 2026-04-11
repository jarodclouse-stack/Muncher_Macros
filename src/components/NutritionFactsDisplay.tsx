import React from 'react';
import { ALL_MICRO_KEYS, MICRO_UNITS } from '../lib/constants';

interface NutritionFactsDisplayProps {
  food: any;
  multiplier: number;
  onEdit?: (key: string, value: number) => void;
}

/**
 * A shared, comprehensive "Nutrition Facts" panel.
 * Supports an 'Editable' mode for the Staging Tray.
 */
export const NutritionFactsDisplay: React.FC<NutritionFactsDisplayProps> = ({ food, multiplier, onEdit }) => {
  const f = food || {};
  
  const renderRow = (label: string, key: string, unit: string = 'g', isMacro: boolean = false) => {
    const rawVal = Number(f[key]) || 0;
    const displayVal = Math.round(rawVal * multiplier * 10) / 10;

    return (
      <div 
        key={key} 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '8px 0', 
          borderBottom: '1px solid rgba(255,255,255,0.05)' 
        }}
      >
        <span style={{ 
          fontSize: '11px', 
          fontWeight: isMacro ? '800' : '600', 
          color: isMacro ? '#fff' : 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </span>
        
        {onEdit ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input 
              type="number"
              step="any"
              value={rawVal}
              onChange={(e) => onEdit(key, parseFloat(e.target.value) || 0)}
              style={{ 
                width: '60px', 
                background: 'rgba(255,255,255,0.08)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '6px', 
                color: 'var(--theme-accent)', 
                fontSize: '12px', 
                fontWeight: '800', 
                padding: '4px 6px', 
                textAlign: 'right',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{unit}</span>
          </div>
        ) : (
          <span style={{ fontSize: '12px', fontWeight: '800', color: isMacro ? 'var(--theme-accent)' : '#fff' }}>
            {displayVal}{unit}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--theme-accent)', marginBottom: '8px', letterSpacing: '1px' }}>
        {onEdit ? 'EDIT SCAN DATA (TOTAL CONTROL)' : 'NUTRITION INTELLIGENCE'}
      </div>
      
      {/* Macros */}
      {renderRow('Calories', 'cal', ' kcal', true)}
      {renderRow('Protein', 'p', 'g', true)}
      {renderRow('Carbs', 'c', 'g', true)}
      {renderRow('Fat', 'f', 'g', true)}
      
      {/* Additional Macros */}
      {renderRow('Fiber', 'fb', 'g')}
      {renderRow('Sugars', 'sugars', 'g')}
      {renderRow('Sat Fat', 'sat', 'g')}
      {renderRow('Sodium', 'Sodium', 'mg')}
      {renderRow('Potassium', 'Potassium', 'mg')}
      
      {/* Dynamic Micros from Constants */}
      {ALL_MICRO_KEYS.filter(k => !['Sodium', 'Potassium', 'Fiber'].includes(k)).map(k => (
        renderRow(k, k, MICRO_UNITS[k] || 'mg')
      ))}
    </div>
  );
};

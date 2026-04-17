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
          padding: '10px 0', 
          borderBottom: '1px solid var(--theme-border-dim, rgba(255,255,255,0.05))' 
        }}
      >
        <span style={{ 
          fontSize: '11px', 
          fontWeight: '900', 
          color: 'var(--theme-accent)',
          background: 'var(--theme-panel)',
          padding: '4px 12px',
          borderRadius: '20px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          border: '1px solid var(--theme-border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {label}
        </span>
        
        {onEdit ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input 
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--theme-panel-dim)', padding: '20px', borderRadius: '24px', border: '1px solid var(--theme-border)' }}>
      <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--theme-accent)', marginBottom: '16px', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center' }}>
        {onEdit ? 'EDIT SCAN DATA (TOTAL CONTROL)' : 'Nutrition Intelligence Profile'}
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

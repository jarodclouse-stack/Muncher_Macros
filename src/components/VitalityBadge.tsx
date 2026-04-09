import React from 'react';

interface VitalityBadgeProps {
  score: number;
  label: string;
  color: string;
}

export const VitalityBadge: React.FC<VitalityBadgeProps> = ({ score, label, color }) => {
  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      padding: '2px 8px', 
      borderRadius: '6px', 
      background: `${color}15`, 
      border: `1px solid ${color}30`,
      color: color,
      fontSize: '10px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {label} ({score})
    </div>
  );
};

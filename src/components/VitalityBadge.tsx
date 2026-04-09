import React from 'react';
import { Activity } from 'lucide-react';

interface VitalityBadgeProps {
  score: number;
  label: string;
  color: string;
  alwaysShow?: boolean;
}

export const VitalityBadge: React.FC<VitalityBadgeProps> = ({ score, label, color, alwaysShow }) => {
  // Hide intermediate load labels from per-food displays as requested
  if (!alwaysShow && (label === 'Functional' || label === 'Metabolic Load')) {
    return null;
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px', 
      background: `color-mix(in srgb, ${color}, transparent 85%)`, 
      padding: '4px 8px', 
      borderRadius: '6px', 
      border: `1px solid color-mix(in srgb, ${color}, transparent 70%)` 
    }}>
      <Activity size={10} color={color} />
      <span style={{ fontSize: '9px', fontWeight: '800', color: color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label} {score}
      </span>
    </div>
  );
};

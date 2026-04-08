import React from 'react';
import { Activity } from 'lucide-react';

interface VitalityBadgeProps {
  score: number;
  label: string;
  color: string;
}

export const VitalityBadge: React.FC<VitalityBadgeProps> = ({ score, label, color }) => (
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

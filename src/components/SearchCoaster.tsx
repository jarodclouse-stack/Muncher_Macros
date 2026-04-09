import React from 'react';
import { Search, Camera, FileText, Sparkles, Plus, Scan } from 'lucide-react';

export type SearchTab = 'search' | 'ai-search' | 'describe' | 'barcode' | 'label' | 'pantry';

interface SearchCoasterProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
  style?: React.CSSProperties;
}

export const SearchCoaster: React.FC<SearchCoasterProps> = ({ activeTab, onTabChange, style }) => {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '8px', 
          padding: '4px 0 12px 0', 
          ...style 
        }}>
        <TabBtn active={activeTab==='search'} onClick={() => onTabChange('search')} icon={<Search size={14}/>} label="Search" isPrimary />
        <TabBtn active={activeTab==='pantry'} onClick={() => onTabChange('pantry')} icon={<Plus size={14}/>} label="Pantry" isPrimary />
        <TabBtn active={activeTab==='ai-search'} onClick={() => onTabChange('ai-search')} icon={<Sparkles size={14}/>} label="AI Search" />
        <TabBtn active={activeTab==='describe'} onClick={() => onTabChange('describe')} icon={<FileText size={14}/>} label="Describe" />
        <TabBtn active={activeTab==='barcode'} onClick={() => onTabChange('barcode')} icon={<Scan size={14}/>} label="Barcode" />
        <TabBtn active={activeTab==='label'} onClick={() => onTabChange('label')} icon={<Camera size={14}/>} label="Label" />
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label, isPrimary }: any) => (
  <button onClick={onClick} style={{ 
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center',
    padding: '12px 4px', borderRadius: '16px', 
    background: active ? 'var(--theme-accent-dim, rgba(0,201,255,0.15))' : (isPrimary ? 'rgba(255,255,255,0.06)' : 'transparent'), 
    color: active ? 'var(--theme-accent, #00C9FF)' : (isPrimary ? '#fff' : 'var(--theme-text-dim, #8b8b9b)'), 
    border: `1px solid ${active ? 'var(--theme-accent, rgba(0,201,255,0.3))' : (isPrimary ? 'rgba(255,255,255,0.15)' : 'var(--theme-border, rgba(255,255,255,0.05))')}`,
    fontWeight: (active || isPrimary) ? '700' : '400', cursor: 'pointer', transition: 'all 0.2s',
    fontSize: '11px', width: '100%', minWidth: 0,
    boxShadow: (isPrimary && !active) ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
  }}>
    <div style={{ opacity: active ? 1 : 0.8 }}>{icon}</div>
    <span style={{ 
      whiteSpace: 'nowrap', 
      overflow: 'hidden', 
      textOverflow: 'ellipsis', 
      width: '100%',
      letterSpacing: '0.2px'
    }}>{label}</span>
  </button>
);

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
    <div style={{ 
      display: 'flex', 
      overflowX: 'auto', 
      gap: '8px', 
      paddingBottom: '12px', 
      msOverflowStyle: 'none', 
      scrollbarWidth: 'none',
      ...style 
    }}>
      <TabBtn active={activeTab==='search'} onClick={() => onTabChange('search')} icon={<Search size={14}/>} label="Search" />
      <TabBtn active={activeTab==='pantry'} onClick={() => onTabChange('pantry')} icon={<Plus size={14}/>} label="Pantry" />
      <TabBtn active={activeTab==='ai-search'} onClick={() => onTabChange('ai-search')} icon={<Sparkles size={14}/>} label="AI Search" />
      <TabBtn active={activeTab==='describe'} onClick={() => onTabChange('describe')} icon={<FileText size={14}/>} label="Describe Meal" />
      <TabBtn active={activeTab==='barcode'} onClick={() => onTabChange('barcode')} icon={<Scan size={14}/>} label="Barcode" />
      <TabBtn active={activeTab==='label'} onClick={() => onTabChange('label')} icon={<Camera size={14}/>} label="Label Scan" />
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} style={{ 
    display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
    padding: '8px 12px', borderRadius: '20px', 
    background: active ? 'var(--theme-accent-dim, rgba(0,201,255,0.15))' : 'transparent', 
    color: active ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #8b8b9b)', 
    border: `1px solid ${active ? 'var(--theme-accent, rgba(0,201,255,0.3))' : 'var(--theme-border, rgba(255,255,255,0.1))'}`,
    fontWeight: active ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s',
    fontSize: '13px'
  }}>
    {icon} {label}
  </button>
);

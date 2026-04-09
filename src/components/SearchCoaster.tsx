import React from 'react';
import { Search, Sparkles, FileText, Scan } from 'lucide-react';

export type SearchTab = 'search' | 'ai-search' | 'describe' | 'scan';

interface SearchCoasterProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
  style?: React.CSSProperties;
}

export const SearchCoaster: React.FC<SearchCoasterProps> = ({ activeTab, onTabChange, style }) => {
  return (
    <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      <div className="actions-grid" style={{ padding: 'var(--space-xs) 0 var(--space-md) 0', ...style }}>
        <TabBtn active={activeTab==='search'} onClick={() => onTabChange('search')} icon={<Search size={18}/>} label="Search" isPrimary />
        <TabBtn active={activeTab==='ai-search'} onClick={() => onTabChange('ai-search')} icon={<Sparkles size={18}/>} label="AI Search" />
        <TabBtn active={activeTab==='describe'} onClick={() => onTabChange('describe')} icon={<FileText size={18}/>} label="Describe Meal" />
        <TabBtn active={activeTab==='scan'} onClick={() => onTabChange('scan')} icon={<Scan size={18}/>} label="Scan Code/Label" />
      </div>
    </div>
  );
};

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isPrimary?: boolean;
}

const TabBtn = ({ active, onClick, icon, label, isPrimary }: TabBtnProps) => (
  <button onClick={onClick} style={{ 
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center',
    padding: '10px 8px', borderRadius: '16px', 
    background: active ? 'var(--theme-accent-dim, rgba(0,201,255,0.15))' : (isPrimary ? 'rgba(255,255,255,0.06)' : 'transparent'), 
    color: active ? 'var(--theme-accent, #00C9FF)' : (isPrimary ? '#fff' : 'var(--theme-text-dim, #8b8b9b)'), 
    border: `1px solid ${active ? 'var(--theme-accent, rgba(0,201,255,0.3))' : (isPrimary ? 'rgba(255,255,255,0.15)' : 'var(--theme-border, rgba(255,255,255,0.05))')}`,
    fontWeight: (active || isPrimary) ? '700' : '400', cursor: 'pointer', transition: 'all 0.2s',
    fontSize: '10px', width: '100%', minWidth: 0,
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

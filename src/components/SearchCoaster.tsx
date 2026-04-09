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
      <div className="actions-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        padding: '12px 0 24px 0', 
        ...style 
      }}>
        <TabBtn active={activeTab==='describe'} onClick={() => onTabChange('describe')} icon={<FileText size={20}/>} label="Describe Meal" />
        <TabBtn active={activeTab==='ai-search'} onClick={() => onTabChange('ai-search')} icon={<Sparkles size={20}/>} label="AI Search" />
        <TabBtn active={activeTab==='scan'} onClick={() => onTabChange('scan')} icon={<Scan size={20}/>} label="Scan Label/Code/QR" />
        <TabBtn active={activeTab==='search'} onClick={() => onTabChange('search')} icon={<Search size={22}/>} label="Search" isSearch />
      </div>
    </div>
  );
};

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isSearch?: boolean;
}

const TabBtn = ({ active, onClick, icon, label, isSearch }: TabBtnProps) => (
  <button onClick={onClick} style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: '12px', 
    textAlign: 'center',
    padding: '24px 12px', 
    borderRadius: '32px', 
    background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', 
    color: isSearch ? 'var(--theme-accent, #00C9FF)' : '#fff', 
    border: `1px solid ${isSearch ? 'var(--theme-accent, #00C9FF)' : (active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)')}`,
    fontWeight: '800', 
    cursor: 'pointer', 
    transition: 'all 0.2s',
    fontSize: '11px', 
    width: '100%', 
    minWidth: 0,
    boxShadow: isSearch ? '0 0 20px rgba(0, 201, 255, 0.1)' : 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }}>
    <div style={{ opacity: active || isSearch ? 1 : 0.8 }}>{icon}</div>
    <span style={{ 
      fontWeight: '900',
      fontSize: '10px'
    }}>{label}</span>
  </button>
);

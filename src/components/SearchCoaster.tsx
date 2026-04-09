import React from 'react';
import { Search, Sparkles, Check } from 'lucide-react';

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
        <TabBtn 
        active={activeTab === 'search'} 
        onClick={() => onTabChange('search')} 
        icon={<Search size={18} />} 
        label="Search" 
      />
      <TabBtn 
        active={activeTab === 'describe'} 
        onClick={() => onTabChange('describe')} 
        icon={<Sparkles size={18} />} 
        label="Describe" 
      />
      <TabBtn 
        active={activeTab === 'ai-search'} 
        onClick={() => onTabChange('ai-search')} 
        icon={<Search size={18} />} 
        label="AI Search" 
      />
      <TabBtn 
        active={activeTab === 'scan'} 
        onClick={() => onTabChange('scan')} 
        icon={<Check size={18} />} 
        label="Scan" 
      />
      </div>
    </div>
  );
};

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabBtn: React.FC<TabBtnProps> = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '10px 0',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: '1px solid var(--theme-accent, #00C9FF)',
        borderRadius: '16px',
        color: active ? 'var(--theme-accent, #00C9FF)' : '#fff',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 0 15px rgba(0, 201, 255, 0.25)' : 'none',
        opacity: active ? 1 : 0.7
      }}
    >
      <div style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>
        {icon}
      </div>
      <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </button>
  );
};

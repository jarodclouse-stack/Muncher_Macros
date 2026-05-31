import React from 'react';
import { Search, Sparkles, Barcode, FileText } from 'lucide-react';

export type SearchTab = 'search' | 'ai-search' | 'describe' | 'scan';

interface SearchCoasterProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
  style?: React.CSSProperties;
}

export const SearchCoaster: React.FC<SearchCoasterProps> = ({ activeTab, onTabChange, style }) => {
  return (
    <div style={{ 
      display: 'flex', 
      background: 'var(--theme-panel-dim, rgba(18, 21, 32, 0.4))', 
      padding: '4px', 
      borderRadius: '999px', 
      border: '1px solid var(--theme-border)',
      width: '100%',
      boxSizing: 'border-box',
      margin: '0 0 16px 0',
      position: 'relative',
      zIndex: 1,
      flexShrink: 0,
      gap: '2px',
      ...style
    }}>
      <TabBtn 
        active={activeTab === 'search'} 
        onClick={() => onTabChange('search')} 
        icon={<Search size={13} />} 
        label="Search" 
      />
      <TabBtn 
        active={activeTab === 'ai-search'} 
        onClick={() => onTabChange('ai-search')} 
        icon={<Sparkles size={13} />} 
        label="Ask AI" 
      />
      <TabBtn 
        active={activeTab === 'describe'} 
        onClick={() => onTabChange('describe')} 
        icon={<FileText size={13} />} 
        label="Describe" 
      />
      <TabBtn 
        active={activeTab === 'scan'} 
        onClick={() => onTabChange('scan')} 
        icon={(
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <Barcode size={11} />
            <FileText size={11} />
          </div>
        )} 
        label="Scan" 
      />
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
      className={`search-coaster-tab-btn ${active ? 'active' : ''}`}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '8px 4px',
        borderRadius: '999px',
        cursor: 'pointer',
        border: 'none',
        background: active ? 'var(--theme-accent)' : 'transparent',
        color: active ? '#000' : 'var(--theme-text-dim-on-panel, #BDC4C6)',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        fontSize: '11px',
        fontWeight: '800',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        whiteSpace: 'nowrap'
      }}
    >
      <div className="coaster-icon-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: active ? 1 : 0.8 }}>
        {icon}
      </div>
      <span className="coaster-label" style={{ fontWeight: '800' }}>
        {label}
      </span>
    </button>
  );
};

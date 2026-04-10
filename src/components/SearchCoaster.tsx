import React from 'react';
import { Search, Sparkles, FileText, Barcode, QrCode } from 'lucide-react';

export type SearchTab = 'search' | 'ai-search' | 'describe' | 'scan';

interface SearchCoasterProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
  style?: React.CSSProperties;
}

export const SearchCoaster: React.FC<SearchCoasterProps> = ({ activeTab, onTabChange, style }) => {
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      boxSizing: 'border-box',
      padding: '8px 16px 24px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.05)',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      margin: '0 0 16px 0'
    }}>
      <div className="actions-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        ...style 
      }}>
        <TabBtn 
          active={activeTab === 'describe'} 
          onClick={() => onTabChange('describe')} 
          icon={<Sparkles size={18} />} 
          label="Describe Meal" 
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
          icon={(
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <FileText size={14} />
              <Barcode size={14} />
              <QrCode size={14} />
            </div>
          )} 
          label="SCAN" 
        />
        <TabBtn 
          active={activeTab === 'search'} 
          onClick={() => onTabChange('search')} 
          icon={<Search size={18} />} 
          label="General Search" 
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
        background: active ? 'rgba(0, 201, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
        border: '1px solid',
        borderColor: active ? 'var(--theme-accent, #00C9FF)' : 'rgba(255,255,255,0.08)',
        borderRadius: '18px',
        color: active ? 'var(--theme-accent, #00C9FF)' : 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active 
          ? '0 0 20px var(--theme-accent-dim, rgba(0, 201, 255, 0.2))' 
          : 'none',
        opacity: 1
      }}
    >
      <div style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s', filter: active ? 'drop-shadow(0 0 8px var(--theme-accent))' : 'none' }}>
        {icon}
      </div>
      <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? 'var(--theme-accent)' : '#fff' }}>
        {label}
      </span>
    </button>
  );
};

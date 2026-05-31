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
      position: 'relative', 
      width: '100%', 
      boxSizing: 'border-box',
      padding: '16px',
      background: 'var(--theme-panel, rgba(18, 21, 32, 0.8))',
      borderRadius: '24px',
      border: '1.5px solid var(--theme-border, rgba(255, 255, 255, 0.08))',
      backdropFilter: 'blur(18px)',
      boxShadow: 'var(--theme-shadow, 0 15px 45px rgba(0,0,0,0.3))',
      margin: '0 0 16px 0',
      overflow: 'hidden', // Contain the heartbeat
      flexShrink: 0
    }}>
      {/* Secret Heartbeat Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '120px',
        height: '80px',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(ellipse at center, var(--theme-accent-dim, rgba(0, 245, 212, 0.15)) 0%, transparent 70%)',
        filter: 'blur(25px)',
        zIndex: 0,
        animation: 'heartbeat-flow 8s infinite alternate ease-in-out',
        pointerEvents: 'none',
        opacity: 0.5
      }} />

      <style>{`
        @keyframes heartbeat-flow {
          0% { 
            transform: translate(-55%, -45%) scale(1); 
            background: radial-gradient(ellipse at center, var(--theme-accent-dim, rgba(0, 245, 212, 0.15)) 0%, transparent 70%);
          }
          33% { 
            transform: translate(-45%, -55%) scale(1.1); 
            background: radial-gradient(ellipse at center, var(--theme-accent-dim, rgba(0, 245, 212, 0.15)) 0%, transparent 70%);
          }
          66% { 
            transform: translate(-50%, -50%) scale(0.95); 
            background: radial-gradient(ellipse at center, var(--theme-accent-dim, rgba(0, 245, 212, 0.15)) 0%, transparent 70%);
          }
          100% { 
            transform: translate(-52%, -48%) scale(1.05); 
            background: radial-gradient(ellipse at center, var(--theme-accent-dim, rgba(0, 245, 212, 0.15)) 0%, transparent 70%);
          }
        }
        :root {
          --heartbeat-color: var(--theme-accent, #00C9FF);
        }
      `}</style>

      <div className="actions-grid" style={{ 
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        ...style 
      }}>
        <TabBtn 
          active={activeTab === 'search'} 
          onClick={() => onTabChange('search')} 
          icon={<Search size={18} />} 
          label="Search" 
        />
        <TabBtn 
          active={activeTab === 'ai-search'} 
          onClick={() => onTabChange('ai-search')} 
          icon={<Sparkles size={18} />} 
          label="Ask AI" 
        />
        <TabBtn 
          active={activeTab === 'describe'} 
          onClick={() => onTabChange('describe')} 
          icon={<FileText size={18} />} 
          label="Describe" 
        />
        <TabBtn 
          active={activeTab === 'scan'} 
          onClick={() => onTabChange('scan')} 
          icon={(
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <Barcode size={14} />
              <FileText size={14} />
            </div>
          )} 
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
      className={`search-coaster-tab-btn ${active ? 'active' : ''}`}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '12px 0',
        borderRadius: '16px',
        cursor: 'pointer',
        border: active ? '1.5px solid var(--theme-border)' : '1px solid transparent',
        background: active ? 'var(--theme-accent-dim, rgba(0, 245, 212, 0.12))' : 'var(--theme-panel-dim, rgba(18, 21, 32, 0.4))',
        color: active ? 'var(--theme-accent, #00F5D4)' : 'var(--theme-text-dim-on-panel, #BDC4C6)',
        boxShadow: active ? '0 0 12px var(--theme-accent-dim)' : 'none',
        transition: 'all var(--transition-smooth, 0.25s)',
        fontFamily: 'inherit',
        fontSize: '10px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="coaster-icon-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span className="coaster-label" style={{ marginTop: '2px' }}>
        {label}
      </span>
    </button>
  );
};

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
      padding: '8px 16px 24px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0, 201, 255, 0.04) 50%, rgba(146, 254, 157, 0.04) 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(18px)',
      boxShadow: '0 15px 45px rgba(0,0,0,0.3)',
      margin: '0 0 16px 0',
      overflow: 'hidden' // Contain the heartbeat
    }}>
      {/* Secret Heartbeat Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '120px',
        height: '80px',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(ellipse at center, var(--heartbeat-color, rgba(138, 43, 226, 0.15)) 0%, transparent 70%)',
        filter: 'blur(25px)',
        zIndex: 0,
        animation: 'heartbeat-flow 8s infinite alternate ease-in-out',
        pointerEvents: 'none',
        opacity: 0.6
      }} />

      <style>{`
        @keyframes heartbeat-flow {
          0% { 
            transform: translate(-55%, -45%) scale(1); 
            background: radial-gradient(ellipse at center, rgba(138, 43, 226, 0.2) 0%, transparent 70%);
          }
          33% { 
            transform: translate(-45%, -55%) scale(1.1); 
            background: radial-gradient(ellipse at center, rgba(102, 51, 153, 0.18) 0%, transparent 70%);
          }
          66% { 
            transform: translate(-50%, -50%) scale(0.95); 
            background: radial-gradient(ellipse at center, rgba(199, 21, 133, 0.15) 0%, transparent 70%);
          }
          100% { 
            transform: translate(-52%, -48%) scale(1.05); 
            background: radial-gradient(ellipse at center, rgba(75, 0, 130, 0.2) 0%, transparent 70%);
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
          ? '0 6px 20px var(--theme-accent-dim, rgba(0, 201, 255, 0.25)), 0 0 15px var(--theme-accent-dim, rgba(0, 201, 255, 0.15))' 
          : '0 4px 12px rgba(0,0,0,0.12)',
        transform: active ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
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

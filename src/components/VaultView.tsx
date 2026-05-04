import React, { useState } from 'react';
import { BadgesView } from './BadgesView';
import { ThemesView } from './ThemesView';
import { Award, Palette } from 'lucide-react';

export const VaultView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'badges' | 'themes'>('badges');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', background: 'var(--theme-panel, rgba(255,255,255,0.03))', borderRadius: '12px', padding: '4px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', marginBottom: 'var(--space-xl)' }}>
        <button 
          onClick={() => setActiveTab('badges')} 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            padding: '12px', 
            background: activeTab === 'badges' ? 'var(--theme-accent-dim)' : 'transparent', 
            color: activeTab === 'badges' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', 
            border: activeTab === 'badges' ? '1px solid var(--theme-accent)' : '1px solid transparent', 
            borderRadius: '10px', 
            fontWeight: '800', 
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
          <Award size={16} /> Badges
        </button>
        <button 
          onClick={() => setActiveTab('themes')} 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            padding: '12px', 
            background: activeTab === 'themes' ? 'var(--theme-accent-dim)' : 'transparent', 
            color: activeTab === 'themes' ? 'var(--theme-accent)' : 'var(--theme-text-dim)', 
            border: activeTab === 'themes' ? '1px solid var(--theme-accent)' : '1px solid transparent', 
            borderRadius: '10px', 
            fontWeight: '800', 
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
          <Palette size={16} /> Themes
        </button>
      </div>

      <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
        {activeTab === 'badges' && <BadgesView />}
        {activeTab === 'themes' && <ThemesView />}
      </div>
    </div>
  );
};

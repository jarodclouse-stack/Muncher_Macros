import React, { useState, useEffect, useRef } from 'react';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { 
  Check, Moon, Zap, Sun, Waves, Leaf, Castle, Sunset, Anchor, 
  Gauge, Atom, Crown, Wind, Shield, Eye, Hammer, Sparkles 
} from 'lucide-react';
import { useTheme, type ThemeName } from '../context/ThemeContext';
import { Toast } from './Toast';

const getThemeIcon = (id: ThemeName, color: string, size = 16) => {
  switch (id) {
    case 'obsidian': return <Moon size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'olympian-gold': return <Zap size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'neon-wasteland': return <Zap size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'cybermancer': return <Sparkles size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'solar-flare': return <Sun size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'deep-sea': return <Waves size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'forest-phantom': return <Leaf size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'dionysus-vineyard': return <Sparkles size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'emerald-city': return <Castle size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'sunset-horizon': return <Sunset size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'poseidons-depths': return <Anchor size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'carbon-fiber': return <Gauge size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'quantum-violet': return <Atom size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'artemis-moonlight': return <Moon size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'gold-reserve': return <Crown size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'hermes-swiftness': return <Wind size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'midnight-galaxy': return <Atom size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'spartan-grit': return <Shield size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'oracles-vision': return <Eye size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'ember-forge': return <Hammer size={size} color={color} style={{ flexShrink: 0 }} />;
    default: return <Sparkles size={size} color={color} style={{ flexShrink: 0 }} />;
  }
};

export const ThemesView: React.FC = () => {
  const { localCache, purchaseTheme } = useDiary();
  const { theme: currentThemeName, setTheme } = useTheme();
  
  const activeRef = useRef<HTMLDivElement>(null);
  const rewards = getRewardBreakdown(localCache);
  const currentGems = rewards.totalGems;
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, []);

  const purchasedThemes = localCache.settings?.purchasedThemes || [
    'obsidian', 'cybermancer', 'gold-reserve', 
    'forest-phantom', 'sunset-horizon', 
    'quantum-violet', 'olympian-gold', 
    'dionysus-vineyard', 'poseidons-depths', 'artemis-moonlight',
    'hermes-swiftness', 'spartan-grit', 'oracles-vision',
    'solar-flare', 'deep-sea', 'neon-wasteland',
    'emerald-city', 'carbon-fiber', 'midnight-galaxy',
    'ember-forge'
  ];

  const themes: { id: ThemeName; name: string; price: number; colors: string[] }[] = [
    { id: 'obsidian', name: 'Obsidian', price: 0, colors: ['#080A0F', '#00F5D4'] },
    { id: 'olympian-gold', name: 'Olympian Gold', price: 0, colors: ['#0F0D08', '#D4AF37'] },
    { id: 'neon-wasteland', name: 'Neon Wasteland', price: 0, colors: ['#0D0221', '#39FF14'] },
    { id: 'cybermancer', name: 'Cybermancer', price: 0, colors: ['#0D0221', '#FF00E5'] },
    { id: 'solar-flare', name: 'Solar Flare', price: 0, colors: ['#1A0700', '#FF9F1C'] },
    { id: 'deep-sea', name: 'Deep Sea', price: 0, colors: ['#001219', '#0077B6'] },
    { id: 'forest-phantom', name: 'Forest Phantom', price: 0, colors: ['#0A1410', '#92FE9D'] },
    { id: 'dionysus-vineyard', name: 'Dionysus\' Vineyard', price: 0, colors: ['#1A0A1F', '#9D4EDD'] },
    { id: 'emerald-city', name: 'Emerald City', price: 0, colors: ['#012E1B', '#50C878'] },
    { id: 'sunset-horizon', name: 'Sunset Horizon', price: 0, colors: ['#1A0F0F', '#FF9F1C'] },
    { id: 'poseidons-depths', name: 'Poseidon\'s Depths', price: 0, colors: ['#051923', '#00A6FB'] },
    { id: 'carbon-fiber', name: 'Carbon Fiber', price: 0, colors: ['#111111', '#E63946'] },
    { id: 'quantum-violet', name: 'Quantum Violet', price: 0, colors: ['#0F0014', '#9A48D0'] },
    { id: 'artemis-moonlight', name: 'Artemis\' Moonlight', price: 0, colors: ['#0B0E14', '#A5B4FC'] },
    { id: 'gold-reserve', name: 'Gold Reserve', price: 0, colors: ['#111111', '#D4AF37'] },
    { id: 'hermes-swiftness', name: 'Hermes\' Swiftness', price: 0, colors: ['#1F1D1A', '#F97316'] },
    { id: 'midnight-galaxy', name: 'Midnight Galaxy', price: 0, colors: ['#10002B', '#E0AAFF'] },
    { id: 'spartan-grit', name: 'Spartan Grit', price: 0, colors: ['#0F0A0A', '#991B1B'] },
    { id: 'oracles-vision', name: 'Oracle\'s Vision', price: 0, colors: ['#0D0B12', '#C084FC'] },
    { id: 'ember-forge', name: 'Ember Forge', price: 0, colors: ['#1B0B04', '#FF4500'] }
  ];

  const handleSelectTheme = (t: any) => {
    if (purchasedThemes.includes(t.id)) {
      setTheme(t.id);
    } else {
      if (currentGems >= t.price) {
        purchaseTheme(t.id);
        setTheme(t.id);
      } else {
        setToastMsg('Not enough gems!');
      }
    }
  };

  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {toastMsg && <Toast message={toastMsg} type="error" onClose={() => setToastMsg('')} />}
      <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: 'var(--theme-text)' }}>Theme Emporium</h2>
          <button 
            onClick={() => setTheme('obsidian')}
            className="btn"
            style={{ margin: 0, padding: '6px 12px', fontSize: '12px' }}
          >
            Reset to Stock
          </button>
        </div>
        <p style={{ color: 'var(--theme-text-dim)', fontSize: '13px', margin: 0 }}>Spend your hard-earned gems to unlock exclusive visual identities.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)', paddingBottom: '120px' }}>
        {themes.map(t => {
          const isSelected = currentThemeName === t.id;
          const isPurchased = purchasedThemes.includes(t.id);
          return (
            <div
              key={t.id}
              ref={isSelected ? activeRef : undefined}
              onClick={() => handleSelectTheme(t)}
              className="section"
                style={{ 
                  background: 'var(--theme-panel)',
                  border: isSelected ? '2px solid var(--theme-accent)' : '1px solid var(--theme-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-lg)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  boxShadow: isSelected 
                    ? `0 12px 35px var(--theme-accent-dim), 0 0 15px var(--theme-accent-dim)` 
                    : '0 6px 16px rgba(0, 0, 0, 0.12)',
                  opacity: isPurchased ? 1 : 0.8,
                  transform: isSelected ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)'
                }}
            >
              <div style={{ display: 'flex', gap: '3px', width: '40px', height: '14px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ flex: 1, background: t.colors[0] }} />
                <div style={{ flex: 1, background: t.colors[1] }} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getThemeIcon(t.id, t.colors[1], 15)}
                  <span>{t.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--theme-accent)', fontWeight: '400', background: 'var(--theme-accent-dim)', padding: '1px 6px', borderRadius: '4px' }}>{t.price} Gems</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isPurchased ? (
                    <span style={{ color: 'var(--theme-success)', fontWeight: '700' }}>PURCHASED</span>
                  ) : (
                    <span style={{ color: 'var(--theme-accent)', fontWeight: '700' }}>{t.price} GEMS</span>
                  )}
                  {isSelected && <span style={{ color: 'var(--theme-text)', opacity: 0.5 }}>• ACTIVE</span>}
                </div>
              </div>

              {isSelected ? (
                <div style={{ background: 'var(--theme-accent)', color: '#000', borderRadius: '50%', padding: '4px' }}>
                  <Check size={14} strokeWidth={3} />
                </div>
              ) : !isPurchased && (
                <div style={{ background: 'var(--theme-accent-dim)', color: 'var(--theme-accent)', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>
                  BUY
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        .btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--theme-panel-dim); border: none; padding: 12px; border-radius: var(--radius-md); color: var(--theme-text); font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

import React from 'react';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { Check } from 'lucide-react';
import { useTheme, type ThemeName } from '../context/ThemeContext';

export const ThemesView: React.FC = () => {
  const { localCache, purchaseTheme } = useDiary();
  const { theme: currentThemeName, setTheme } = useTheme();
  
  const rewards = getRewardBreakdown(localCache);
  const currentGems = rewards.totalGems;

  const purchasedThemes = localCache.settings?.purchasedThemes || [
    'obsidian', 'cybermancer', 'gold-reserve', 'glacier-peak', 
    'forest-phantom', 'midnight-crimson', 'sunset-horizon', 
    'quantum-violet', 'matcha-zen', 'sandstone',
    'olympian-gold', 'aegean-mist', 'hades-ember', 'athenas-wisdom',
    'dionysus-vineyard', 'poseidons-depths', 'artemis-moonlight',
    'hermes-swiftness', 'spartan-grit', 'oracles-vision',
    'solar-flare', 'deep-sea', 'sakura-spring', 'neon-wasteland',
    'emerald-city', 'carbon-fiber', 'sahara-gold', 'midnight-galaxy',
    'nordic-frost', 'ember-forge'
  ];

  const themes: { id: ThemeName; name: string; emoji: string; price: number; colors: string[] }[] = [
    { id: 'obsidian', name: 'Obsidian', emoji: '🌑', price: 0, colors: ['#080A0F', '#00F5D4'] },
    { id: 'olympian-gold', name: 'Olympian Gold', emoji: '⚡', price: 0, colors: ['#0F0D08', '#D4AF37'] },
    { id: 'neon-wasteland', name: 'Neon Wasteland', emoji: '⚡', price: 0, colors: ['#0D0221', '#39FF14'] },
    { id: 'cybermancer', name: 'Cybermancer', emoji: '🔮', price: 0, colors: ['#0D0221', '#FF00E5'] },
    { id: 'aegean-mist', name: 'Aegean Mist', emoji: '🌊', price: 0, colors: ['#F0FBFF', '#0088CC'] },
    { id: 'solar-flare', name: 'Solar Flare', emoji: '☀️', price: 0, colors: ['#1A0700', '#FF9F1C'] },
    { id: 'midnight-crimson', name: 'Midnight Crimson', emoji: '🩸', price: 0, colors: ['#050000', '#E63946'] },
    { id: 'hades-ember', name: 'Hades\' Ember', emoji: '🔥', price: 0, colors: ['#0A0202', '#FF4500'] },
    { id: 'deep-sea', name: 'Deep Sea', emoji: '🌊', price: 0, colors: ['#001219', '#0077B6'] },
    { id: 'glacier-peak', name: 'Glacier Peak', emoji: '🏔️', price: 0, colors: ['#F0F4F8', '#0077B6'] },
    { id: 'athenas-wisdom', name: 'Athena\'s Wisdom', emoji: '🦉', price: 0, colors: ['#F5F5DC', '#6B8E23'] },
    { id: 'sakura-spring', name: 'Sakura Spring', emoji: '🌸', price: 0, colors: ['#FFF0F3', '#FF4D6D'] },
    { id: 'forest-phantom', name: 'Forest Phantom', emoji: '🌿', price: 0, colors: ['#0A1410', '#92FE9D'] },
    { id: 'dionysus-vineyard', name: 'Dionysus\' Vineyard', emoji: '🍇', price: 0, colors: ['#1A0A1F', '#9D4EDD'] },
    { id: 'emerald-city', name: 'Emerald City', emoji: '🏰', price: 0, colors: ['#012E1B', '#50C878'] },
    { id: 'sunset-horizon', name: 'Sunset Horizon', emoji: '🌅', price: 0, colors: ['#1A0F0F', '#FF9F1C'] },
    { id: 'poseidons-depths', name: 'Poseidon\'s Depths', emoji: '🔱', price: 0, colors: ['#051923', '#00A6FB'] },
    { id: 'carbon-fiber', name: 'Carbon Fiber', emoji: '🏎️', price: 0, colors: ['#111111', '#E63946'] },
    { id: 'quantum-violet', name: 'Quantum Violet', emoji: '🌌', price: 0, colors: ['#0F0014', '#9A48D0'] },
    { id: 'artemis-moonlight', name: 'Artemis\' Moonlight', emoji: '🌙', price: 0, colors: ['#0B0E14', '#A5B4FC'] },
    { id: 'sahara-gold', name: 'Sahara Gold', emoji: '🏜️', price: 0, colors: ['#F5E6BE', '#D4AF37'] },
    { id: 'gold-reserve', name: 'Gold Reserve', emoji: '🔱', price: 0, colors: ['#111111', '#D4AF37'] },
    { id: 'hermes-swiftness', name: 'Hermes\' Swiftness', emoji: '👟', price: 0, colors: ['#1F1D1A', '#F97316'] },
    { id: 'midnight-galaxy', name: 'Midnight Galaxy', emoji: '🌌', price: 0, colors: ['#10002B', '#E0AAFF'] },
    { id: 'matcha-zen', name: 'Matcha Zen', emoji: '🍵', price: 0, colors: ['#E6E9E1', '#7A9B76'] },
    { id: 'spartan-grit', name: 'Spartan Grit', emoji: '🛡️', price: 0, colors: ['#0F0A0A', '#991B1B'] },
    { id: 'nordic-frost', name: 'Nordic Frost', emoji: '🧊', price: 0, colors: ['#F0F8FF', '#4682B4'] },
    { id: 'sandstone', name: 'Sandstone', emoji: '🏜️', price: 0, colors: ['#F4E8D1', '#A67C52'] },
    { id: 'oracles-vision', name: 'Oracle\'s Vision', emoji: '🔮', price: 0, colors: ['#0D0B12', '#C084FC'] },
    { id: 'ember-forge', name: 'Ember Forge', emoji: '⚒️', price: 0, colors: ['#1B0B04', '#FF4500'] }
  ];

  const handleSelectTheme = (t: any) => {
    if (purchasedThemes.includes(t.id)) {
      setTheme(t.id);
    } else {
      if (currentGems >= t.price) {
        purchaseTheme(t.id);
        setTheme(t.id);
      } else {
        alert("Not enough gems!");
      }
    }
  };

  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
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
                  <span style={{ fontSize: '18px' }}>{t.emoji}</span> {t.name} <span style={{ fontSize: '11px', color: 'var(--theme-accent)', fontWeight: '400', background: 'var(--theme-accent-dim)', padding: '1px 6px', borderRadius: '4px' }}>{t.price} Gems</span>
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

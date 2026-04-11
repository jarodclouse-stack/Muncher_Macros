import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { BADGES, BADGE_TIERS } from '../lib/badge-info';
import { Award, Trophy, Star, Shield, Zap, Lock, Palette, Check } from 'lucide-react';
import { useTheme, type ThemeName } from '../context/ThemeContext';

export const BadgesView: React.FC = () => {
  const { localCache, purchaseTheme } = useDiary();
  const { theme: currentThemeName, setTheme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'badges' | 'themes'>('badges');
  
  const rewards = getRewardBreakdown(localCache);
  const currentStreak = rewards.streak;
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
    { id: 'cybermancer', name: 'Cybermancer', emoji: '🔮', price: 0, colors: ['#0D0221', '#FF00E5'] },
    { id: 'gold-reserve', name: 'Gold Reserve', emoji: '🔱', price: 0, colors: ['#111111', '#D4AF37'] },
    { id: 'glacier-peak', name: 'Glacier Peak', emoji: '🏔️', price: 0, colors: ['#F0F4F8', '#0077B6'] },
    { id: 'forest-phantom', name: 'Forest Phantom', emoji: '🌿', price: 0, colors: ['#0A1410', '#92FE9D'] },
    { id: 'midnight-crimson', name: 'Midnight Crimson', emoji: '🩸', price: 0, colors: ['#050000', '#E63946'] },
    { id: 'sunset-horizon', name: 'Sunset Horizon', emoji: '🌅', price: 0, colors: ['#1A0F0F', '#FF9F1C'] },
    { id: 'quantum-violet', name: 'Quantum Violet', emoji: '🌌', price: 0, colors: ['#0F0014', '#9A48D0'] },
    { id: 'matcha-zen', name: 'Matcha Zen', emoji: '🍵', price: 0, colors: ['#E6E9E1', '#7A9B76'] },
    { id: 'sandstone', name: 'Sandstone', emoji: '🏜️', price: 0, colors: ['#F4E8D1', '#A67C52'] },
    // Greek Themes
    { id: 'olympian-gold', name: 'Olympian Gold', emoji: '⚡', price: 0, colors: ['#0F0D08', '#D4AF37'] },
    { id: 'aegean-mist', name: 'Aegean Mist', emoji: '🌊', price: 0, colors: ['#F0FBFF', '#0088CC'] },
    { id: 'hades-ember', name: 'Hades\' Ember', emoji: '🔥', price: 0, colors: ['#0A0202', '#FF4500'] },
    { id: 'athenas-wisdom', name: 'Athena\'s Wisdom', emoji: '🦉', price: 0, colors: ['#F5F5DC', '#6B8E23'] },
    { id: 'dionysus-vineyard', name: 'Dionysus\' Vineyard', emoji: '🍇', price: 0, colors: ['#1A0A1F', '#9D4EDD'] },
    { id: 'poseidons-depths', name: 'Poseidon\'s Depths', emoji: '🔱', price: 0, colors: ['#051923', '#00A6FB'] },
    { id: 'artemis-moonlight', name: 'Artemis\' Moonlight', emoji: '🌙', price: 0, colors: ['#0B0E14', '#A5B4FC'] },
    { id: 'hermes-swiftness', name: 'Hermes\' Swiftness', emoji: '👟', price: 0, colors: ['#1F1D1A', '#F97316'] },
    { id: 'spartan-grit', name: 'Spartan Grit', emoji: '🛡️', price: 0, colors: ['#0F0A0A', '#991B1B'] },
    { id: 'oracles-vision', name: 'Oracle\'s Vision', emoji: '🔮', price: 0, colors: ['#0D0B12', '#C084FC'] },
    // Premium Themes
    { id: 'solar-flare', name: 'Solar Flare', emoji: '☀️', price: 0, colors: ['#1A0700', '#FF9F1C'] },
    { id: 'deep-sea', name: 'Deep Sea', emoji: '🌊', price: 0, colors: ['#001219', '#0077B6'] },
    { id: 'sakura-spring', name: 'Sakura Spring', emoji: '🌸', price: 0, colors: ['#FFF0F3', '#FF4D6D'] },
    { id: 'neon-wasteland', name: 'Neon Wasteland', emoji: '⚡', price: 0, colors: ['#0D0221', '#39FF14'] },
    { id: 'emerald-city', name: 'Emerald City', emoji: '🏰', price: 0, colors: ['#012E1B', '#50C878'] },
    { id: 'carbon-fiber', name: 'Carbon Fiber', emoji: '🏎️', price: 0, colors: ['#111111', '#E63946'] },
    { id: 'sahara-gold', name: 'Sahara Gold', emoji: '🏜️', price: 0, colors: ['#F5E6BE', '#D4AF37'] },
    { id: 'midnight-galaxy', name: 'Midnight Galaxy', emoji: '🌌', price: 0, colors: ['#10002B', '#E0AAFF'] },
    { id: 'nordic-frost', name: 'Nordic Frost', emoji: '🧊', price: 0, colors: ['#F0F8FF', '#4682B4'] },
    { id: 'ember-forge', name: 'Ember Forge', emoji: '⚒️', price: 0, colors: ['#1B0B04', '#FF4500'] },
    // Tropical Escape Collection 🏝️
    { id: 'island-palm', name: 'Island Palm', emoji: '🌴', price: 0, colors: ['#F0FDF4', '#10B981'] },
    { id: 'azure-tide', name: 'Azure Tide', emoji: '🌊', price: 0, colors: ['#F0F9FF', '#06B6D4'] },
    { id: 'mango-salsa', name: 'Mango Salsa', emoji: '🥭', price: 0, colors: ['#FFF7ED', '#F97316'] },
    { id: 'hibiscus-bloom', name: 'Hibiscus Bloom', emoji: '🌺', price: 0, colors: ['#FFF1F2', '#E11D48'] },
    { id: 'blue-hawaiian', name: 'Blue Hawaiian', emoji: '🍹', price: 0, colors: ['#EFF6FF', '#3B82F6'] },
    { id: 'solar-breeze', name: 'Solar Breeze', emoji: '☀️', price: 0, colors: ['#FEFCE8', '#F59E0B'] },
    { id: 'coconut-milk', name: 'Coconut Milk', emoji: '🥥', price: 0, colors: ['#FAFAFA', '#71717A'] },
    { id: 'golden-pine', name: 'Golden Pine', emoji: '🍍', price: 0, colors: ['#FEFCE8', '#84CC16'] },
    { id: 'lava-orchid', name: 'Lava Orchid', emoji: '🌋', price: 0, colors: ['#FDF2F8', '#DB2777'] },
    { id: 'surf-neon', name: 'Surf Neon', emoji: '🏄', price: 0, colors: ['#ECFEFF', '#D946EF'] },
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

  const getTierIcon = (tierName: string, earned: boolean) => {
    const size = 20;
    const color = earned ? 'var(--theme-text)' : 'var(--theme-text-dim)';
    if (tierName === BADGE_TIERS.EARLY.name) return <Star size={size} color={color} />;
    if (tierName === BADGE_TIERS.CONSISTENCY.name) return <Shield size={size} color={color} />;
    if (tierName === BADGE_TIERS.DISCIPLINE.name) return <Zap size={size} color={color} />;
    if (tierName === BADGE_TIERS.ELITE.name) return <Trophy size={size} color={color} />;
    return <Award size={size} color={color} />;
  };

  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      
      {/* Sub-Tab Navigation */}
      <div style={{ background: 'var(--theme-panel)', padding: '4px', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '4px', border: '1px solid var(--theme-border)', width: 'fit-content' }}>
        <button 
          onClick={() => setActiveSubTab('badges')}
          className="btn"
          style={{ margin: 0, padding: '8px 20px', borderRadius: 'var(--radius-md)', background: activeSubTab === 'badges' ? 'var(--theme-accent)' : 'transparent', color: activeSubTab === 'badges' ? '#000' : 'var(--theme-text-dim)', fontSize: '13px' }}
        >
          <Award size={16} /> Badges
        </button>
        <button 
          onClick={() => setActiveSubTab('themes')}
          className="btn"
          style={{ margin: 0, padding: '8px 20px', borderRadius: 'var(--radius-md)', background: activeSubTab === 'themes' ? 'var(--theme-accent)' : 'transparent', color: activeSubTab === 'themes' ? '#000' : 'var(--theme-text-dim)', fontSize: '13px' }}
        >
          <Palette size={16} /> Themes Shop
        </button>
      </div>

      {activeSubTab === 'badges' ? (
        <>
          {/* Header Stat Card */}
          <div className="section" style={{ background: 'linear-gradient(145deg, var(--theme-panel) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', background: 'var(--theme-accent-dim)', padding: '16px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-md)' }}>
                <Trophy size={32} color="var(--theme-accent)" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 var(--space-xs) 0', color: 'var(--theme-text)' }}>Hall of Persistence</h2>
            <p style={{ color: 'var(--theme-text-dim)', fontSize: '14px', margin: '0 auto var(--space-lg)', maxWidth: '400px' }}>Your consistency is your superpower. Earn badges by maintaining your daily check-ins!</p>
            
            <div style={{ background: 'var(--theme-panel-dim)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', display: 'inline-block', border: '1px solid var(--theme-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Streak</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--theme-text)' }}>{currentStreak} <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--theme-accent)' }}>Days</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {Object.values(BADGE_TIERS).map(tier => {
              const tierBadges = BADGES.filter(b => b.tier === tier.name);
              const earnedInTier = tierBadges.filter(b => currentStreak >= b.day).length;

              return (
                <div key={tier.name} className="section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: tier.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {tier.name}
                      <span style={{ fontSize: '11px', background: 'var(--theme-panel-dim)', color: 'var(--theme-text-dim)', padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>
                        {earnedInTier}/{tierBadges.length}
                      </span>
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-md)' }}>
                    {tierBadges.map(badge => {
                      const isEarned = currentStreak >= badge.day;
                      return (
                        <div 
                          key={badge.title}
                          style={{ 
                            background: isEarned ? 'var(--theme-panel)' : 'var(--theme-panel-dim)',
                            border: isEarned ? `1px solid ${badge.color}44` : '1px dashed var(--theme-border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            boxShadow: isEarned ? `0 4px 20px ${badge.color}11` : 'none'
                          }}
                        >
                          <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '50%', 
                            background: isEarned ? badge.color : 'var(--theme-panel-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isEarned ? `0 0 15px ${badge.color}55` : 'none'
                          }}>
                            {isEarned ? getTierIcon(badge.tier, true) : <Lock size={18} color="var(--theme-text-dim)" />}
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                              fontSize: '13px', 
                              fontWeight: '800', 
                              color: isEarned ? 'var(--theme-text)' : 'var(--theme-text-dim)', 
                              marginBottom: '2px',
                              textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}>{badge.title}</div>
                            <div style={{ fontSize: '10px', color: isEarned ? badge.color : 'var(--theme-text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>
                              {isEarned ? 'UNLOCKED' : `Day ${badge.day}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
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
        </>
      )}

      <style>{`
        .btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--theme-panel-dim); border: none; padding: 12px; border-radius: var(--radius-md); color: var(--theme-text); font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

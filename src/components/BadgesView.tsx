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
    'quantum-violet', 'matcha-zen', 'sandstone'
  ];

  const themes: { id: ThemeName; name: string; emoji: string; price: number; colors: string[] }[] = [
    { id: 'obsidian', name: 'Obsidian 🌑', emoji: '🌑', price: 0, colors: ['#080A0F', '#00F5D4'] },
    { id: 'cybermancer', name: 'Cybermancer 🔮', emoji: '🔮', price: 0, colors: ['#0D0221', '#FF00E5'] },
    { id: 'gold-reserve', name: 'Gold Reserve 🔱', emoji: '🔱', price: 0, colors: ['#111111', '#D4AF37'] },
    { id: 'glacier-peak', name: 'Glacier Peak 🏔️', emoji: '🏔️', price: 0, colors: ['#F0F4F8', '#0077B6'] },
    { id: 'forest-phantom', name: 'Forest Phantom 🌿', emoji: '🌿', price: 0, colors: ['#0A1410', '#92FE9D'] },
    { id: 'midnight-crimson', name: 'Midnight Crimson 🩸', emoji: '🩸', price: 0, colors: ['#050000', '#E63946'] },
    { id: 'sunset-horizon', name: 'Sunset Horizon 🌅', emoji: '🌅', price: 0, colors: ['#1A0F0F', '#FF9F1C'] },
    { id: 'quantum-violet', name: 'Quantum Violet 🌌', emoji: '🌌', price: 0, colors: ['#0F0014', '#9A48D0'] },
    { id: 'matcha-zen', name: 'Matcha Zen 🍵', emoji: '🍵', price: 0, colors: ['#E6E9E1', '#7A9B76'] },
    { id: 'sandstone', name: 'Sandstone 🏜️', emoji: '🏜️', price: 0, colors: ['#F4E8D1', '#A67C52'] },
    // Greek Themes
    { id: 'olympian-gold', name: 'Olympian Gold ⚡', emoji: '⚡', price: 0, colors: ['#0F0D08', '#D4AF37'] },
    { id: 'aegean-mist', name: 'Aegean Mist 🌊', emoji: '🌊', price: 0, colors: ['#F0FBFF', '#0088CC'] },
    { id: 'hades-ember', name: 'Hades\' Ember 🔥', emoji: '🔥', price: 0, colors: ['#0A0202', '#FF4500'] },
    { id: 'athenas-wisdom', name: 'Athena\'s Wisdom 🦉', emoji: '🦉', price: 0, colors: ['#F5F5DC', '#6B8E23'] },
    { id: 'dionysus-vineyard', name: 'Dionysus\' Vineyard 🍇', emoji: '🍇', price: 0, colors: ['#1A0A1F', '#9D4EDD'] },
    { id: 'poseidons-depths', name: 'Poseidon\'s Depths 🔱', emoji: '🔱', price: 0, colors: ['#051923', '#00A6FB'] },
    { id: 'artemis-moonlight', name: 'Artemis\' Moonlight 🌙', emoji: '🌙', price: 0, colors: ['#0B0E14', '#A5B4FC'] },
    { id: 'hermes-swiftness', name: 'Hermes\' Swiftness 👟', emoji: '👟', price: 0, colors: ['#1F1D1A', '#F97316'] },
    { id: 'spartan-grit', name: 'Spartan Grit 🛡️', emoji: '🛡️', price: 0, colors: ['#0F0A0A', '#991B1B'] },
    { id: 'oracles-vision', name: 'Oracle\'s Vision 🔮', emoji: '🔮', price: 0, colors: ['#0D0B12', '#C084FC'] },
    // Premium Themes
    { id: 'solar-flare', name: 'Solar Flare ☀️', emoji: '☀️', price: 0, colors: ['#1A0700', '#FF9F1C'] },
    { id: 'deep-sea', name: 'Deep Sea 🌊', emoji: '🌊', price: 0, colors: ['#001219', '#0077B6'] },
    { id: 'sakura-spring', name: 'Sakura Spring 🌸', emoji: '🌸', price: 0, colors: ['#FFF0F3', '#FF4D6D'] },
    { id: 'neon-wasteland', name: 'Neon Wasteland ⚡', emoji: '⚡', price: 0, colors: ['#0D0221', '#39FF14'] },
    { id: 'emerald-city', name: 'Emerald City 🏰', emoji: '🏰', price: 0, colors: ['#012E1B', '#50C878'] },
    { id: 'carbon-fiber', name: 'Carbon Fiber 🏎️', emoji: '🏎️', price: 0, colors: ['#111111', '#E63946'] },
    { id: 'sahara-gold', name: 'Sahara Gold 🏜️', emoji: '🏜️', price: 0, colors: ['#F5E6BE', '#D4AF37'] },
    { id: 'midnight-galaxy', name: 'Midnight Galaxy 🌌', emoji: '🌌', price: 0, colors: ['#10002B', '#E0AAFF'] },
    { id: 'nordic-frost', name: 'Nordic Frost 🧊', emoji: '🧊', price: 0, colors: ['#F0F8FF', '#4682B4'] },
    { id: 'ember-forge', name: 'Ember Forge ⚒️', emoji: '⚒️', price: 0, colors: ['#1B0B04', '#FF4500'] },
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
    const color = earned ? 'var(--theme-text, #fff)' : 'var(--theme-text-dim, #4b4b5b)';
    if (tierName === BADGE_TIERS.EARLY.name) return <Star size={size} color={color} />;
    if (tierName === BADGE_TIERS.CONSISTENCY.name) return <Shield size={size} color={color} />;
    if (tierName === BADGE_TIERS.DISCIPLINE.name) return <Zap size={size} color={color} />;
    if (tierName === BADGE_TIERS.ELITE.name) return <Trophy size={size} color={color} />;
    return <Award size={size} color={color} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sub-Tab Navigation */}
      <div style={{ background: 'var(--theme-panel, rgba(0,0,0,0.3))', padding: '4px', borderRadius: '16px', display: 'flex', gap: '4px', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', width: 'fit-content' }}>
        <button 
          onClick={() => setActiveSubTab('badges')}
          style={{ padding: '8px 20px', border: 'none', borderRadius: '12px', background: activeSubTab === 'badges' ? 'var(--theme-accent, #00C9FF)' : 'transparent', color: activeSubTab === 'badges' ? 'var(--theme-panel-base, #000)' : 'var(--theme-text-dim, #8b8b9b)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
        >
          <Award size={16} /> Badges
        </button>
        <button 
          onClick={() => setActiveSubTab('themes')}
          style={{ padding: '8px 20px', border: 'none', borderRadius: '12px', background: activeSubTab === 'themes' ? 'var(--theme-accent, #00C9FF)' : 'transparent', color: activeSubTab === 'themes' ? 'var(--theme-panel-base, #000)' : 'var(--theme-text-dim, #8b8b9b)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
        >
          <Palette size={16} /> Themes Shop
        </button>
      </div>

      {activeSubTab === 'badges' ? (
        <>
          {/* Header Stat Card */}
          <div style={{ background: 'linear-gradient(145deg, var(--theme-panel, rgba(255,255,255,0.05)) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', padding: '12px', borderRadius: '20px', marginBottom: '16px' }}>
                <Trophy size={32} color="var(--theme-accent, #00C9FF)" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 8px 0', color: 'var(--theme-text, #fff)' }}>Hall of Persistence</h2>
            <p style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '14px', margin: '0 auto 16px', maxWidth: '400px' }}>Your consistency is your superpower. Earn badges by maintaining your daily check-ins!</p>
            
            <div style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', borderRadius: '16px', padding: '16px', display: 'inline-block', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))' }}>
                <span style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Streak</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--theme-text, #fff)' }}>{currentStreak} <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--theme-accent, #00C9FF)' }}>Days</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {Object.values(BADGE_TIERS).map(tier => {
              const tierBadges = BADGES.filter(b => b.tier === tier.name);
              const earnedInTier = tierBadges.filter(b => currentStreak >= b.day).length;

              return (
                <div key={tier.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: tier.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {tier.name}
                      <span style={{ fontSize: '11px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', color: 'var(--theme-text-dim, #8b8b9b)', padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>
                        {earnedInTier}/{tierBadges.length}
                      </span>
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                    {tierBadges.map(badge => {
                      const isEarned = currentStreak >= badge.day;
                      return (
                        <div 
                          key={badge.title}
                          style={{ 
                            background: isEarned ? 'var(--theme-panel, rgba(255,255,255,0.03))' : 'var(--theme-panel-dim, rgba(0,0,0,0.2))',
                            border: isEarned ? `1px solid ${badge.color}44` : '1px dashed var(--theme-border, rgba(255,255,255,0.05))',
                            borderRadius: '20px',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            boxShadow: isEarned ? `0 4px 20px ${badge.color}11` : 'none'
                          }}
                        >
                          <div style={{ 
                            width: '56px', 
                            height: '56px', 
                            borderRadius: '50%', 
                            background: isEarned ? badge.color : 'var(--theme-panel, rgba(255,255,255,0.02))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isEarned ? `0 0 15px ${badge.color}55` : 'none'
                          }}>
                            {isEarned ? getTierIcon(badge.tier, true) : <Lock size={20} color="var(--theme-text-dim, #3b3b4b)" />}
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: isEarned ? 'var(--theme-text, #fff)' : 'var(--theme-text-dim, #4b4b5b)', marginBottom: '2px' }}>{badge.title}</div>
                            <div style={{ fontSize: '10px', color: isEarned ? badge.color : 'var(--theme-text-dim, #3b3b4b)', fontWeight: '700', textTransform: 'uppercase' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: 'var(--theme-text, #fff)' }}>Theme Emporium</h2>
            <button 
              onClick={() => setTheme('obsidian')}
              style={{ background: 'var(--theme-panel, rgba(255,255,255,0.05))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', color: 'var(--theme-text-dim, #8b8b9b)', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              Reset to Stock
            </button>
          </div>
          <p style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '13px', marginBottom: '20px' }}>Spend your hard-earned gems to unlock exclusive visual identities. Emojis indicate the theme's spirit!</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {themes.map(t => {
              const isSelected = currentThemeName === t.id;
              const isPurchased = purchasedThemes.includes(t.id);
              return (
                <div 
                  key={t.id}
                  onClick={() => handleSelectTheme(t)}
                  style={{ 
                    background: 'var(--theme-panel, rgba(255,255,255,0.03))',
                    border: isSelected ? '2px solid var(--theme-accent, #00F5D4)' : '1px solid var(--theme-border, rgba(255,255,255,0.05))',
                    borderRadius: '24px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: isSelected ? '0 8px 32px var(--theme-accent-dim, rgba(0,245,212,0.15))' : 'none',
                    opacity: isPurchased ? 1 : 0.8
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '50px' }}>
                    <div style={{ width: '100%', height: '24px', background: t.colors[0], borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ width: '100%', height: '12px', background: t.colors[1], borderRadius: '4px' }} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--theme-text, #fff)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {t.name} <span style={{ fontSize: '11px', color: 'var(--theme-accent, #00C9FF)', fontWeight: '400', background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', padding: '1px 6px', borderRadius: '4px' }}>{t.price} Gems</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isPurchased ? (
                        <span style={{ color: 'var(--theme-success, #92FE9D)', fontWeight: '700' }}>PURCHASED</span>
                      ) : (
                        <span style={{ color: 'var(--theme-accent, #00C9FF)', fontWeight: '700' }}>{t.price} GEMS</span>
                      )}
                      {isSelected && <span style={{ color: 'var(--theme-text, #fff)', opacity: 0.5 }}>• ACTIVE</span>}
                    </div>
                  </div>

                  {isSelected ? (
                    <div style={{ background: 'var(--theme-accent, #00F5D4)', color: 'var(--theme-panel-base, #000)', borderRadius: '50%', padding: '4px' }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : !isPurchased && (
                    <div style={{ background: 'var(--theme-accent-dim, rgba(0,201,255,0.1))', color: 'var(--theme-accent, #00C9FF)', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>
                      BUY
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
};

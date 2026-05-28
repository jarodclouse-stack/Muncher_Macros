import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DiaryView } from '../components/DiaryView';
import { NutritionView } from '../components/NutritionView';
import { ProgressView } from '../components/ProgressView';
import { PantryView } from '../components/PantryView';
import { SettingsView } from '../components/SettingsView';
import { VaultView } from '../components/VaultView';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { BADGES, BADGE_TIERS } from '../lib/badge-info';
import { LogOut, Award, Plus, Settings, X, Info, Sparkles, Trophy, Star, Shield, Zap, Lock, Menu, BookOpen, Apple, TrendingUp, Target } from 'lucide-react';

export const MainDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { localCache, isScannerActive } = useDiary();
  const [activeTab, setActiveTab] = useState<'diary' | 'nutrition' | 'progress' | 'pantry' | 'prestige'>('diary');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const rewards = getRewardBreakdown(localCache);

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', color: 'var(--theme-text, #f1f1f1)', fontFamily: 'Inter, sans-serif' }}>
      {/* Topbar */}
      <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'calc(12px + env(safe-area-inset-top)) 20px 12px',
          background: 'rgba(12, 12, 18, 0.7)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo.png"
              alt="Muncher Macros"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                opacity: 0.9,
                flexShrink: 0
              }}
            />
            <div>
              <h1 style={{
                fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                fontSize: '15px',
                fontWeight: '800',
                margin: 0,
                color: 'var(--theme-text, #fff)',
                letterSpacing: '-0.01em'
              }}>
                Muncher Macros
              </h1>
              <p style={{
                fontSize: '11px',
                fontWeight: '500',
                margin: 0,
                color: 'var(--theme-text-dim, #8b8b9b)',
                letterSpacing: '0.01em'
              }}>
                {localCache.settings?.displayName || user?.email?.split('@')[0] || 'Guest'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            {isMenuOpen && (
              <div
                onClick={() => setIsMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'transparent' }}
              />
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                background: isMenuOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: isMenuOpen ? 'var(--theme-accent)' : 'var(--theme-text-dim, #c0c0d0)',
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                outline: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Menu size={18} />
            </button>

            {isMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: '0',
                  background: 'rgba(18, 18, 24, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: '170px',
                  zIndex: 100,
                  animation: 'menuFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <DropdownItem
                  onClick={() => { setIsMenuOpen(false); setShowVaultModal(true); }}
                  icon={<Sparkles size={14} color="#A5B4FC" />}
                  label="The Vault"
                />
                <DropdownItem
                  onClick={() => { setIsMenuOpen(false); setShowSettingsModal(true); }}
                  icon={<Settings size={14} color="var(--theme-text-dim)" />}
                  label="Settings"
                />

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '4px 8px' }} />

                <DropdownItem
                  onClick={() => { setIsMenuOpen(false); logout(); }}
                  icon={<LogOut size={14} color="#FF6B6B" />}
                  label="Log Out"
                  danger
                />
              </div>
            )}
          </div>
        </header>

      {/* Main Content Area */}
      <main className="app-container" style={{ 
        paddingTop: activeTab === 'pantry' ? 'calc(56px + env(safe-area-inset-top))' : 'calc(56px + env(safe-area-inset-top) + var(--space-xl))', 
        paddingBottom: isScannerActive ? '0' : 'calc(80px + max(12px, env(safe-area-inset-bottom)))',
        background: 'transparent'
      }}>
        {activeTab === 'diary' && <DiaryView />}
        {activeTab === 'nutrition' && <NutritionView />}
        {activeTab === 'prestige' && (() => {
          const getTierIcon = (tierName: string, earned: boolean) => {
            const size = 18;
            const color = earned ? 'var(--theme-text)' : 'var(--theme-text-dim)';
            if (tierName === BADGE_TIERS.EARLY.name) return <Star size={size} color={color} />;
            if (tierName === BADGE_TIERS.CONSISTENCY.name) return <Shield size={size} color={color} />;
            if (tierName === BADGE_TIERS.DISCIPLINE.name) return <Zap size={size} color={color} />;
            if (tierName === BADGE_TIERS.ELITE.name) return <Trophy size={size} color={color} />;
            return <Award size={size} color={color} />;
          };
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="glass-card" style={{ padding: '16px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Current Streak</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#FF6B6B', marginTop: '4px' }}>{rewards.streak} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--theme-text-dim)' }}>days</span></div>
                </div>
                <div className="glass-card" style={{ padding: '16px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Total Gems</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFD700', marginTop: '4px' }}>{rewards.totalGems}</div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '16px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <Info size={16} color="var(--theme-accent)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-accent)' }}>Weekly Multiplier</div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--theme-text)', opacity: 0.8, margin: 0, lineHeight: '1.5' }}>
                  Every 7 days, your consistency earns a massive bonus:
                  <br/><br/>
                  <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    (Weeks Streak x Current Days) = Bonus Gems
                  </code>
                </p>
              </div>

              <div className="glass-card" style={{ padding: '16px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--theme-text-dim)' }}>Next Milestone:</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text)' }}>Day {rewards.nextMilestoneStreak}</span>
                </div>
                <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: `${(rewards.streak % 7) / 7 * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--theme-accent), #92FE9D)', borderRadius: '10px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>Estimated Bonus:</span>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#92FE9D' }}>+{rewards.potentialBonus} Gems</span>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '16px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Trophy size={16} color="var(--theme-accent)" />
                  <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, color: 'var(--theme-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>Persistence Badges</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {BADGES.map(badge => {
                    const isEarned = rewards.streak >= badge.day;
                    return (
                      <div key={badge.title} style={{
                        background: isEarned ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                        border: isEarned ? `1px solid ${badge.color}44` : '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: '16px', padding: '12px 8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                        opacity: isEarned ? 1 : 0.4
                      }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%',
                          background: isEarned ? badge.color : 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isEarned ? `0 0 10px ${badge.color}55` : 'none'
                        }}>
                          {isEarned ? getTierIcon(badge.tier, true) : <Lock size={14} color="var(--theme-text-dim)" />}
                        </div>
                        <div style={{ textAlign: 'center', width: '100%' }}>
                          <div style={{ fontSize: '11px', fontWeight: '900', color: isEarned ? 'var(--theme-text)' : 'var(--theme-text-dim)', lineHeight: '1.2', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={badge.title}>{badge.title}</div>
                          <div style={{ fontSize: '8px', color: isEarned ? badge.color : 'var(--theme-text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {isEarned ? 'UNLOCKED' : `Day ${badge.day}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
        {activeTab === 'progress' && <ProgressView />}
        {activeTab === 'pantry' && <PantryView />}
      </main>

      {showRewardModal && (() => {
        const getTierIcon = (tierName: string, earned: boolean) => {
          const size = 18;
          const color = earned ? 'var(--theme-text)' : 'var(--theme-text-dim)';
          if (tierName === BADGE_TIERS.EARLY.name) return <Star size={size} color={color} />;
          if (tierName === BADGE_TIERS.CONSISTENCY.name) return <Shield size={size} color={color} />;
          if (tierName === BADGE_TIERS.DISCIPLINE.name) return <Zap size={size} color={color} />;
          if (tierName === BADGE_TIERS.ELITE.name) return <Trophy size={size} color={color} />;
          return <Award size={size} color={color} />;
        };

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div className="reward-modal" style={{ background: 'var(--theme-bg, rgba(26, 29, 35, 0.8))', border: '1px solid var(--theme-border, rgba(255,255,255,0.15))', borderRadius: '28px', width: '100%', maxWidth: '440px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  {/* Fixed Header */}
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--theme-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--theme-panel, rgba(0,0,0,0.2))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Award color="#FFD700" size={20} />
                          <h2 className="reward-title" style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--theme-text)' }}>PRESTIGE REWARDS</h2>
                      </div>
                      <button onClick={() => setShowRewardModal(false)} className="reward-close-btn" style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', border: '1px solid var(--theme-border)', color: 'var(--theme-text)', borderRadius: '10px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <X size={18} />
                      </button>
                  </div>
                  
                  {/* Scrollable Body */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="reward-stat-box" style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', padding: '16px', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
                              <div className="reward-label" style={{ fontSize: '10px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Current Streak</div>
                              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FF6B6B', marginTop: '4px' }}>{rewards.streak} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--theme-text-dim)' }}>days</span></div>
                          </div>
                          <div className="reward-stat-box" style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', padding: '16px', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
                              <div className="reward-label" style={{ fontSize: '10px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Total Gems</div>
                              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFD700', marginTop: '4px' }}>{rewards.totalGems}</div>
                          </div>
                      </div>

                      <div className="reward-info-card" style={{ background: 'var(--theme-accent-dim)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <Info size={16} color="var(--theme-accent)" style={{ flexShrink: 0 }} />
                              <div className="reward-info-title" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-accent)' }}>Weekly Multiplier</div>
                          </div>
                          <p className="reward-info-body" style={{ fontSize: '12px', color: 'var(--theme-text)', opacity: 0.8, margin: 0, lineHeight: '1.5' }}>
                              Every 7 days, your consistency earns a massive bonus:
                              <br/><br/>
                              <code className="reward-code" style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                                  (Weeks Streak × Current Days) = Bonus Gems
                              </code>
                          </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.1))', paddingTop: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <span className="reward-label" style={{ fontSize: '12px', color: 'var(--theme-text-dim)' }}>Next Milestone:</span>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text)' }}>Day {rewards.nextMilestoneStreak}</span>
                          </div>
                          <div className="reward-progress-track" style={{ height: '10px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.08))', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
                              <div style={{ width: `${(rewards.streak % 7) / 7 * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--theme-accent), #92FE9D)', borderRadius: '10px' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="reward-label" style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>Estimated Bonus:</span>
                              <span className="reward-gems-value" style={{ fontSize: '14px', fontWeight: '900', color: '#92FE9D' }}>+{rewards.potentialBonus} Gems</span>
                          </div>
                      </div>

                      {/* Integrated Swipable Persistence Badges Section */}
                      <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.1))', paddingTop: '20px', paddingBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                              <Trophy size={16} color="var(--theme-accent)" />
                              <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, color: 'var(--theme-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>Persistence Badges</h3>
                          </div>
                          <div 
                            style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(3, 1fr)', 
                              gap: '10px',
                              paddingBottom: '8px'
                            }}
                          >
                            {BADGES.map(badge => {
                              const isEarned = rewards.streak >= badge.day;
                              return (
                                <div 
                                  key={badge.title}
                                  style={{ 
                                    background: isEarned ? 'var(--theme-panel, rgba(255,255,255,0.02))' : 'var(--theme-panel-dim, rgba(255,255,255,0.01))',
                                    border: isEarned ? `1px solid ${badge.color}44` : '1px dashed var(--theme-border, rgba(255,255,255,0.1))',
                                    borderRadius: '16px',
                                    padding: '12px 8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isEarned ? `0 4px 15px ${badge.color}11` : 'none',
                                    opacity: isEarned ? 1 : 0.4
                                  }}
                                >
                                  <div style={{ 
                                    width: '38px', 
                                    height: '38px', 
                                    borderRadius: '50%', 
                                    background: isEarned ? badge.color : 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: isEarned ? `0 0 10px ${badge.color}55` : 'none'
                                  }}>
                                    {isEarned ? getTierIcon(badge.tier, true) : <Lock size={14} color="var(--theme-text-dim, #8b8b9b)" />}
                                  </div>

                                  <div style={{ textAlign: 'center', width: '100%' }}>
                                    <div style={{ 
                                      fontSize: '11px', 
                                      fontWeight: '900', 
                                      color: isEarned ? 'var(--theme-text)' : 'var(--theme-text-dim)', 
                                      lineHeight: '1.2',
                                      marginBottom: '2px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '100%',
                                      boxSizing: 'border-box'
                                    }} title={badge.title}>{badge.title}</div>
                                    <div style={{ fontSize: '8px', color: isEarned ? badge.color : 'var(--theme-text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                      {isEarned ? 'UNLOCKED' : `Day ${badge.day}`}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                      </div>

                      {/* Footer Actions inside Scroll */}
                      <button onClick={() => setShowRewardModal(false)} className="reward-dismiss-btn" style={{ width: '100%', padding: '12px', background: 'var(--theme-accent)', color: 'var(--theme-panel-base, #000)', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 15px var(--theme-accent-dim)' }}>
                          Keep it up! 🏆
                      </button>
                  </div>
              </div>
          </div>
        );
      })()}
      {showSettingsModal && <SettingsView onClose={() => setShowSettingsModal(false)} />}
      {showVaultModal && <VaultView onClose={() => setShowVaultModal(false)} />}

      {/* Bottom Navigation */}
      {!isScannerActive && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          paddingLeft: '16px',
          paddingRight: '16px',
          zIndex: 100,
          pointerEvents: 'none',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)'
        }}>
          <nav style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            background: 'rgba(18, 18, 24, 0.72)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '22px',
            padding: '6px 8px',
            width: '100%',
            maxWidth: '420px',
            gap: '2px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            pointerEvents: 'auto'
          }}>
            <NavItem active={activeTab === 'diary'} onClick={() => setActiveTab('diary')} label="Diary" icon={<BookOpen size={18} />} />
            <NavItem active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} label="Nutrition" icon={<Apple size={18} />} />
            {/* Raised center + button */}
            <button
              type="button"
              onClick={() => setActiveTab('pantry')}
              style={{
                background: 'var(--theme-accent, #00C9FF)',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 201, 255, 0.35)',
                transform: 'translateY(-10px)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0
              }}
            >
              <Plus size={24} color="#000" strokeWidth={2.5} />
            </button>
            <NavItem active={activeTab === 'prestige'} onClick={() => setActiveTab('prestige')} label="Progress" icon={<TrendingUp size={18} />} />
            <NavItem active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} label="Goals" icon={<Target size={18} />} />
          </nav>
        </div>
      )}

    </div>
  );
};


const NavItem = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: active ? 'rgba(255, 255, 255, 0.12)' : 'none',
      border: 'none',
      borderRadius: '16px',
      color: active ? 'var(--theme-text, #fff)' : 'var(--theme-text-dim, #8b8b9b)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '3px',
      cursor: 'pointer',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      flex: 1,
      padding: '8px 4px',
      outline: 'none',
      position: 'relative',
      WebkitTapHighlightColor: 'transparent'
    }}>
    <div style={{ transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
      {icon}
    </div>
    <span style={{ fontSize: '9px', fontWeight: active ? '800' : '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
  </button>
);

const DropdownItem = ({ onClick, icon, label, danger }: { onClick: () => void, icon: React.ReactNode, label: string, danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`dropdown-menu-item ${danger ? 'dropdown-menu-item-danger' : ''}`}
    style={{
      width: '100%',
      padding: '10px 14px',
      background: 'none',
      border: 'none',
      borderRadius: '10px',
      color: danger ? '#FF6B6B' : 'var(--theme-text, #f1f1f1)',
      fontSize: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      textAlign: 'left',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      outline: 'none'
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Inject animations and hover styling for premium burger dropdown
if (typeof document !== 'undefined') {
  const css = `
    .dropdown-menu-item:hover {
      background: rgba(255, 255, 255, 0.05) !important;
    }
    .dropdown-menu-item-danger:hover {
      background: rgba(255, 107, 107, 0.08) !important;
    }
    @keyframes menuFadeIn {
      from { transform: translateY(-8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
}


import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DiaryView } from '../components/DiaryView';
import { NutritionView } from '../components/NutritionView';
import { ProgressView } from '../components/ProgressView';
import { BadgesView } from '../components/BadgesView';
import { PantryView } from '../components/PantryView';
import { SettingsView } from '../components/SettingsView';
import { ThemesView } from '../components/ThemesView';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { LogOut, Activity, Flame, Utensils, Award, Plus, Settings, Gem, X, Info, Palette } from 'lucide-react';

export const MainDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { localCache, isScannerActive } = useDiary();
  const [activeTab, setActiveTab] = useState<'diary' | 'nutrition' | 'progress' | 'badges' | 'pantry' | 'themes'>('diary');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const rewards = getRewardBreakdown(localCache);
  const streak = rewards.streak;
  const gems = rewards.totalGems;

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', color: 'var(--theme-text, #f1f1f1)', fontFamily: 'Inter, sans-serif' }}>
      {/* Topbar */}
      {!isScannerActive && (
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: 'calc(8px + env(safe-area-inset-top)) 16px 8px', 
          background: 'var(--theme-panel, rgba(10, 30, 33, 0.72))', 
          borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.05))', 
          backdropFilter: 'blur(22px)', 
          WebkitBackdropFilter: 'blur(22px)',
          position: 'sticky', 
          top: 0, 
          zIndex: 10 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setShowSettingsModal(true)}>
            <div>
              <h1 style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif", fontSize: '10px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(0,201,255,0.2)' }}>
                {activeTab === 'diary' && <Utensils size={12} color="var(--theme-accent)" />}
                {activeTab === 'nutrition' && <Activity size={12} color="var(--theme-accent)" />}
                {activeTab === 'pantry' && <Plus size={12} color="var(--theme-accent)" />}
                {activeTab === 'progress' && <Flame size={12} color="var(--theme-accent)" />}
                {activeTab === 'badges' && <Award size={12} color="var(--theme-accent)" />}
                {activeTab === 'themes' && <Palette size={12} color="var(--theme-accent)" />}
                {user?.email?.split('@')[0] || 'Guest'}
              </h1>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            {/* Badges and Themes Nav */}
            <div style={{ display: 'flex', gap: '2px', borderRight: '1px solid var(--theme-border, rgba(255,255,255,0.1))', paddingRight: '4px' }}>
              <button onClick={() => setActiveTab('badges')} style={{ background: activeTab==='badges' ? 'var(--theme-accent-dim)' : 'var(--theme-panel, rgba(255,255,255,0.03))', border: activeTab==='badges' ? '1px solid var(--theme-accent)' : '1px solid var(--theme-border, rgba(255,255,255,0.05))', color: activeTab==='badges' ? 'var(--theme-accent)' : 'var(--theme-text)', padding: '4px 6px', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', transition: 'all 0.2s', minWidth: '38px' }}>
                <Award size={12} color={activeTab==='badges' ? 'var(--theme-accent)' : '#A5B4FC'} />
                <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Badges</span>
              </button>
              <button onClick={() => setActiveTab('themes')} style={{ background: activeTab==='themes' ? 'var(--theme-accent-dim)' : 'var(--theme-panel, rgba(255,255,255,0.03))', border: activeTab==='themes' ? '1px solid var(--theme-accent)' : '1px solid var(--theme-border, rgba(255,255,255,0.05))', color: activeTab==='themes' ? 'var(--theme-accent)' : 'var(--theme-text)', padding: '4px 6px', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', transition: 'all 0.2s', minWidth: '38px' }}>
                <Palette size={12} color={activeTab==='themes' ? 'var(--theme-accent)' : '#E0AAFF'} />
                <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Themes</span>
              </button>
            </div>

            {/* Rewards Section */}
            <div style={{ display: 'flex', borderRight: '1px solid var(--theme-border, rgba(255,255,255,0.1))', paddingRight: '6px', gap: '4px' }}>
              <RewardChip icon={<Flame size={14} color="#FF6B6B" />} value={streak} label="Strk" onClick={() => setShowRewardModal(true)} />
              <RewardChip icon={<Gem size={14} color="#FFD700" />} value={gems} label="Gems" onClick={() => setShowRewardModal(true)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '32px' }}>
              <button onClick={() => setShowSettingsModal(true)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', color: 'var(--theme-text-dim, #c0c0d0)', padding: '6px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={14} />
              </button>
              <button onClick={logout} style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', color: '#FF6B6B', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="app-container" style={{ 
        paddingTop: isScannerActive ? '0' : (activeTab === 'pantry' ? '0' : 'var(--space-xl)'), 
        paddingBottom: isScannerActive ? '0' : 'calc(72px + env(safe-area-inset-bottom))',
        background: 'transparent'
      }}>
        {activeTab === 'diary' && <DiaryView />}
        {activeTab === 'nutrition' && <NutritionView />}
        {activeTab === 'progress' && <ProgressView />}
        {activeTab === 'badges' && <BadgesView />}
        {activeTab === 'themes' && <ThemesView />}
        {activeTab === 'pantry' && <PantryView />}
      </main>

      {showRewardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: 'var(--theme-bg, rgba(26, 29, 35, 0.8))', border: '1px solid var(--theme-border, rgba(255,255,255,0.15))', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '24px', position: 'relative', boxShadow: '0 20px 48px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                <button onClick={() => setShowRewardModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'var(--theme-text)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={18} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(255,215,0,0.15)', padding: '12px', borderRadius: '16px' }}>
                        <Award color="#FFD700" size={24} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--theme-text)' }}>🎉 Reward Earnings</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Streak</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FF6B6B', marginTop: '4px' }}>{rewards.streak} <span style={{ fontSize: '12px', fontWeight: '500' }}>days</span></div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Gems</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFD700', marginTop: '4px' }}>{rewards.totalGems}</div>
                    </div>
                </div>

                <div style={{ background: 'var(--theme-accent-dim)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <Info size={16} color="var(--theme-accent)" style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-accent)' }}>Weekly Multiplier</div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--theme-text)', opacity: 0.8, margin: 0, lineHeight: '1.5' }}>
                        Every 7 days, your consistency earns a massive bonus:
                        <br/><br/>
                        <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            (Weeks Streak × Current Days) = Bonus Gems
                        </code>
                    </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--theme-text-dim)' }}>Next Milestone:</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text)' }}>Day {rewards.nextMilestoneStreak}</span>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: `${(rewards.streak % 7) / 7 * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--theme-accent), #92FE9D)', borderRadius: '10px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>Estimated Bonus:</span>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#92FE9D' }}>+{rewards.potentialBonus} Gems</span>
                    </div>
                </div>

                <button onClick={() => setShowRewardModal(false)} style={{ width: '100%', marginTop: '24px', padding: '12px', background: 'var(--theme-panel, rgba(255,255,255,0.05))', border: 'none', borderRadius: '12px', color: 'var(--theme-text)', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'var(--theme-panel, rgba(255,255,255,0.05))'}>
                    Got it! 🏆
                </button>
            </div>
        </div>
      )}
      {showSettingsModal && <SettingsView onClose={() => setShowSettingsModal(false)} />}

      {/* Bottom Navigation */}
      {!isScannerActive && (
        <nav style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'space-around', 
          background: 'var(--theme-panel, rgba(20, 24, 34, 0.85))', 
          backdropFilter: 'blur(20px) saturate(180%)', 
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', 
          padding: '4px 8px calc(env(safe-area-inset-bottom) + 4px) 8px', 
          zIndex: 100,
          gap: '2px'
        }}>
          <NavItem active={activeTab === 'diary'} onClick={() => setActiveTab('diary')} label="Diary" icon={<Utensils size={16} />} />
          <NavItem active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} label="Nutrition" icon={<Activity size={16} />} />
          <NavItem active={activeTab === 'pantry'} onClick={() => setActiveTab('pantry')} label="Add Food" icon={<Plus size={16} />} />
          <NavItem active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} label="Goals" icon={<Flame size={16} />} />
        </nav>
      )}

    </div>
  );
};


const NavItem = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
  <button 
    type="button"
    onClick={onClick} 
    style={{ 
      background: active ? 'color-mix(in srgb, var(--theme-accent) 40%, transparent)' : 'none',
      border: 'none', 
      borderRadius: '12px',
      color: active ? 'color-mix(in srgb, var(--theme-accent) 70%, var(--theme-text))' : 'var(--theme-text-dim, #8b8b9b)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '2px', 
      cursor: 'pointer', 
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
      flex: 1,
      padding: '4px',
      outline: 'none',
      position: 'relative',
      WebkitTapHighlightColor: 'transparent'
    }}>
    {active && (
      <div style={{ 
        position: 'absolute', 
        top: '-6px', 
        left: '20%', 
        right: '20%', 
        height: '2px', 
        background: 'var(--theme-accent)', 
        boxShadow: '0 0 10px var(--theme-accent)',
        borderRadius: '2px'
      }} />
    )}
    <div style={{ transform: active ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
      {icon}
    </div>
    <span style={{ fontSize: '8px', fontWeight: active ? '900' : '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
  </button>
);

const RewardChip = ({ icon, value, label, onClick }: { icon: React.ReactNode, value: number, label: string, onClick: () => void }) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
    {icon}
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--theme-text, #fff)' }}>{value}</span>
      <span style={{ fontSize: '8px', color: '#8b8b9b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
  </div>
);

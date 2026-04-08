import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DiaryView } from '../components/DiaryView';
import { NutritionView } from '../components/NutritionView';
import { ProgressView } from '../components/ProgressView';
import { BadgesView } from '../components/BadgesView';
import { PantryView } from '../components/PantryView';
import { SettingsView } from '../components/SettingsView';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { LogOut, Activity, Flame, Utensils, Award, Package, Settings, ChevronRight, Gem, X, Info } from 'lucide-react';
import legacyLogo from '../assets/logo_legacy.png';

export const MainDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { localCache } = useDiary();
  const [activeTab, setActiveTab] = useState<'diary' | 'nutrition' | 'progress' | 'badges' | 'pantry' | 'settings'>('diary');
  const [showRewardModal, setShowRewardModal] = useState(false);
  
  const rewards = getRewardBreakdown(localCache);
  const streak = rewards.streak;
  const gems = rewards.totalGems;

  return (
    <div style={{ backgroundColor: 'var(--theme-bg, #080A0F)', backgroundAttachment: 'fixed', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', color: 'var(--theme-text, #f1f1f1)', fontFamily: 'Inter, sans-serif' }}>
      {/* Topbar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 'calc(16px + env(safe-area-inset-top)) 20px 16px', 
        background: 'var(--theme-panel, rgba(255,255,255,0.02))', 
        borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.05))', 
        backdropFilter: 'blur(10px)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('settings')}>
          <div 
            style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e: any) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e: any) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img src={legacyLogo} alt="MM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Macro Munchers {activeTab === 'settings' && <ChevronRight size={14} color="var(--theme-accent, #00C9FF)" />}
            </h1>
            <p style={{ fontSize: '12px', color: '#8b8b9b', margin: 0 }}>Welcome, {user?.email?.split('@')[0] || 'Guest'}!</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {/* Rewards Section */}
          <div style={{ display: 'flex', borderRight: '1px solid var(--theme-border, rgba(255,255,255,0.05))', paddingRight: '10px', gap: '6px' }}>
            <RewardChip icon={<Flame size={14} color="#FF6B6B" />} value={streak} label="Strk" onClick={() => setShowRewardModal(true)} />
            <RewardChip icon={<Gem size={14} color="#FFD700" />} value={gems} label="Gems" onClick={() => setShowRewardModal(true)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '32px' }}>
            <button onClick={() => setActiveTab('settings')} style={{ background: activeTab === 'settings' ? 'var(--theme-accent-dim, rgba(0,201,255,0.1))' : 'rgba(255,255,255,0.02)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', color: activeTab === 'settings' ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #c0c0d0)', padding: '6px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={14} />
            </button>
            <button onClick={logout} style={{ background: 'rgba(255,107,107,0.05)', border: '1px solid var(--theme-error-dim, rgba(255,107,107,0.1))', color: '#FF6B6B', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: '24px 20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '90px' }}>
        {activeTab === 'diary' && <DiaryView />}
        {activeTab === 'nutrition' && <NutritionView />}
        {activeTab === 'progress' && <ProgressView setActiveTab={setActiveTab} />}
        {activeTab === 'badges' && <BadgesView />}
        {activeTab === 'pantry' && <PantryView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {showRewardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: '#1a1d23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                <button onClick={() => setShowRewardModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#8b8b9b', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(255,215,0,0.1)', padding: '12px', borderRadius: '16px' }}>
                        <Award color="#FFD700" size={24} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>🎉 Reward Earnings</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '11px', color: '#8b8b9b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Streak</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FF6B6B', marginTop: '4px' }}>{rewards.streak} <span style={{ fontSize: '12px', fontWeight: '500' }}>days</span></div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '11px', color: '#8b8b9b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Gems</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFD700', marginTop: '4px' }}>{rewards.totalGems}</div>
                    </div>
                </div>

                <div style={{ background: 'rgba(0,201,255,0.05)', border: '1px solid rgba(0,201,255,0.1)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <Info size={16} color="#00C9FF" style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#00C9FF' }}>Weekly Multiplier</div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#c0c0d0', margin: 0, lineHeight: '1.5' }}>
                        Every 7 days, your consistency earns a massive bonus:
                        <br/><br/>
                        <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            (Weeks Streak × Current Days) = Bonus Gems
                        </code>
                    </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#8b8b9b' }}>Next Milestone:</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Day {rewards.nextMilestoneStreak}</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ width: `${(rewards.streak % 7) / 7 * 100}%`, height: '100%', background: 'linear-gradient(90deg, #00C9FF, #92FE9D)', borderRadius: '10px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#8b8b9b' }}>Estimated Bonus:</span>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#92FE9D' }}>+{rewards.potentialBonus} Gems</span>
                    </div>
                </div>

                <button onClick={() => setShowRewardModal(false)} style={{ width: '100%', marginTop: '24px', padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                    Got it! 🏆
                </button>
            </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        display: 'flex', 
        justifyContent: 'space-around', 
        background: 'var(--theme-panel, rgba(20, 24, 34, 0.85))', 
        backdropFilter: 'blur(15px)', 
        borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', 
        padding: '12px 0 calc(env(safe-area-inset-bottom) + 12px) 0', 
        zIndex: 100 
      }}>
        <NavItem active={activeTab === 'diary'} onClick={() => setActiveTab('diary')} label="Diary" icon={<Utensils size={20} />} />
        <NavItem active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} label="Nutrition" icon={<Activity size={20} />} />
        <NavItem active={activeTab === 'pantry'} onClick={() => setActiveTab('pantry')} label="Pantry" icon={<Package size={20} />} />
        <NavItem active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} label="Goals" icon={<Flame size={20} />} />
        <NavItem active={activeTab === 'badges'} onClick={() => setActiveTab('badges')} label="Badges/Themes" icon={<Award size={20} />} />
      </nav>

    </div>
  );
};


const NavItem = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} style={{ background: 'none', border: 'none', color: active ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #8b8b9b)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'color 0.2s', flex: 1 }}>
    {icon}
    <span style={{ fontSize: '11px', fontWeight: active ? '700' : '500' }}>{label}</span>
  </button>
);

const RewardChip = ({ icon, value, label, onClick }: any) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
    onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
    onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
    {icon}
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--theme-text, #fff)' }}>{value}</span>
      <span style={{ fontSize: '9px', color: '#8b8b9b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
  </div>
);

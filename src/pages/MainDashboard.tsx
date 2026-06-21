import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDiary } from '../context/DiaryContext';
import { LogOut, Plus, Settings, Sparkles, Trophy, Menu, BookOpen, Apple, TrendingUp, Target } from 'lucide-react';

const DiaryView = lazy(() => import('../components/DiaryView').then(m => ({ default: m.DiaryView })));
const NutritionView = lazy(() => import('../components/NutritionView').then(m => ({ default: m.NutritionView })));
const ProgressView = lazy(() => import('../components/ProgressView').then(m => ({ default: m.ProgressView })));
const WeightProgressView = lazy(() => import('../components/WeightProgressView').then(m => ({ default: m.WeightProgressView })));
const PantryView = lazy(() => import('../components/PantryView').then(m => ({ default: m.PantryView })));
const SettingsView = lazy(() => import('../components/SettingsView').then(m => ({ default: m.SettingsView })));
const VaultView = lazy(() => import('../components/VaultView').then(m => ({ default: m.VaultView })));
const BadgesView = lazy(() => import('../components/BadgesView').then(m => ({ default: m.BadgesView })));
const OnboardingWizard = lazy(() => import('../components/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));

export const MainDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { localCache, dataReady } = useDiary();
  const [activeTab, setActiveTab] = useState<'diary' | 'nutrition' | 'progress' | 'pantry' | 'prestige'>('diary');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingChecked = useRef(false);

  useEffect(() => {
    if (onboardingChecked.current) return;
    if (!dataReady) return; // still loading, wait
    onboardingChecked.current = true;
    if (!localCache.goals?.onboardingComplete && !localCache.goals?.weight) {
      Promise.resolve().then(() => {
        setShowOnboarding(true);
      });
    }
  }, [dataReady, localCache.goals]);

  // Allow child components (e.g. SmartScanner quota prompt) to open the Settings modal
  useEffect(() => {
    const handler = () => setShowSettingsModal(true);
    window.addEventListener('navigate-to-settings', handler);
    return () => window.removeEventListener('navigate-to-settings', handler);
  }, []);

  if (showOnboarding) {
    return (
      <Suspense fallback={
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c12', color: '#fff' }}>
          <div style={{ animation: 'spin 1.5s linear infinite', borderTop: '2px solid var(--theme-accent, #00C9FF)', borderRight: '2px solid transparent', borderRadius: '50%', width: '40px', height: '40px' }} />
        </div>
      }>
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      </Suspense>
    );
  }

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
              alt="Macro Munchers"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
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
                Macro Munchers
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
                  onClick={() => { setIsMenuOpen(false); setShowBadgesModal(true); }}
                  icon={<Trophy size={14} color="#FFD700" />}
                  label="Achievements"
                />
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
        paddingBottom: 'calc(80px + max(12px, env(safe-area-inset-bottom)))',
        background: 'transparent'
      }}>
        <Suspense fallback={
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-dim, #8b8b9b)' }}>
            <div style={{ animation: 'spin 1.5s linear infinite', borderTop: '2px solid var(--theme-accent, #00C9FF)', borderRight: '2px solid transparent', borderRadius: '50%', width: '30px', height: '30px' }} />
          </div>
        }>
          {activeTab === 'diary' && <DiaryView />}
          {activeTab === 'nutrition' && <NutritionView />}
          {activeTab === 'prestige' && <WeightProgressView />}
          {activeTab === 'progress' && <ProgressView />}
          {activeTab === 'pantry' && <PantryView />}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        {showSettingsModal && <SettingsView onClose={() => setShowSettingsModal(false)} />}
        {showVaultModal && <VaultView onClose={() => setShowVaultModal(false)} />}
        {showBadgesModal && <BadgesView onClose={() => setShowBadgesModal(false)} />}
      </Suspense>

      {/* Bottom Navigation */}
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
            <NavItem active={activeTab === 'diary'} onClick={() => setActiveTab('diary')} label="Food Log" icon={<BookOpen size={18} />} />
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


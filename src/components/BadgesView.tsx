import React from 'react';
import ReactDOM from 'react-dom';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { BADGES, BADGE_TIERS } from '../lib/badge-info';
import { Award, X, Info, Trophy, Star, Shield, Zap, Lock } from 'lucide-react';

interface BadgesViewProps {
  onClose: () => void;
}

export const BadgesView: React.FC<BadgesViewProps> = ({ onClose }) => {
  const { localCache } = useDiary();
  const rewards = getRewardBreakdown(localCache);

  const getTierIcon = (tierName: string, earned: boolean) => {
    const size = 18;
    const color = earned ? 'var(--theme-text)' : 'var(--theme-text-dim)';
    if (tierName === BADGE_TIERS.EARLY.name) return <Star size={size} color={color} />;
    if (tierName === BADGE_TIERS.CONSISTENCY.name) return <Shield size={size} color={color} />;
    if (tierName === BADGE_TIERS.DISCIPLINE.name) return <Zap size={size} color={color} />;
    if (tierName === BADGE_TIERS.ELITE.name) return <Trophy size={size} color={color} />;
    return <Award size={size} color={color} />;
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--theme-bg, var(--theme-panel, #0a1e21))',
          border: '1px solid var(--theme-border, rgba(255,255,255,0.15))',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--theme-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--theme-panel, rgba(0,0,0,0.2))' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--theme-text)' }}>
            <Trophy size={20} color="var(--theme-accent)" /> ACHIEVEMENTS
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', padding: '16px', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
              <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Current Streak</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FF6B6B', marginTop: '4px' }}>{rewards.streak} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--theme-text-dim)' }}>days</span></div>
            </div>
            <div style={{ background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', padding: '16px', borderRadius: '16px', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
              <div style={{ fontSize: '10px', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Total Gems</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFD700', marginTop: '4px' }}>{rewards.totalGems}</div>
            </div>
          </div>

          <div style={{ background: 'var(--theme-accent-dim)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '16px' }}>
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

          <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.1))', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--theme-text-dim)' }}>Next Milestone:</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text)' }}>Day {rewards.nextMilestoneStreak}</span>
            </div>
            <div style={{ height: '10px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.08))', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
              <div style={{ width: `${(rewards.streak % 7) / 7 * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--theme-accent), #92FE9D)', borderRadius: '10px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>Estimated Bonus:</span>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#92FE9D' }}>+{rewards.potentialBonus} Gems</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.1))', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Trophy size={16} color="var(--theme-accent)" />
              <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, color: 'var(--theme-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>Persistence Badges</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', paddingBottom: '8px' }}>
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
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
};

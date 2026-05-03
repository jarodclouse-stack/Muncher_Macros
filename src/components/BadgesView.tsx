import React from 'react';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { BADGES, BADGE_TIERS } from '../lib/badge-info';
import { Award, Trophy, Star, Shield, Zap, Lock } from 'lucide-react';

export const BadgesView: React.FC = () => {
  const { localCache } = useDiary();
  
  const rewards = getRewardBreakdown(localCache);
  const currentStreak = rewards.streak;

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
    </div>
  );
};

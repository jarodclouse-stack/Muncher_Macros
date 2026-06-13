import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useDiary } from '../context/DiaryContext';
import { ACTIVITY_LEVELS } from '../lib/constants';
import { ChevronRight, ChevronLeft, User, Target, Flame, Sparkles, Dumbbell, Scale } from 'lucide-react';

const STEPS = ['welcome', 'body', 'goal', 'activity'] as const;
type Step = typeof STEPS[number];

export const OnboardingWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { updateGoals, updateSettings, localCache } = useDiary();
  const unitWeight = localCache.settings?.units?.weight || 'lb';
  const unitHeight = localCache.settings?.units?.height || 'in';
  const isMetric = unitWeight === 'kg';
  const [step, setStep] = useState<Step>('welcome');
  const [screenName, setScreenName] = useState('');
  const [sex, setSex] = useState('male');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState(isMetric ? '178' : '70');
  const [weight, setWeight] = useState(isMetric ? '77' : '170');
  const [goalType, setGoalType] = useState('maintain');
  const [activityId, setActivityId] = useState('moderate');

  const stepIdx = STEPS.indexOf(step);
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  const next = () => {
    const nextIdx = stepIdx + 1;
    if (nextIdx < STEPS.length) {
      setStep(STEPS[nextIdx]);
    } else {
      finish();
    }
  };

  const back = () => {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1]);
  };

  const finish = () => {
    if (screenName.trim()) {
      updateSettings({ displayName: screenName.trim() });
    }
    updateGoals({
      sex,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      goalType,
      activityId,
      proteinLevelId: activityId,
      rate: goalType === 'lose' ? 0.5 : goalType === 'gain' ? 0.25 : 0,
      targetWeight: Number(weight),
      macroC: 45,
      macroF: 25,
      onboardingComplete: true,
    });
    onComplete();
  };

  const canAdvance = () => {
    if (step === 'body') return Number(age) > 0 && Number(height) > 0 && Number(weight) > 0;
    return true;
  };

  const content = () => {
    switch (step) {
      case 'welcome':
        return (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}><Dumbbell size={48} color="var(--theme-accent)" /></div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--theme-text)', margin: 0 }}>
              Welcome to Macro Munchers
            </h2>
            <p style={{ color: 'var(--theme-text-dim)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Let's set up your profile so we can calculate your perfect nutrition targets. This takes about 30 seconds.
            </p>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--theme-text-dim)', display: 'block', marginBottom: '6px', textAlign: 'left' }}>What should we call you? (optional)</label>
              <input
                type="text"
                value={screenName}
                onChange={e => setScreenName(e.target.value)}
                placeholder="Your name"
                maxLength={20}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(0,0,0,0.4)', border: '1px solid var(--theme-border)',
                  padding: '12px 14px', borderRadius: '10px', color: '#fff',
                  outline: 'none', fontSize: '15px', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
        );

      case 'body':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-accent)' }}>
              <User size={20} /> <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--theme-text)' }}>Body Stats</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={lblStyle}>Sex</label>
                <select value={sex} onChange={e => setSex(e.target.value)} style={inpStyle}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={lblStyle}>Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} style={inpStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={lblStyle}>Height ({unitHeight})</label>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)} style={inpStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lblStyle}>Weight ({unitWeight})</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={inpStyle} />
              </div>
            </div>
          </div>
        );

      case 'goal':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-accent)' }}>
              <Target size={20} /> <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--theme-text)' }}>Your Goal</span>
            </div>
            <p style={{ color: 'var(--theme-text-dim)', fontSize: '13px', margin: 0 }}>What are you working toward?</p>
            {[
              { id: 'lose', label: 'Lose Weight', icon: <Flame size={22} color="var(--theme-accent)" />, desc: 'Cut body fat while preserving muscle' },
              { id: 'maintain', label: 'Maintain Weight', icon: <Scale size={22} color="var(--theme-accent)" />, desc: 'Stay at your current weight' },
              { id: 'gain', label: 'Gain Muscle', icon: <Dumbbell size={22} color="var(--theme-accent)" />, desc: 'Build muscle with a calorie surplus' },
            ].map(g => (
              <div
                key={g.id}
                onClick={() => setGoalType(g.id)}
                style={{
                  padding: '14px 16px',
                  background: goalType === g.id ? 'var(--theme-accent-dim)' : 'rgba(0,0,0,0.3)',
                  border: goalType === g.id ? '2px solid var(--theme-accent)' : '1px solid var(--theme-border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }}>{g.icon}</span>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--theme-text)', fontSize: '14px' }}>{g.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '2px' }}>{g.desc}</div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'activity':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-accent)' }}>
              <Flame size={20} /> <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--theme-text)' }}>Activity Level</span>
            </div>
            <p style={{ color: 'var(--theme-text-dim)', fontSize: '13px', margin: 0 }}>How active are you on a typical week?</p>
            {ACTIVITY_LEVELS.map((a: { id: string; label: string; desc: string; tdee: number }) => (
              <div
                key={a.id}
                onClick={() => setActivityId(a.id)}
                style={{
                  padding: '12px 14px',
                  background: activityId === a.id ? 'var(--theme-accent-dim)' : 'rgba(0,0,0,0.3)',
                  border: activityId === a.id ? '2px solid var(--theme-accent)' : '1px solid var(--theme-border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: '700', color: 'var(--theme-text)', fontSize: '14px' }}>{a.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '2px' }}>{a.desc}</div>
              </div>
            ))}
          </div>
        );
    }
  };

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--theme-bg, #080A0F)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Progress bar */}
      <div style={{ height: '4px', background: 'var(--theme-border)' }}>
        <div style={{
          height: '100%', background: 'var(--theme-accent)',
          width: `${progress}%`, transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px 0' }}>
        <button
          onClick={finish}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-dim)', borderRadius: '8px',
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
            padding: '10px 18px', minHeight: '44px',
          }}
        >
          Skip setup →
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 24px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        maxWidth: '440px', width: '100%', margin: '0 auto',
      }}>
        {content()}
      </div>

      {/* Navigation */}
      <div style={{
        padding: '16px 24px 32px',
        display: 'flex', gap: '12px',
        maxWidth: '440px', width: '100%', margin: '0 auto', boxSizing: 'border-box',
      }}>
        {stepIdx > 0 && (
          <button onClick={back} style={{
            flex: 1, padding: '14px', borderRadius: '12px',
            background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)',
            color: 'var(--theme-text)', fontWeight: '700', fontSize: '15px',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <ChevronLeft size={18} /> Back
          </button>
        )}
        <button
          onClick={next}
          disabled={!canAdvance()}
          style={{
            flex: 2, padding: '14px', borderRadius: '12px',
            background: 'var(--theme-accent)', border: 'none',
            color: 'var(--theme-panel-base, #000)', fontWeight: '800', fontSize: '15px',
            cursor: canAdvance() ? 'pointer' : 'not-allowed',
            opacity: canAdvance() ? 1 : 0.5,
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          {stepIdx === STEPS.length - 1 ? (
            <><Sparkles size={18} /> Finish Setup</>
          ) : (
            <>Continue <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>,
    document.body
  );
};

const lblStyle: React.CSSProperties = {
  fontSize: '12px', color: 'var(--theme-text-dim)',
  marginBottom: '6px', display: 'block', fontWeight: '500',
};

const inpStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.4)', border: '1px solid var(--theme-border)',
  padding: '12px 14px', borderRadius: '10px', color: '#fff',
  outline: 'none', fontSize: '15px', fontFamily: 'inherit',
  WebkitTextFillColor: '#fff',
};

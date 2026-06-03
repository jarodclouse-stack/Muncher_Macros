import React from 'react';
import ReactDOM from 'react-dom';
import { X, Info, Shield, Zap, Sparkles } from 'lucide-react';

interface MacroInfoPopupProps {
  macro: 'kcal' | 'p' | 'c' | 'f';
  food: any;
  onClose: () => void;
}

const MACRO_DETAILS = {
  kcal: {
    title: 'Calories (Energy)',
    color: '#E0E0E0',
    bg: 'rgba(255, 255, 255, 0.08)',
    accent: '#FFFFFF',
    glow: 'rgba(255, 255, 255, 0.2)',
    kidExplain: 'Calories are like the battery power in food! Just like a toy car needs battery juice to zoom around, your body uses calories to run, play, jump, and think.',
    fitnessExplain: 'Calories measure the total energy provided by food. Your weight is managed by the balance between the calories you consume and the calories your body burns through daily metabolic processes and physical activity.',
    calPerGram: 'N/A (Derived from other macros)',
    bulletPoints: [
      'Daily goal is calculated based on age, gender, weight, and activity level.',
      'To lose weight, you consume slightly fewer calories than you burn (calorie deficit).',
      'To gain muscle, you consume slightly more calories than you burn (calorie surplus).',
    ]
  },
  p: {
    title: 'Protein',
    color: 'var(--theme-error, #FF6B6B)',
    bg: 'rgba(255, 107, 107, 0.08)',
    accent: '#FF6B6B',
    glow: 'rgba(255, 107, 107, 0.2)',
    kidExplain: 'Protein is like the building bricks for your body! It helps grow and repair your muscles, skin, and organs, making you big, strong, and healthy.',
    fitnessExplain: 'Essential for cellular repair, immune health, and protein synthesis. Vital for active individuals to rebuild muscle fibers damaged during workouts and to maintain lean muscle mass during weight loss.',
    calPerGram: '4 Calories (kcal) per gram',
    bulletPoints: [
      'Made of amino acids, which are the building blocks of all tissues.',
      'Has the highest thermic effect of food (burns the most calories just to digest).',
      'Helps you feel full and satisfied for longer periods.',
    ]
  },
  c: {
    title: 'Carbohydrates',
    color: 'var(--theme-accent, #00C9FF)',
    bg: 'rgba(0, 201, 255, 0.08)',
    accent: '#00C9FF',
    glow: 'rgba(0, 201, 255, 0.2)',
    kidExplain: "Carbs are your body's favorite fuel! They are like the gasoline that gives your brain and muscles quick energy to run, learn, and play sports.",
    fitnessExplain: "The body's primary and most efficient energy source. Digested carbs enter the blood as glucose, which is stored in muscles and liver as glycogen to power high-intensity exercise and daily cognitive function.",
    calPerGram: '4 Calories (kcal) per gram',
    bulletPoints: [
      'Complex carbs (starches, fiber) release energy slowly for long-term fuel.',
      'Simple carbs (sugars) digest quickly for immediate, fast-burning energy.',
      'Low glycogen stores lead to fatigue, low endurance, and "hitting the wall".',
    ]
  },
  f: {
    title: 'Dietary Fat',
    color: 'var(--theme-warning, #FCC419)',
    bg: 'rgba(252, 196, 25, 0.08)',
    accent: '#FCC419',
    glow: 'rgba(252, 196, 25, 0.2)',
    kidExplain: 'Fats are like your body’s backup battery and protective cushion! They store energy for later, keep you warm, and help protect your brain and nerves.',
    fitnessExplain: 'Essential macronutrient vital for hormone regulation (like testosterone), brain function, cell membrane integrity, and absorbing fat-soluble vitamins (A, D, E, K).',
    calPerGram: '9 Calories (kcal) per gram',
    bulletPoints: [
      'Monounsaturated & Polyunsaturated fats (olive oil, avocados, nuts) are heart-healthy.',
      'Saturated fat (fatty meats, butter) should be consumed in moderation.',
      'Trans fat (processed fried foods) should be avoided entirely.',
    ]
  }
};

export const MacroInfoPopup: React.FC<MacroInfoPopupProps> = ({ macro, food, onClose }) => {
  const details = MACRO_DETAILS[macro];
  if (!details) return null;

  // Calculate specific food macro breakdown
  const p = Number(food?.p ?? 0);
  const c = Number(food?.c ?? 0);
  const f = Number(food?.f ?? 0);
  
  const pCal = p * 4;
  const cCal = c * 4;
  const fCal = f * 9;
  const totalCal = pCal + cCal + fCal || 1;

  const pPct = Math.round((pCal / totalCal) * 100);
  const cPct = Math.round((cCal / totalCal) * 100);
  const fPct = Math.round((fCal / totalCal) * 100);

  // Dynamic values based on multiplier/serving
  const foodKcal = Math.round(food?.calories ?? food?.cal ?? 0);
  const foodP = p.toFixed(1);
  const foodC = c.toFixed(1);
  const foodF = f.toFixed(1);

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.8)', 
        backdropFilter: 'blur(10px)', 
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 5000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px' 
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ 
          background: '#0c191c', 
          border: `1px solid ${details.accent}55`, 
          borderRadius: '24px', 
          width: '100%', 
          maxWidth: '380px', 
          padding: '24px', 
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${details.accent}15`,
          color: '#FFF'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: details.bg, 
              color: details.accent 
            }}>
              {macro === 'p' && <Shield size={18} />}
              {macro === 'c' && <Zap size={18} />}
              {macro === 'f' && <Info size={18} />}
              {macro === 'kcal' && <Sparkles size={18} />}
            </span>
            <div style={{ fontSize: '18px', fontWeight: '900', color: details.accent }}>
              {details.title}
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255,255,255,0.07)', 
              border: 'none', 
              color: 'rgba(255,255,255,0.5)', 
              cursor: 'pointer', 
              padding: '6px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Macro value in this Food */}
        <div style={{ 
          background: 'rgba(0,0,0,0.2)', 
          border: '1px solid rgba(255,255,255,0.05)', 
          borderRadius: '16px', 
          padding: '12px 16px', 
          marginBottom: '20px' 
        }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            Amount in this item
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '24px', fontWeight: '900', color: details.accent }}>
              {macro === 'kcal' && `${foodKcal} kcal`}
              {macro === 'p' && `${foodP}g`}
              {macro === 'c' && `${foodC}g`}
              {macro === 'f' && `${foodF}g`}
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
              {food?.serving}
            </span>
          </div>
        </div>

        {/* 5th Grade Explanation */}
        <div style={{ 
          background: details.bg, 
          border: `1px solid ${details.accent}20`, 
          borderRadius: '16px', 
          padding: '16px', 
          marginBottom: '16px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', color: details.accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            <Sparkles size={12} /> Explained for Kids (5th Grader)
          </div>
          <div style={{ fontSize: '12.5px', lineHeight: '1.5', color: '#fff', fontWeight: '500' }}>
            "{details.kidExplain}"
          </div>
        </div>

        {/* Fitness / Technical Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Energy Contribution
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>
              {details.calPerGram}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Physiological Role
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
              {details.fitnessExplain}
            </div>
          </div>
        </div>

        {/* Bullet Points */}
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.08)', 
          paddingTop: '16px', 
          marginBottom: '20px' 
        }}>
          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {details.bulletPoints.map((pt, idx) => (
              <li key={idx} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', fontWeight: '500' }}>
                {pt}
              </li>
            ))}
          </ul>
        </div>

        {/* Caloric Distribution in this food */}
        {macro !== 'kcal' && totalCal > 1 && (
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Calorie Contribution in this item
            </div>
            
            {/* Visual stacked bar */}
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', display: 'flex', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${pPct}%`, background: '#FF6B6B' }} title={`Protein: ${pPct}%`} />
              <div style={{ width: `${cPct}%`, background: '#00C9FF' }} title={`Carbs: ${cPct}%`} />
              <div style={{ width: `${fPct}%`, background: '#FCC419' }} title={`Fat: ${fPct}%`} />
            </div>

            {/* Labels and values */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B6B' }} />
                <span style={{ fontSize: '10px', color: macro === 'p' ? '#FF6B6B' : 'rgba(255,255,255,0.5)', fontWeight: '800' }}>P: {pPct}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C9FF' }} />
                <span style={{ fontSize: '10px', color: macro === 'c' ? '#00C9FF' : 'rgba(255,255,255,0.5)', fontWeight: '800' }}>C: {cPct}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FCC419' }} />
                <span style={{ fontSize: '10px', color: macro === 'f' ? '#FCC419' : 'rgba(255,255,255,0.5)', fontWeight: '800' }}>F: {fPct}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

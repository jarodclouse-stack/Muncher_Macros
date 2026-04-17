import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { sumFoods } from '../lib/food/serving-converter';
import { computeGoals } from '../lib/goals/compute';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const HistoryCalendar: React.FC<{ onSelectDate?: (d: string) => void }> = ({ onSelectDate }) => {
  const { localCache } = useDiary();
  const goals = localCache.goals || {};
  const computed = computeGoals(goals);

  const [date, setDate] = useState(new Date());

  const year = date.getFullYear();
  const month = date.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    setDate(new Date(year, month + offset, 1));
  };

  const getDayData = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = localCache[dStr];
    if (!dayData || !dayData.foodLog || dayData.foodLog.length === 0) return null;

    const totals = sumFoods(dayData.foodLog.map((l: any) => l.f));
    return { totals, dateStr: dStr };
  };

  const renderCells = () => {
    const cells = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} style={{ padding: '8px' }} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const data = getDayData(d);
      const isToday = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` === todayStr;
      
      let ringColor = 'var(--theme-panel-dim, rgba(255,255,255,0.05))';
      if (data) {
        const cals = data.totals.calories;
        const target = computed.targetCal;
        
        if (cals > target * 1.05) ringColor = 'var(--theme-error, #FF6B6B)'; // Overshot deeply
        else if (cals > target * 0.95) ringColor = 'var(--theme-success, #92FE9D)'; // Perfect
        else ringColor = 'var(--theme-accent, #4DABF7)'; // Under
      }

      cells.push(
        <div key={`day-${d}`} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px',
          background: isToday ? 'var(--theme-accent-dim, rgba(0,201,255,0.1))' : 'var(--theme-panel-dim, rgba(0,0,0,0.2))',
          border: isToday ? '1px solid var(--theme-accent, #00C9FF)' : '1px solid var(--theme-border, rgba(255,255,255,0.05))',
          borderRadius: '12px',
          cursor: data ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (data && onSelectDate) onSelectDate(data.dateStr);
        }}
        >
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: data ? 'var(--theme-text)' : 'var(--theme-text-dim, #555)', marginBottom: '4px' }}>{d}</span>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: ringColor }} />
          {data && (
            <span style={{ fontSize: '8px', color: 'var(--theme-text-dim, #8b8b9b)', marginTop: '4px' }}>{Math.round(data.totals.calories)}</span>
          )}
        </div>
      );
    }
    return cells;
  };

  return (
    <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px', marginTop: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text)' }}>
        <Calendar size={18} color="var(--theme-accent, #00C9FF)" /> Monthly History
      </h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => changeMonth(-1)} style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', border: 'none', color: 'var(--theme-accent, #00C9FF)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)' }}>
          {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => changeMonth(1)} style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', border: 'none', color: 'var(--theme-accent, #00C9FF)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><ChevronRight size={16} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <span key={day} style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', fontWeight: '600' }}>{day}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {renderCells()}
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '20px', justifyContent: 'center', fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--theme-success, #92FE9D)' }}/> Goal Met</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--theme-accent, #4DABF7)' }}/> Under</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--theme-error, #FF6B6B)' }}/> Over</span>
      </div>
    </div>
  );
};

export default HistoryCalendar;

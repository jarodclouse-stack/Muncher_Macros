import React, { useState, useMemo } from 'react';
import { useDiary } from '../context/DiaryContext';
import { Activity, Scale, Check, Trash2, Calendar, Edit2, X } from 'lucide-react';
import { Toast } from './Toast';
import { WeightHistoryChart } from './WeightHistoryChart';

export const WeightProgressView: React.FC = () => {
  const { localCache, updateGoals, updateDayData, currentDate } = useDiary();
  const goals = localCache.goals || {};
  const currentDayData = localCache[currentDate] || {};

  const cleanNumInput = (v: string) => {
    if (v.length > 1 && v.startsWith('0') && !v.startsWith('0.')) return v.substring(1);
    return v;
  };

  const [dailyWeight, setDailyWeight] = useState<string>(currentDayData.weight?.toString() || '');
  const [logDate, setLogDate] = useState<string>(currentDate);
  const [weightLb, setWeightLb] = useState(goals.weight?.toString() || '175');
  const [targetWeight, setTargetWeight] = useState(goals.targetWeight?.toString() || '165');
  const [toastMsg, setToastMsg] = useState('');

  // Editing entries states
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState<string>('');
  const [editDateInput, setEditDateInput] = useState<string>('');

  const unitWeight = localCache.settings?.units?.weight || 'lb';

  const loggedWeights = useMemo(() => {
    const allDates = Object.keys(localCache)
      .filter(k => k.match(/^\d{4}-\d{2}-\d{2}$/));
    return allDates
      .map(d => ({ date: d, weight: localCache[d].weight }))
      .filter(e => e.weight !== undefined && e.weight !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [localCache]);

  const handleDeleteWeight = (date: string) => {
    updateDayData(date, { weight: null });
    if (date === currentDate) {
      updateGoals({ weight: null });
      setWeightLb('');
      setDailyWeight('');
    }
    setToastMsg(`Weight log entry for ${date} removed.`);
  };

  const handleSaveEdit = (oldDate: string) => {
    const w = parseFloat(editWeight);
    if (isNaN(w) || w <= 0) {
      setToastMsg('Please enter a valid weight');
      return;
    }
    if (!editDateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setToastMsg('Please enter a valid date');
      return;
    }

    if (editDateInput !== oldDate) {
      // 1. Delete weight log on oldDate
      updateDayData(oldDate, { weight: null });
      if (oldDate === currentDate) {
        updateGoals({ weight: null });
      }

      // 2. Set weight log on new date
      updateDayData(editDateInput, { weight: w });
      if (editDateInput === currentDate) {
        updateGoals({ weight: w });
        setWeightLb(w.toString());
        setDailyWeight(w.toString());
      }
    } else {
      // Just update weight on the same date
      updateDayData(oldDate, { weight: w });
      if (oldDate === currentDate) {
        updateGoals({ weight: w });
        setWeightLb(w.toString());
        setDailyWeight(w.toString());
      }
    }

    setEditingDate(null);
    setToastMsg('Weight log entry updated successfully.');
  };

  React.useEffect(() => {
    const win = window as unknown as Record<string, string>;
    const lastUnitWeight = win.__lastUnitWeight;
    if (lastUnitWeight && lastUnitWeight !== unitWeight) {
      const conv = unitWeight === 'kg' ? 0.453592 : (1 / 0.453592);
      setWeightLb((prev: string) => {
        const v = parseFloat(prev);
        return isNaN(v) ? prev : (v * conv).toFixed(1);
      });
      setTargetWeight((prev: string) => {
        const v = parseFloat(prev);
        return isNaN(v) ? prev : (v * conv).toFixed(1);
      });
      setDailyWeight((prev: string) => {
        const v = parseFloat(prev);
        return isNaN(v) ? prev : (v * conv).toFixed(1);
      });
    }
  }, [unitWeight]);

  const handleSaveDailyWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(dailyWeight);
    if (!isNaN(w) && w > 0) {
      updateDayData(logDate, { weight: w });
      if (logDate === currentDate) {
        updateGoals({ weight: w });
        setWeightLb(w.toString());
      }
      setToastMsg(`Weight record saved for ${logDate}!`);
    }
  };

  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <WeightHistoryChart localCache={localCache} targetWeight={Number(targetWeight)} />

      <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: 'var(--space-lg)', color: 'var(--theme-text)' }}><Activity size={18} color="var(--theme-success, #92FE9D)" /> Progress to Goal</div>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)', padding: '0 var(--space-md)' }}>
          <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--theme-text)', lineHeight: 1 }}>
            {Math.abs(parseFloat(weightLb) - parseFloat(targetWeight)).toFixed(1)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--theme-text)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 'var(--space-xs)', maxWidth: '400px', margin: 'var(--space-xs) auto 0' }}>
            {unitWeight} remaining to reach your {targetWeight} {unitWeight} goal
          </div>
        </div>
        <div style={{ padding: '0 var(--space-xs)' }}>
          <div style={{ height: '14px', background: 'var(--theme-panel, rgba(255,255,255,0.07))', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', padding: '3px' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--theme-accent, #00C9FF), var(--theme-success, #92FE9D))',
              borderRadius: '10px',
              width: `${Math.max(5, Math.min(100, (1 - Math.abs(parseFloat(weightLb) - parseFloat(targetWeight)) / 25) * 100))}%`,
              transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', color: 'var(--theme-text)', marginTop: 'var(--space-md)' }}>
            <span>Current: {weightLb} {unitWeight}</span>
            <span>Target: {targetWeight} {unitWeight}</span>
          </div>
        </div>
      </div>

      <div className="card" id="weight-logging" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '900', marginBottom: 'var(--space-lg)', color: 'var(--theme-accent)', textTransform: 'uppercase', letterSpacing: '1px' }}><Scale size={20} color="var(--theme-accent)" /> Weight Log</div>
        <form onSubmit={handleSaveDailyWeight} style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="lbl">Record Date</label>
            <input type="date" className="inp" value={logDate} onChange={e => setLogDate(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="lbl">Body Weight ({unitWeight})</label>
            <input type="number" step="0.1" className="inp" placeholder="Enter weight..." value={dailyWeight} onChange={e => setDailyWeight(cleanNumInput(e.target.value))} />
          </div>
          <button type="submit" className="btn" style={{ height: '42px', marginTop: 0, padding: '0 24px', background: 'var(--theme-accent)', color: 'var(--theme-panel-base, #000)', fontWeight: '800', boxShadow: '0 0 10px var(--theme-accent-dim)' }}><Check size={16} /> Save Weight Record</button>
        </form>
        <div style={{ fontSize: '12px', color: 'var(--theme-accent)', marginTop: '16px', fontWeight: '700', background: 'var(--theme-accent-dim)', padding: '10px', borderRadius: '8px', border: '1px solid var(--theme-accent-dim)' }}>Tip: Logging weight for today updates your body stats & TDEE app-wide. Historical logs update your chart only.</div>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '900', marginBottom: 'var(--space-md)', color: 'var(--theme-accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <Calendar size={20} color="var(--theme-accent)" /> Logged Entries
        </div>
        <div style={{ fontSize: '12px', color: 'var(--theme-text-dim)', marginBottom: 'var(--space-md)' }}>
          Review or remove your past weight logs. Deleting today's log will update your current body stats.
        </div>
        
        {loggedWeights.length === 0 ? (
          <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--theme-text-dim)', fontSize: '13px', fontStyle: 'italic' }}>
            No weight entries logged yet.
          </div>
        ) : (
          <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--theme-border)', borderRadius: '12px', background: 'var(--theme-panel-dim, rgba(255, 255, 255, 0.01))' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--theme-border)', background: 'var(--theme-panel-base, rgba(0,0,0,0.2))', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--theme-text-dim)', fontWeight: '700' }}>Date</th>
                  <th style={{ padding: '12px 16px', color: 'var(--theme-text-dim)', fontWeight: '700' }}>Weight</th>
                  <th style={{ padding: '12px 16px', color: 'var(--theme-text-dim)', fontWeight: '700', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loggedWeights.map(entry => {
                  const parts = entry.date.split('-');
                  const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  const formattedDate = dateObj.toLocaleDateString(undefined, { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                  const isEditing = editingDate === entry.date;
                  return (
                    <tr key={entry.date} style={{ borderBottom: '1px solid var(--theme-border-dim, rgba(255,255,255,0.02))', background: isEditing ? 'rgba(0, 201, 255, 0.03)' : 'transparent' }}>
                      <td style={{ padding: '8px 16px', color: 'var(--theme-text)', fontWeight: '600' }}>
                        {isEditing ? (
                          <input 
                            type="date" 
                            className="inp" 
                            style={{ padding: '6px 10px', fontSize: '12px', width: 'auto', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--theme-accent)' }} 
                            value={editDateInput} 
                            onChange={e => setEditDateInput(e.target.value)} 
                          />
                        ) : (
                          formattedDate
                        )}
                      </td>
                      <td style={{ padding: '8px 16px', color: 'var(--theme-accent)', fontWeight: '800' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input 
                              type="number" 
                              step="0.1" 
                              className="inp" 
                              style={{ padding: '6px 10px', fontSize: '12px', width: '80px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--theme-accent)' }} 
                              value={editWeight} 
                              onChange={e => setEditWeight(cleanNumInput(e.target.value))} 
                            />
                            <span style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>{unitWeight}</span>
                          </div>
                        ) : (
                          `${entry.weight} ${unitWeight}`
                        )}
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleSaveEdit(entry.date)} 
                              style={{ background: 'var(--theme-accent, #00C9FF)', color: '#000', padding: '6px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => setEditingDate(null)} 
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--theme-text)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--theme-border)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Discard Changes"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button 
                              onClick={() => {
                                setEditingDate(entry.date);
                                setEditWeight(entry.weight.toString());
                                setEditDateInput(entry.date);
                              }}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--theme-accent, #00C9FF)', 
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              className="edit-action-btn"
                              title="Edit weight entry"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteWeight(entry.date)}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--theme-error, #FF6B6B)', 
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              className="delete-btn"
                              title="Delete weight entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .card { background: var(--theme-panel, rgba(255,255,255,0.02)); border: 1px solid var(--theme-border, rgba(255,255,255,0.05)); border-radius: 20px; padding: 24px; }
        .lbl { font-size: 12px; color: var(--theme-text-dim, #8b8b9b); margin-bottom: 6px; display: block; font-weight: 500; }
        .inp { width: 100%; box-sizing: border-box; background: var(--theme-input-bg, rgba(0,0,0,0.4)); border: 1px solid var(--theme-border, rgba(255,255,255,0.1)); padding: 10px 14px; border-radius: 10px; color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; outline: none; transition: border-color 0.2s; font-family: inherit; }
        .inp:focus { border-color: var(--theme-accent, #00C9FF); }
        .btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--theme-panel-dim, rgba(255,255,255,0.1)); color: var(--theme-text); border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 8px; font-family: inherit; }
        .btn:hover:not(:disabled) { background: var(--theme-panel, rgba(255,255,255,0.2)); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .delete-btn:hover { background: rgba(255, 107, 107, 0.1); transform: scale(1.1); }
        .edit-action-btn:hover { background: rgba(0, 201, 255, 0.15); transform: scale(1.1); }
      `}</style>
      {toastMsg && <Toast message={toastMsg} type="success" onClose={() => setToastMsg('')} />}
    </div>
  );
};

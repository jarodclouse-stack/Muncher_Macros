import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeightHistoryChartProps {
  localCache: any;
  targetWeight?: number;
}

export const WeightHistoryChart: React.FC<WeightHistoryChartProps> = ({ localCache, targetWeight }) => {
  const [window, setWindow] = useState<'7d' | '30d' | 'all'>('30d');

  const { chartData, trend } = useMemo(() => {
    // 1. Gather all date-keyed weights
    const allDates = Object.keys(localCache)
      .filter(k => k.match(/^\d{4}-\d{2}-\d{2}$/))
      .sort();
    
    let entries = allDates
      .map(d => ({ date: d, weight: localCache[d].weight }))
      .filter(e => e.weight !== undefined && e.weight !== null);

    if (entries.length === 0) return { chartData: null, trend: null };

    // 2. Filter by window
    if (window !== 'all') {
      const days = window === '7d' ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      entries = entries.filter(e => new Date(e.date + 'T12:00:00') >= cutoff);
    }

    if (entries.length === 0) return { chartData: null, trend: null };

    // 3. Prepare Chart.js data
    const labels = entries.map(e => {
        const d = new Date(e.date + 'T12:00:00');
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    const datasets = [
      {
        label: 'Weight',
        data: entries.map(e => e.weight),
        borderColor: 'var(--theme-accent, #4DABF7)',
        backgroundColor: 'var(--theme-accent-dim, rgba(77, 171, 247, 0.2))',
        borderWidth: 3,
        pointRadius: window === '7d' ? 4 : 2,
        pointBackgroundColor: 'var(--theme-accent, #4DABF7)',
        tension: 0.3,
      }
    ];

    if (targetWeight) {
        datasets.push({
            label: 'Goal',
            data: entries.map(() => targetWeight),
            borderColor: 'var(--theme-error, #FF6B6B)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5] as any,
            pointRadius: 0,
            tension: 0,
        } as any);
    }

    // 4. Calculate Trends (Ported from legacy)
    const firstW = entries[0].weight;
    const lastW = entries[entries.length - 1].weight;
    const daySpan = Math.max(1, entries.length - 1);
    const totalChange = lastW - firstW;
    const lbsPerWeek = (totalChange / daySpan) * 7;
    
    let direction = "Maintaining";
    let dirColor = "#edd155";
    let icon = <Minus size={14} color="#edd155" />;

    if (totalChange < -0.1) {
        direction = "Losing";
        dirColor = "var(--theme-success, #92FE9D)"; // Switched to positive green for losing
        icon = <TrendingDown size={14} color="var(--theme-success, #92FE9D)" />;
    } else if (totalChange > 0.1) {
        direction = "Gaining";
        dirColor = "var(--theme-error, #ff716c)";
        icon = <TrendingUp size={14} color="var(--theme-error, #ff716c)" />;
    }

    return {
      chartData: { labels, datasets },
      trend: {
        totalChange,
        lbsPerWeek,
        direction,
        dirColor,
        icon,
        daySpan
      }
    };
  }, [localCache, window, targetWeight]);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'var(--theme-text-dim, #8b8b9b)',
          font: { size: 10 },
          boxWidth: 12,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1a1d23',
        titleColor: '#fff',
        bodyColor: '#c0c5d0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: 'var(--theme-text-dim, #8b8b9b)', font: { size: 10 }, maxTicksLimit: 8 },
        grid: { display: false },
      },
      y: {
        suggestedMin: (targetWeight || 150) - 10,
        suggestedMax: (targetWeight || 150) + 10,
        ticks: { color: 'var(--theme-text-dim, #8b8b9b)', font: { size: 10 } },
        grid: { color: 'var(--theme-border, rgba(255,255,255,0.05))' },
      },
    },
  };

  return (
    <div className="card" style={{ background: 'var(--theme-panel, rgba(255,255,255,0.02))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text, #fff)' }}>
          <Scale size={18} color="var(--theme-accent, #00C9FF)" /> Weight History Chart
        </h3>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
          {(['7d', '30d', 'all'] as const).map(w => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              style={{
                background: window === w ? 'var(--theme-accent-dim, rgba(0,201,255,0.15))' : 'transparent',
                border: 'none',
                color: window === w ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text-dim, #8b8b9b)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase'
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: '220px', width: '100%' }}>
        {chartData ? <Line data={chartData} options={options} /> : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-dim, #537c83)', fontSize: '13px' }}>
                No weight data logged for this period.
            </div>
        )}
      </div>

      {trend && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--theme-border, rgba(255,255,255,0.05))', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {trend.icon}
            <span style={{ color: trend.dirColor, fontWeight: '800', fontSize: '13px' }}>{trend.direction}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--theme-text, #c0c5d0)' }}>
            <span style={{ color: 'var(--theme-text, #fff)', fontWeight: '700' }}>{trend.totalChange >= 0 ? '+' : ''}{trend.totalChange.toFixed(1)}</span> lbs in {trend.daySpan} days
          </div>
          <div style={{ fontSize: '12px', color: 'var(--theme-text-dim, #8b8b9b)' }}>
            ({trend.lbsPerWeek >= 0 ? '+' : ''}{trend.lbsPerWeek.toFixed(1)} lbs/week avg)
          </div>
        </div>
      )}
    </div>
  );
};

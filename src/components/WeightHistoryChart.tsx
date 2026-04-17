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
  const unitWeight = localCache.settings?.units?.weight || 'lb';

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
        borderColor: 'var(--theme-accent, #00C9FF)', // Sync with legend marker
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          
          // Robust color parsing for Chart.js gradients
          let accentColor = getComputedStyle(document.body).getPropertyValue('--theme-accent').trim() || '#00C9FF';
          
          // Helper to add alpha safely
          const addAlpha = (color: string, alpha: number) => {
              if (color.startsWith('#')) {
                  const hexAlpha = Math.round(alpha * 255).toString(16).padStart(2, '0');
                  return `${color}${hexAlpha}`;
              }
              if (color.startsWith('rgb')) {
                  return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
              }
              return color;
          };

          gradient.addColorStop(0, addAlpha(accentColor, 0.4));
          gradient.addColorStop(1, addAlpha(accentColor, 0));
          return gradient;
        },
        fill: true,
        borderWidth: 4,
        pointRadius: window === '7d' ? 6 : 4,
        pointBackgroundColor: 'var(--theme-accent, #00C9FF)', // High vibrancy marker
        pointBorderColor: 'var(--theme-bg, #000)',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'var(--theme-accent, #00C9FF)',
        pointHoverBorderColor: 'var(--theme-text, #FFFFFF)',
        pointHoverBorderWidth: 2,
        tension: 0.4,
      }
    ];

    if (targetWeight) {
        datasets.push({
            label: 'Goal',
            data: entries.map(() => targetWeight),
            borderColor: 'var(--theme-neon-goal, rgba(237, 209, 85, 0.8))', // Use neon goal variable
            backgroundColor: 'transparent',
            borderWidth: 3,
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
    let dirColor = "var(--theme-text)";
    let icon = <Minus size={14} color="var(--theme-text)" />;

    if (totalChange < -0.1) {
        direction = "Losing";
        dirColor = "var(--theme-success)"; 
        icon = <TrendingDown size={14} color="var(--theme-success)" />;
    } else if (totalChange > 0.1) {
        direction = "Gaining";
        dirColor = "var(--theme-error)";
        icon = <TrendingUp size={14} color="var(--theme-error)" />;
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
          color: 'var(--theme-text)',
          font: { size: 12, weight: '800' }, // Hardened font weight
          boxWidth: 14,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'var(--theme-panel-base)',
        titleColor: 'var(--theme-text)',
        bodyColor: 'var(--theme-text)', // Hardened for legibility
        borderColor: 'var(--theme-accent)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      y: {
        grid: { color: 'var(--theme-border-dim, rgba(255,255,255,0.05))', drawBorder: false },
        ticks: { 
            color: 'var(--theme-text)', 
            font: { size: 11, weight: '900' }, // Contrast hardening for ticks
            padding: 8
        },
      },
      x: {
        grid: { display: false },
        ticks: { 
            color: 'var(--theme-text)', // Using full text color for x-axis in dark mode
            font: { size: 11, weight: '700' },
            padding: 8
        },
      },
    },
  };

  return (
    <div className="card" style={{ 
      background: 'var(--theme-panel)', 
      border: '1px solid var(--theme-border)', 
      borderRadius: '24px', 
      padding: '24px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <Scale size={18} color="var(--theme-accent)" /> Weight History Record
        </h3>
        <div style={{ display: 'flex', background: 'var(--theme-panel-dim)', borderRadius: '10px', padding: '4px', gap: '4px', border: '1px solid var(--theme-border)' }}>
          {(['7d', '30d', 'all'] as const).map(w => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              style={{
                background: window === w ? 'var(--theme-accent-dim, rgba(0,201,255,0.15))' : 'transparent',
                border: 'none',
                color: window === w ? 'var(--theme-accent, #00C9FF)' : 'var(--theme-text)',
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
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-dim)', fontSize: '13px', fontWeight: '600' }}>
                No weight data logged for this period.
            </div>
        )}
      </div>

      {trend && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--theme-border)', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'var(--theme-panel-dim)', 
            padding: '8px 16px', 
            borderRadius: '24px',
            border: `3px solid ${trend.dirColor}`, // Thicker border for contrast hardening
            boxShadow: `0 0 15px ${trend.dirColor}40`, // Luminous glow
          }}>
            {trend.icon}
            <span style={{ color: trend.dirColor, fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{trend.direction}</span>
          </div>
          
          <div style={{ 
            background: 'var(--theme-panel-dim)', 
            padding: '8px 16px', 
            borderRadius: '24px',
            fontSize: '11px',
            color: 'var(--theme-text)',
            fontWeight: '800',
            border: '1px solid var(--theme-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 15px var(--theme-accent-dim)' // luminous glow for variation
          }}>
            <span style={{ color: 'var(--theme-text)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '900' }}>Variation</span>
            <span style={{ color: 'var(--theme-accent)', fontSize: '15px', fontWeight: '900' }}>{trend.totalChange >= 0 ? '+' : ''}{trend.totalChange.toFixed(1)} <span style={{fontSize: '11px'}}>{unitWeight}</span></span>
          </div>
        </div>
      )}
    </div>
  );
};

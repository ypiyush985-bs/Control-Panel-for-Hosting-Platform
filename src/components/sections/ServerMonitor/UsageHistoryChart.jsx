import { useServer } from '../../../contexts/ServerContext';

const W = 500, H = 160, PAD = { top: 10, right: 10, bottom: 30, left: 36 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function toPoints(data, key) {
  if (data.length < 2) return '';
  return data.map((d, i) => {
    const x = PAD.left + (i / (data.length - 1)) * INNER_W;
    const y = PAD.top + INNER_H - (d[key] / 100) * INNER_H;
    return `${x},${y}`;
  }).join(' ');
}

/**
 * UsageHistoryChart — SVG line chart for CPU and RAM history.
 * Requirements: 8.6
 */
export default function UsageHistoryChart() {
  const { history } = useServer();
  const data = history.slice(-20);

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="card">
      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Usage History</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} aria-label="CPU and RAM usage history chart">
        {/* Y-axis grid + labels */}
        {yTicks.map((t) => {
          const y = PAD.top + INNER_H - (t / 100) * INNER_H;
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={PAD.left + INNER_W} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">{t}</text>
            </g>
          );
        })}

        {/* X-axis label */}
        <text x={PAD.left + INNER_W / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--text-muted)">Time →</text>

        {/* CPU line */}
        {data.length >= 2 && (
          <polyline
            points={toPoints(data, 'cpuPercent')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}

        {/* RAM line */}
        {data.length >= 2 && (
          <polyline
            points={toPoints(data, 'ramPercent')}
            fill="none"
            stroke="var(--status-warning)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.78rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 12, height: 3, background: 'var(--accent)', display: 'inline-block', borderRadius: 2 }} />
          CPU
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 12, height: 3, background: 'var(--status-warning)', display: 'inline-block', borderRadius: 2 }} />
          RAM
        </span>
      </div>
    </div>
  );
}

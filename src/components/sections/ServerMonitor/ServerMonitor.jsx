import { useServer }       from '../../../contexts/ServerContext';
import MetricCard          from './MetricCard';
import UptimeDisplay       from './UptimeDisplay';
import UsageHistoryChart   from './UsageHistoryChart';

/**
 * ServerMonitor section — CPU, RAM, disk metrics + history chart + uptime.
 * Requirements: 8.1–8.8
 */
export default function ServerMonitor() {
  const { metrics } = useServer();

  const cpuVariant  = metrics.cpuPercent  > 80 ? 'warning'  : 'normal';
  const ramVariant  = metrics.ramPercent  > 80 ? 'warning'  : 'normal';
  const diskVariant = metrics.diskPercent > 90 ? 'critical' : 'normal';

  return (
    <div className="section-page">
      <div className="section-page__header">
        <h2 className="section-page__title">Server Monitor</h2>
        {metrics.fetchError && (
          <span style={{ fontSize: '0.8rem', color: 'var(--status-warning)', background: 'rgba(245,158,11,0.1)', padding: '0.25rem 0.75rem', borderRadius: 999 }}>
            ⚠ Last poll failed — showing cached values
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <MetricCard label="CPU"  value={metrics.cpuPercent}  variant={cpuVariant} />
        <MetricCard label="RAM"  value={metrics.ramPercent}  variant={ramVariant} />
        <MetricCard label="Disk" value={metrics.diskPercent} variant={diskVariant} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
        <UsageHistoryChart />
        <UptimeDisplay />
      </div>
    </div>
  );
}

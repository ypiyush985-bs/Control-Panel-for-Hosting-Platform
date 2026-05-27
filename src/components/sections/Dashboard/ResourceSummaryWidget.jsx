import { useState, useEffect, useRef } from 'react';
import { useServer } from '../../../contexts/ServerContext';
import { formatDateTime } from '../../../utils/formatting';
import ProgressBar from '../../shared/ProgressBar';

function MetricRow({ label, value, variant }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{value}%</span>
      </div>
      <ProgressBar value={value} variant={variant} />
    </div>
  );
}

/**
 * ResourceSummaryWidget — shows CPU/RAM/disk with 30s refresh.
 * Requirements: 2.2, 2.5, 2.6
 */
export default function ResourceSummaryWidget() {
  const { metrics } = useServer();
  const [display, setDisplay] = useState(metrics);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [stale, setStale] = useState(false);

  // Refresh display every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      if (metrics.fetchError) {
        setStale(true);
      } else {
        setDisplay(metrics);
        setLastRefresh(new Date());
        setStale(false);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [metrics]);

  // Also update immediately when metrics change (from ServerContext 5s poll)
  const prevError = useRef(metrics.fetchError);
  useEffect(() => {
    if (!metrics.fetchError) {
      setDisplay(metrics);
      setLastRefresh(new Date());
      setStale(false);
    } else {
      setStale(true);
    }
    prevError.current = metrics.fetchError;
  }, [metrics]);

  const cpuVariant  = display.cpuPercent  > 80 ? 'warning'  : 'normal';
  const ramVariant  = display.ramPercent  > 80 ? 'warning'  : 'normal';
  const diskVariant = display.diskPercent > 90 ? 'critical' : 'normal';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Resource Usage</h3>
        {stale && (
          <span style={{ fontSize: '0.75rem', color: 'var(--status-warning)' }}>
            ⚠ Stale — last updated {formatDateTime(lastRefresh)}
          </span>
        )}
      </div>
      <MetricRow label="CPU"  value={display.cpuPercent}  variant={cpuVariant} />
      <MetricRow label="RAM"  value={display.ramPercent}  variant={ramVariant} />
      <MetricRow label="Disk" value={display.diskPercent} variant={diskVariant} />
    </div>
  );
}

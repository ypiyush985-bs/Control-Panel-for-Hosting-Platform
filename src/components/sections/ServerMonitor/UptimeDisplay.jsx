import { useServer }    from '../../../contexts/ServerContext';
import { formatUptime } from '../../../utils/formatting';

/**
 * UptimeDisplay — shows formatted server uptime.
 * Requirements: 8.7
 */
export default function UptimeDisplay() {
  const { uptimeSeconds } = useServer();
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '1.5rem' }}>⏱</span>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uptime</div>
        <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>{formatUptime(uptimeSeconds)}</div>
      </div>
    </div>
  );
}

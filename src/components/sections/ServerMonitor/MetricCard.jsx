import ProgressBar from '../../shared/ProgressBar';

/**
 * MetricCard — shows a single server metric with a progress bar.
 * Requirements: 8.1, 8.3–8.5
 */
export default function MetricCard({ label, value, variant }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.625rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-h)' }}>{value}%</span>
      </div>
      <ProgressBar value={value} variant={variant} />
    </div>
  );
}

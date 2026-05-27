import './ProgressBar.css';

/**
 * ProgressBar — displays a filled bar from 0–100%.
 * variant: 'normal' | 'warning' | 'critical'
 * Requirements: 8.1, 8.3, 8.4, 8.5
 */
export default function ProgressBar({ value, variant = 'normal' }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`progress-bar__fill progress-bar__fill--${variant}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

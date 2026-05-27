import { useState, useEffect, useCallback } from 'react';

const POLL_INTERVAL = 3000; // 3 seconds

const STATUS_COLORS = {
  Pending:   'var(--text-muted)',
  Running:   'var(--status-info)',
  Completed: 'var(--status-success)',
  Failed:    'var(--status-error)',
};

const STATUS_ICONS = {
  Pending:   '⏳',
  Running:   '⚙️',
  Completed: '✅',
  Failed:    '❌',
};

const STEP_ICONS = {
  pending: '○',
  running: '⚙',
  done:    '✓',
  error:   '✗',
};

const STEP_COLORS = {
  pending: 'var(--text-muted)',
  running: 'var(--status-info)',
  done:    'var(--status-success)',
  error:   'var(--status-error)',
};

function StepLog({ steps }) {
  if (!steps?.length) return null;
  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        Deployment Steps
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.85rem' }}>
            <span style={{ color: STEP_COLORS[step.status], fontWeight: 700, flexShrink: 0, width: 16, textAlign: 'center' }}>
              {STEP_ICONS[step.status]}
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{step.name}</span>
              {step.message && (
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{step.message}</span>
              )}
            </div>
            {step.timestamp && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                {new Date(step.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeploymentCard({ deployment, isActive }) {
  const color = STATUS_COLORS[deployment.status] ?? 'var(--text-muted)';
  const icon  = STATUS_ICONS[deployment.status]  ?? '?';

  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${color}`,
        opacity: isActive ? 1 : 0.85,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-h)' }}>
            {deployment.clientName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            🌐 {deployment.domain} &nbsp;·&nbsp; 🐳 {deployment.image}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <span style={{
            fontWeight: 700,
            fontSize: '0.875rem',
            color,
            background: `${color}18`,
            padding: '0.2rem 0.6rem',
            borderRadius: 999,
            border: `1px solid ${color}40`,
          }}>
            {deployment.status}
          </span>
        </div>
      </div>

      {deployment.errorMessage && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--notification-error-bg)',
          border: '1px solid var(--notification-error-border)',
          borderRadius: 6,
          fontSize: '0.8rem',
          color: 'var(--status-error)',
        }}>
          {deployment.errorMessage}
        </div>
      )}

      {isActive && <StepLog steps={deployment.steps} />}

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Started {new Date(deployment.createdAt).toLocaleString()}
        {deployment.updatedAt !== deployment.createdAt && (
          <> · Updated {new Date(deployment.updatedAt).toLocaleString()}</>
        )}
      </div>
    </div>
  );
}

/**
 * StatusDashboard — polls /api/status/:id for the active deployment,
 * and /api/deployments for the full history list.
 * Auto-updates without page refresh.
 */
export default function StatusDashboard({ activeDeploymentId, onNewDeploy }) {
  const [active, setActive]         = useState(null);
  const [history, setHistory]       = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pollError, setPollError]   = useState(null);

  // Fetch the active deployment status
  const fetchActive = useCallback(async () => {
    if (!activeDeploymentId) return;
    try {
      const res  = await fetch(`/api/status/${activeDeploymentId}`);
      const data = await res.json();
      if (res.ok) {
        setActive(data);
        setPollError(null);
      }
    } catch {
      setPollError('Could not reach the server.');
    }
  }, [activeDeploymentId]);

  // Fetch all deployments for the history list
  const fetchHistory = useCallback(async () => {
    try {
      const res  = await fetch('/api/deployments');
      const data = await res.json();
      if (res.ok) setHistory(data);
    } catch {
      // silently ignore history fetch errors
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Poll active deployment every 3s until terminal state
  useEffect(() => {
    fetchActive();
    fetchHistory();

    const isTerminal = active && ['Completed', 'Failed'].includes(active.status);
    if (isTerminal) return;

    const id = setInterval(() => {
      fetchActive();
      fetchHistory();
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, [fetchActive, fetchHistory, active?.status]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Active deployment */}
      {activeDeploymentId && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Deployment</h3>
            {pollError && (
              <span style={{ fontSize: '0.78rem', color: 'var(--status-warning)' }}>⚠ {pollError}</span>
            )}
          </div>
          {active ? (
            <DeploymentCard deployment={active} isActive />
          ) : (
            <div className="card" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</div>
          )}
        </div>
      )}

      {/* Deploy another button */}
      <div>
        <button className="btn btn--primary" onClick={onNewDeploy}>
          + Deploy Another Client
        </button>
      </div>

      {/* History */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Deployment History
        </h3>
        {loadingHistory ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No deployments yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((d) => (
              <DeploymentCard
                key={d.id}
                deployment={d}
                isActive={d.id === activeDeploymentId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

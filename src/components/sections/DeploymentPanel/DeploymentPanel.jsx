import { useState } from 'react';
import OnboardingForm  from './OnboardingForm';
import StatusDashboard from './StatusDashboard';

/**
 * DeploymentPanel — top-level section that toggles between
 * the onboarding form and the live status dashboard.
 */
export default function DeploymentPanel() {
  // null = show form; string = show dashboard for that deployment ID
  const [activeDeploymentId, setActiveDeploymentId] = useState(null);
  const [showForm, setShowForm] = useState(true);

  function handleDeployed(deploymentId) {
    setActiveDeploymentId(deploymentId);
    setShowForm(false);
  }

  function handleNewDeploy() {
    setShowForm(true);
  }

  return (
    <div className="section-page">
      <div className="section-page__header">
        <h2 className="section-page__title">🚀 Deployment Control Panel</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Docker · EC2 · Lambda
        </span>
      </div>

      {showForm ? (
        <OnboardingForm onDeployed={handleDeployed} />
      ) : (
        <StatusDashboard
          activeDeploymentId={activeDeploymentId}
          onNewDeploy={handleNewDeploy}
        />
      )}
    </div>
  );
}

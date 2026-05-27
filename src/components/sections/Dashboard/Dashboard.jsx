import SummaryCards from './SummaryCards';
import ResourceSummaryWidget from './ResourceSummaryWidget';
import QuickActions from './QuickActions';

/**
 * Dashboard section — overview of all resources.
 * Requirements: 2.1–2.6
 */
export default function Dashboard() {
  return (
    <div className="section-page">
      <div className="section-page__header">
        <h2 className="section-page__title">Dashboard</h2>
      </div>
      <SummaryCards />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <ResourceSummaryWidget />
        <QuickActions />
      </div>
    </div>
  );
}

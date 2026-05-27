import AddDomainForm from './AddDomainForm';
import DomainTable   from './DomainTable';

/**
 * DomainManager section.
 * Requirements: 3.1–3.8
 */
export default function DomainManager() {
  return (
    <div className="section-page">
      <div className="section-page__header">
        <h2 className="section-page__title">Domain Manager</h2>
      </div>
      <AddDomainForm />
      <DomainTable />
    </div>
  );
}

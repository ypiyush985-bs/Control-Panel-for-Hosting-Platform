import CreateDatabaseForm from './CreateDatabaseForm';
import DatabaseTable      from './DatabaseTable';

/**
 * DatabaseManager section.
 * Requirements: 5.1–5.10
 */
export default function DatabaseManager() {
  return (
    <div className="section-page">
      <div className="section-page__header">
        <h2 className="section-page__title">Database Manager</h2>
      </div>
      <CreateDatabaseForm />
      <DatabaseTable />
    </div>
  );
}

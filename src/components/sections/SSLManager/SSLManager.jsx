import SSLTable from './SSLTable';

/**
 * SSLManager section.
 * Requirements: 7.1–7.7
 */
export default function SSLManager() {
  return (
    <div className="section-page">
      <div className="section-page__header">
        <h2 className="section-page__title">SSL Manager</h2>
      </div>
      <SSLTable />
    </div>
  );
}

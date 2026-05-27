import CreateEmailForm from './CreateEmailForm';
import EmailTable      from './EmailTable';

/**
 * EmailManager section.
 * Requirements: 6.1–6.8
 */
export default function EmailManager() {
  return (
    <div className="section-page">
      <div className="section-page__header">
        <h2 className="section-page__title">Email Manager</h2>
      </div>
      <CreateEmailForm />
      <EmailTable />
    </div>
  );
}

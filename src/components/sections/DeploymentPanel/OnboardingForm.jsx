import { useState } from 'react';

/**
 * OnboardingForm — collects clientName, domain, image and submits to POST /api/deploy.
 * On success, calls onDeployed(deploymentId) so the parent can show the status dashboard.
 */
export default function OnboardingForm({ onDeployed }) {
  const [form, setForm]     = useState({ clientName: '', domain: '', image: 'nginx:latest' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setApiError(null);
  }

  function validate() {
    const errs = {};
    if (!form.clientName.trim()) errs.clientName = 'Client name is required.';
    if (!form.domain.trim())     errs.domain     = 'Domain is required.';
    else if (!/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(form.domain.trim()))
      errs.domain = 'Invalid domain (e.g. test.ourplatform.com).';
    if (!form.image.trim())      errs.image      = 'Docker image is required.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName.trim(),
          domain:     form.domain.trim().toLowerCase(),
          image:      form.image.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || 'Deployment request failed.');
        return;
      }

      onDeployed(data.deploymentId);
    } catch (err) {
      setApiError('Could not reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
        🚀 Onboard New Client
      </h3>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Client Name */}
          <div className="form-field">
            <label htmlFor="clientName">Client Name</label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              value={form.clientName}
              onChange={handleChange}
              placeholder="Acme Corp"
              aria-invalid={!!errors.clientName}
              aria-describedby={errors.clientName ? 'err-clientName' : undefined}
              disabled={loading}
            />
            {errors.clientName && (
              <span id="err-clientName" className="field-error" role="alert">{errors.clientName}</span>
            )}
          </div>

          {/* Domain */}
          <div className="form-field">
            <label htmlFor="domain">Domain</label>
            <input
              id="domain"
              name="domain"
              type="text"
              value={form.domain}
              onChange={handleChange}
              placeholder="test.ourplatform.com"
              aria-invalid={!!errors.domain}
              aria-describedby={errors.domain ? 'err-domain' : undefined}
              disabled={loading}
            />
            {errors.domain && (
              <span id="err-domain" className="field-error" role="alert">{errors.domain}</span>
            )}
          </div>

          {/* Docker Image */}
          <div className="form-field">
            <label htmlFor="image">Docker Image</label>
            <input
              id="image"
              name="image"
              type="text"
              value={form.image}
              onChange={handleChange}
              placeholder="nginx:latest"
              aria-invalid={!!errors.image}
              aria-describedby={errors.image ? 'err-image' : undefined}
              disabled={loading}
            />
            {errors.image && (
              <span id="err-image" className="field-error" role="alert">{errors.image}</span>
            )}
          </div>

          {/* API-level error */}
          {apiError && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--notification-error-bg)',
              border: '1px solid var(--notification-error-border)',
              borderRadius: 6,
              color: 'var(--status-error)',
              fontSize: '0.875rem',
            }} role="alert">
              {apiError}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
            style={{ alignSelf: 'flex-start', minWidth: 120 }}
          >
            {loading ? '⏳ Deploying…' : '🚀 Deploy'}
          </button>
        </div>
      </form>
    </div>
  );
}

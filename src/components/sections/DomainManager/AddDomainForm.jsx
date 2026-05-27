import { useState, useEffect, useRef } from 'react';
import { useDomains }       from '../../../contexts/DomainContext';
import { useNavigation }    from '../../../contexts/NavigationContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { validateDomainName } from '../../../utils/validation';

/**
 * AddDomainForm — controlled form to add a new domain.
 * Requirements: 3.2–3.4, 2.4
 */
export default function AddDomainForm() {
  const [value, setValue]   = useState('');
  const [error, setError]   = useState(null);
  const inputRef            = useRef(null);

  const { domains, addDomain }       = useDomains();
  const { pendingAction, clearPendingAction } = useNavigation();
  const { addNotification }          = useNotifications();

  // Auto-focus when navigated here via quick action
  useEffect(() => {
    if (pendingAction?.target === 'domains') {
      inputRef.current?.focus();
      clearPendingAction();
    }
  }, [pendingAction, clearPendingAction]);

  function handleChange(e) {
    setValue(e.target.value);
    if (error) setError(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();

    const validation = validateDomainName(trimmed);
    if (!validation.valid) { setError(validation.error); return; }

    const duplicate = domains.some((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) { setError('This domain already exists.'); return; }

    addDomain(trimmed);
    addNotification({ type: 'success', message: `Domain "${trimmed}" added successfully.` });
    setValue('');
    setError(null);
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.875rem' }}>Add Domain</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="domain-input">Domain Name</label>
            <input
              id="domain-input"
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              placeholder="example.com"
              aria-describedby={error ? 'domain-error' : undefined}
              aria-invalid={!!error}
            />
            {error && <span id="domain-error" className="field-error" role="alert">{error}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: error ? '1.4rem' : 0 }}>
            <button type="submit" className="btn btn--primary">Add Domain</button>
          </div>
        </div>
      </form>
    </div>
  );
}

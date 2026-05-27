import { useState, useEffect, useRef } from 'react';
import { useEmail }         from '../../../contexts/EmailContext';
import { useNavigation }    from '../../../contexts/NavigationContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { validateEmailAddress, validateEmailPassword } from '../../../utils/validation';

/**
 * CreateEmailForm — add a new email account.
 * Requirements: 6.2, 6.3, 2.4
 */
export default function CreateEmailForm() {
  const [address, setAddress]   = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});
  const inputRef = useRef(null);

  const { addEmail }                         = useEmail();
  const { pendingAction, clearPendingAction } = useNavigation();
  const { addNotification }                  = useNotifications();

  useEffect(() => {
    if (pendingAction?.target === 'email') {
      inputRef.current?.focus();
      clearPendingAction();
    }
  }, [pendingAction, clearPendingAction]);

  function handleSubmit(e) {
    e.preventDefault();
    const av = validateEmailAddress(address.trim());
    const pv = validateEmailPassword(password);
    const errs = {};
    if (!av.valid) errs.address  = av.error;
    if (!pv.valid) errs.password = pv.error;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    addEmail(address.trim());
    addNotification({ type: 'success', message: `Email account "${address.trim()}" created.` });
    setAddress(''); setPassword(''); setErrors({});
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.875rem' }}>Create Email Account</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="email-address-input">Email Address</label>
            <input
              id="email-address-input"
              ref={inputRef}
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setErrors({}); }}
              placeholder="user@example.com"
              aria-invalid={!!errors.address}
            />
            {errors.address && <span className="field-error" role="alert">{errors.address}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="email-password-input">Password</label>
            <input
              id="email-password-input"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
            />
            {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: Object.keys(errors).length ? '1.4rem' : 0 }}>
            <button type="submit" className="btn btn--primary">Create</button>
          </div>
        </div>
      </form>
    </div>
  );
}

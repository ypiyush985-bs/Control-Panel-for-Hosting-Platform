import { useState, useEffect, useRef } from 'react';
import { useDatabases }     from '../../../contexts/DatabaseContext';
import { useNavigation }    from '../../../contexts/NavigationContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { validateDatabaseName } from '../../../utils/validation';

/**
 * CreateDatabaseForm — add a new database.
 * Requirements: 5.2, 5.3, 5.9, 2.4
 */
export default function CreateDatabaseForm() {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const { databases, addDatabase }           = useDatabases();
  const { pendingAction, clearPendingAction } = useNavigation();
  const { addNotification }                  = useNotifications();

  useEffect(() => {
    if (pendingAction?.target === 'databases') {
      inputRef.current?.focus();
      clearPendingAction();
    }
  }, [pendingAction, clearPendingAction]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    const v = validateDatabaseName(trimmed);
    if (!v.valid) { setError(v.error); return; }
    if (databases.some((d) => d.name === trimmed)) { setError('Database name already exists.'); return; }
    addDatabase(trimmed);
    addNotification({ type: 'success', message: `Database "${trimmed}" created.` });
    setValue('');
    setError(null);
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.875rem' }}>Create Database</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="db-name-input">Database Name</label>
            <input
              id="db-name-input"
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              placeholder="my_database"
              aria-invalid={!!error}
              aria-describedby={error ? 'db-name-error' : undefined}
            />
            {error && <span id="db-name-error" className="field-error" role="alert">{error}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: error ? '1.4rem' : 0 }}>
            <button type="submit" className="btn btn--primary">Create</button>
          </div>
        </div>
      </form>
    </div>
  );
}

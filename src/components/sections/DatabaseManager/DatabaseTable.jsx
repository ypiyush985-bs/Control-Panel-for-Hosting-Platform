import { useState, useRef } from 'react';
import { useDatabases }     from '../../../contexts/DatabaseContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { validateDbUsername, validateDbPassword } from '../../../utils/validation';
import DataTable    from '../../shared/DataTable';
import ConfirmModal from '../../shared/ConfirmModal';

function CreateUserForm({ db }) {
  const { addDbUser }       = useDatabases();
  const { addNotification } = useNotifications();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const uv = validateDbUsername(username.trim());
    const pv = validateDbPassword(password);
    const errs = {};
    if (!uv.valid) errs.username = uv.error;
    if (!pv.valid) errs.password = pv.error;
    if (db.users.some((u) => u.username === username.trim())) errs.username = 'Username already exists on this database.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    addDbUser(db.id, username.trim());
    addNotification({ type: 'success', message: `User "${username.trim()}" added to "${db.name}".` });
    setUsername(''); setPassword(''); setErrors({});
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Add User</div>
      <div className="form-row">
        <div className="form-field" style={{ minWidth: 140 }}>
          <label htmlFor={`user-${db.id}`}>Username</label>
          <input id={`user-${db.id}`} value={username} onChange={(e) => { setUsername(e.target.value); setErrors({}); }} placeholder="db_user" />
          {errors.username && <span className="field-error" role="alert">{errors.username}</span>}
        </div>
        <div className="form-field" style={{ minWidth: 140 }}>
          <label htmlFor={`pass-${db.id}`}>Password</label>
          <input id={`pass-${db.id}`} type="password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors({}); }} placeholder="••••••••" />
          {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: Object.keys(errors).length ? '1.4rem' : 0 }}>
          <button type="submit" className="btn btn--primary btn--sm">Add User</button>
        </div>
      </div>
    </form>
  );
}

/**
 * DatabaseTable — list databases with expandable user management.
 * Requirements: 5.1, 5.4–5.8, 5.10
 */
export default function DatabaseTable() {
  const { databases, deleteDatabase } = useDatabases();
  const { addNotification }           = useNotifications();
  const [expanded, setExpanded]       = useState(null);
  const [confirmId, setConfirmId]     = useState(null);
  const triggerRefs = useRef({});

  const confirmDb = databases.find((d) => d.id === confirmId);

  function handleConfirm() {
    deleteDatabase(confirmId);
    addNotification({ type: 'success', message: `Database "${confirmDb?.name}" deleted.` });
    setConfirmId(null);
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <DataTable>
        <thead>
          <tr>
            <th>Name</th>
            <th>Size (MB)</th>
            <th>Users</th>
            <th style={{ width: 120 }}></th>
          </tr>
        </thead>
        <tbody>
          {databases.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No databases.</td></tr>
          ) : databases.map((db) => {
            if (!triggerRefs.current[db.id]) triggerRefs.current[db.id] = { current: null };
            return (
              <>
                <tr key={db.id}>
                  <td style={{ fontWeight: 500 }}>
                    <button
                      className="btn btn--sm"
                      style={{ marginRight: '0.5rem', padding: '0.1rem 0.4rem' }}
                      onClick={() => setExpanded(expanded === db.id ? null : db.id)}
                      aria-expanded={expanded === db.id}
                      aria-label={`${expanded === db.id ? 'Collapse' : 'Expand'} ${db.name}`}
                    >
                      {expanded === db.id ? '▾' : '▸'}
                    </button>
                    {db.name}
                  </td>
                  <td>{db.sizeMB}</td>
                  <td>{db.users.length}</td>
                  <td>
                    <button
                      ref={(el) => { triggerRefs.current[db.id] = { current: el }; }}
                      className="btn btn--danger btn--sm"
                      onClick={() => setConfirmId(db.id)}
                      aria-label={`Delete database ${db.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {expanded === db.id && (
                  <tr key={`${db.id}-expand`}>
                    <td colSpan={4} style={{ padding: 0 }}>
                      {db.users.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-secondary)' }}>
                          <thead>
                            <tr>
                              <th style={{ paddingLeft: '2rem' }}>Username</th>
                            </tr>
                          </thead>
                          <tbody>
                            {db.users.map((u) => (
                              <tr key={u.id}>
                                <td style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>👤 {u.username}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      <CreateUserForm db={db} />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </DataTable>

      {confirmId && confirmDb && (
        <ConfirmModal
          title="Delete Database"
          body={`Delete "${confirmDb.name}" and all its users? This cannot be undone.`}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmId(null)}
          triggerRef={triggerRefs.current[confirmId]}
        />
      )}
    </div>
  );
}

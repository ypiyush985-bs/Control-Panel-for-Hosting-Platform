import { useState, useRef } from 'react';
import { useEmail }         from '../../../contexts/EmailContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import DataTable    from '../../shared/DataTable';
import SearchInput  from '../../shared/SearchInput';
import ConfirmModal from '../../shared/ConfirmModal';

/**
 * EmailTable + EmailSearch — filterable table with suspend/activate/delete.
 * Requirements: 6.1, 6.4–6.8
 */
export default function EmailTable() {
  const { emailAccounts, deleteEmail, suspendEmail, activateEmail } = useEmail();
  const { addNotification } = useNotifications();
  const [search, setSearch]     = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const triggerRefs = useRef({});

  const filtered = emailAccounts.filter((e) =>
    e.address.toLowerCase().includes(search.toLowerCase())
  );

  const confirmAccount = emailAccounts.find((e) => e.id === confirmId);

  function handleDelete() {
    deleteEmail(confirmId);
    addNotification({ type: 'success', message: `Email account "${confirmAccount?.address}" deleted.` });
    setConfirmId(null);
  }

  function handleToggle(account) {
    if (account.status === 'Active') {
      suspendEmail(account.id);
      addNotification({ type: 'success', message: `"${account.address}" suspended.` });
    } else {
      activateEmail(account.id);
      addNotification({ type: 'success', message: `"${account.address}" activated.` });
    }
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search email accounts…" />
      </div>
      <DataTable>
        <thead>
          <tr>
            <th>Address</th>
            <th>Domain</th>
            <th>Quota (MB)</th>
            <th>Status</th>
            <th style={{ width: 160 }}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No accounts found.</td></tr>
          ) : filtered.map((em) => {
            if (!triggerRefs.current[em.id]) triggerRefs.current[em.id] = { current: null };
            const isActive = em.status === 'Active';
            return (
              <tr key={em.id}>
                <td style={{ fontWeight: 500 }}>{em.address}</td>
                <td>{em.domain}</td>
                <td>{em.quotaMB}</td>
                <td>
                  <span className={`badge badge--${isActive ? 'active' : 'suspended'}`}>{em.status}</span>
                </td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className={`btn btn--sm ${isActive ? '' : 'btn--primary'}`}
                    onClick={() => handleToggle(em)}
                    aria-label={`${isActive ? 'Suspend' : 'Activate'} ${em.address}`}
                  >
                    {isActive ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    ref={(el) => { triggerRefs.current[em.id] = { current: el }; }}
                    className="btn btn--danger btn--sm"
                    onClick={() => setConfirmId(em.id)}
                    aria-label={`Delete ${em.address}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      {confirmId && confirmAccount && (
        <ConfirmModal
          title="Delete Email Account"
          body={`Delete "${confirmAccount.address}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          triggerRef={triggerRefs.current[confirmId]}
        />
      )}
    </div>
  );
}

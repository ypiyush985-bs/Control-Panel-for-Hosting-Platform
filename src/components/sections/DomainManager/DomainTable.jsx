import { useState, useRef } from 'react';
import { useDomains }       from '../../../contexts/DomainContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { formatDate }       from '../../../utils/formatting';
import DataTable            from '../../shared/DataTable';
import ConfirmModal         from '../../shared/ConfirmModal';
import SearchInput          from '../../shared/SearchInput';

/**
 * DomainTable + DomainSearch — filterable table with delete confirmation.
 * Requirements: 3.1, 3.5–3.8, 11.4
 */
export default function DomainTable() {
  const { domains, deleteDomain } = useDomains();
  const { addNotification }       = useNotifications();
  const [search, setSearch]       = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const triggerRefs               = useRef({});

  const filtered = domains.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const confirmDomain = domains.find((d) => d.id === confirmId);

  function handleDeleteClick(id) {
    setConfirmId(id);
  }

  function handleConfirm() {
    deleteDomain(confirmId);
    addNotification({ type: 'success', message: `Domain "${confirmDomain?.name}" deleted.` });
    setConfirmId(null);
  }

  function handleCancel() {
    setConfirmId(null);
  }

  function statusBadge(status) {
    const cls = status === 'Active' ? 'badge badge--active'
              : status === 'Parked' ? 'badge badge--parked'
              : 'badge badge--warning';
    return <span className={cls}>{status}</span>;
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search domains…" />
      </div>
      <DataTable>
        <thead>
          <tr>
            <th>Domain Name</th>
            <th>Status</th>
            <th>Created</th>
            <th style={{ width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No domains found.</td></tr>
          ) : filtered.map((d) => {
            if (!triggerRefs.current[d.id]) triggerRefs.current[d.id] = { current: null };
            return (
              <tr key={d.id}>
                <td style={{ fontWeight: 500 }}>{d.name}</td>
                <td>{statusBadge(d.status)}</td>
                <td>{formatDate(d.createdAt)}</td>
                <td>
                  <button
                    ref={(el) => { triggerRefs.current[d.id] = { current: el }; }}
                    className="btn btn--danger btn--sm"
                    onClick={() => handleDeleteClick(d.id)}
                    aria-label={`Delete domain ${d.name}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      {confirmId && confirmDomain && (
        <ConfirmModal
          title="Delete Domain"
          body={`Are you sure you want to delete "${confirmDomain.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          triggerRef={triggerRefs.current[confirmId]}
        />
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import { useSSL }           from '../../../contexts/SSLContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { isExpiringSoon }   from '../../../utils/ssl';
import { formatDate }       from '../../../utils/formatting';
import DataTable    from '../../shared/DataTable';
import ConfirmModal from '../../shared/ConfirmModal';

/**
 * SSLTable — SSL certificate management per domain.
 * Requirements: 7.1–7.7
 */
export default function SSLTable() {
  const { sslRecords, installSSL, renewSSL, revokeSSL } = useSSL();
  const { addNotification } = useNotifications();
  const [revokeId, setRevokeId] = useState(null);
  const triggerRefs = useRef({});

  const revokeRecord = sslRecords.find((r) => r.domainId === revokeId);

  function handleInstall(domainId, domainName) {
    installSSL(domainId);
    addNotification({ type: 'success', message: `SSL installed for "${domainName}".` });
  }

  function handleRenew(domainId, domainName) {
    renewSSL(domainId);
    addNotification({ type: 'success', message: `SSL renewed for "${domainName}".` });
  }

  function handleRevoke() {
    revokeSSL(revokeId);
    addNotification({ type: 'success', message: `SSL revoked for "${revokeRecord?.domainName}".` });
    setRevokeId(null);
  }

  function getRowStyle(record) {
    if (record.status === 'Expired') return { background: 'rgba(239,68,68,0.06)' };
    if (record.status === 'Active' && isExpiringSoon(record.expiresAt)) return { background: 'rgba(245,158,11,0.06)' };
    return {};
  }

  function statusBadge(record) {
    if (record.status === 'None')    return <span className="badge badge--none">None</span>;
    if (record.status === 'Expired') return <span className="badge badge--expired">Expired</span>;
    if (isExpiringSoon(record.expiresAt)) return <span className="badge badge--warning">Expiring Soon</span>;
    return <span className="badge badge--active">Active</span>;
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <DataTable>
        <thead>
          <tr>
            <th>Domain</th>
            <th>Status</th>
            <th>Expires</th>
            <th>Issuer</th>
            <th style={{ width: 200 }}></th>
          </tr>
        </thead>
        <tbody>
          {sslRecords.map((r) => {
            if (!triggerRefs.current[r.domainId]) triggerRefs.current[r.domainId] = { current: null };
            return (
              <tr key={r.domainId} style={getRowStyle(r)}>
                <td style={{ fontWeight: 500 }}>{r.domainName}</td>
                <td>{statusBadge(r)}</td>
                <td>{r.expiresAt ? formatDate(r.expiresAt) : '—'}</td>
                <td>{r.issuer ?? '—'}</td>
                <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {r.status === 'None' && (
                    <button className="btn btn--primary btn--sm" onClick={() => handleInstall(r.domainId, r.domainName)}>
                      Install SSL
                    </button>
                  )}
                  {(r.status === 'Active' || r.status === 'Expired') && (
                    <button className="btn btn--sm" onClick={() => handleRenew(r.domainId, r.domainName)}>
                      Renew
                    </button>
                  )}
                  {r.status === 'Active' && (
                    <button
                      ref={(el) => { triggerRefs.current[r.domainId] = { current: el }; }}
                      className="btn btn--danger btn--sm"
                      onClick={() => setRevokeId(r.domainId)}
                      aria-label={`Revoke SSL for ${r.domainName}`}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      {revokeId && revokeRecord && (
        <ConfirmModal
          title="Revoke SSL Certificate"
          body={`Revoke the SSL certificate for "${revokeRecord.domainName}"? The domain will no longer have HTTPS.`}
          confirmLabel="Revoke"
          onConfirm={handleRevoke}
          onCancel={() => setRevokeId(null)}
          triggerRef={triggerRefs.current[revokeId]}
        />
      )}
    </div>
  );
}

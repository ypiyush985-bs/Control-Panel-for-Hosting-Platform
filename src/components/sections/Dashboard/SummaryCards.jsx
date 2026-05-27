import { useDomains }    from '../../../contexts/DomainContext';
import { useDatabases }  from '../../../contexts/DatabaseContext';
import { useEmail }      from '../../../contexts/EmailContext';
import { useSSL }        from '../../../contexts/SSLContext';
import { isExpiringSoon } from '../../../utils/ssl';

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ flex: '1 1 180px', minWidth: 0 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color ?? 'var(--text-h)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{sub}</div>}
    </div>
  );
}

/**
 * SummaryCards — 4 stat cards for domains, databases, email, SSL.
 * Requirements: 2.1
 */
export default function SummaryCards() {
  const { domains }       = useDomains();
  const { databases }     = useDatabases();
  const { emailAccounts } = useEmail();
  const { sslRecords }    = useSSL();

  const activeDomains = domains.filter((d) => d.status === 'Active').length;

  const sslValid      = sslRecords.filter((r) => r.status === 'Active' && !isExpiringSoon(r.expiresAt)).length;
  const sslExpiring   = sslRecords.filter((r) => r.status === 'Active' && isExpiringSoon(r.expiresAt)).length;
  const sslExpired    = sslRecords.filter((r) => r.status === 'Expired').length;

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <StatCard label="Active Domains"   value={activeDomains}        sub={`${domains.length} total`} />
      <StatCard label="Databases"        value={databases.length}     sub={`${databases.reduce((s, d) => s + d.users.length, 0)} users`} />
      <StatCard label="Email Accounts"   value={emailAccounts.length} sub={`${emailAccounts.filter(e => e.status === 'Active').length} active`} />
      <StatCard
        label="SSL Certificates"
        value={sslValid}
        color={sslExpired > 0 ? 'var(--status-error)' : sslExpiring > 0 ? 'var(--status-warning)' : undefined}
        sub={`${sslExpiring} expiring · ${sslExpired} expired`}
      />
    </div>
  );
}

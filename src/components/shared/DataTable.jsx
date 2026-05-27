/**
 * DataTable — wraps a <table> in a horizontally-scrollable container.
 * Requirements: 3.8, 6.8, 12.5
 */
export default function DataTable({ children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  );
}

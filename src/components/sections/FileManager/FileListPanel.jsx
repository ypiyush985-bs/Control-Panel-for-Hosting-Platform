import { useState, useRef } from 'react';
import { useNotifications } from '../../../contexts/NotificationContext';
import { formatFileSize, formatDateTime } from '../../../utils/formatting';
import { validateFilename } from '../../../utils/validation';
import DataTable   from '../../shared/DataTable';
import ConfirmModal from '../../shared/ConfirmModal';

/**
 * FileListPanel — shows files in selected directory with rename/delete.
 * Requirements: 4.2–4.8, 4.12
 */
export default function FileListPanel({ nodes, onUpdate }) {
  const { addNotification }   = useNotifications();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const triggerRefs = useRef({});

  const files = nodes?.filter((n) => n.type === 'file') ?? [];
  const deleteTarget = files.find((f) => f.id === deleteId);

  function startRename(node) {
    setRenamingId(node.id);
    setRenameValue(node.name);
    setRenameError(null);
  }

  function submitRename(node) {
    const v = validateFilename(renameValue.trim());
    if (!v.valid) { setRenameError(v.error); return; }
    onUpdate(nodes.map((n) => n.id === node.id ? { ...n, name: renameValue.trim() } : n));
    addNotification({ type: 'success', message: `Renamed to "${renameValue.trim()}".` });
    setRenamingId(null);
  }

  function handleDelete() {
    onUpdate(nodes.filter((n) => n.id !== deleteId));
    addNotification({ type: 'success', message: `"${deleteTarget?.name}" deleted.` });
    setDeleteId(null);
  }

  if (!nodes || files.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Select a directory to view files.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <DataTable>
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Modified</th>
            <th style={{ width: 140 }}></th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => {
            if (!triggerRefs.current[f.id]) triggerRefs.current[f.id] = { current: null };
            return (
              <tr key={f.id}>
                <td>
                  {renamingId === f.id ? (
                    <div>
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => { setRenameValue(e.target.value); setRenameError(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitRename(f); if (e.key === 'Escape') setRenamingId(null); }}
                        style={{ width: '100%' }}
                        aria-label="New filename"
                      />
                      {renameError && <span className="field-error" role="alert">{renameError}</span>}
                    </div>
                  ) : (
                    <span>📄 {f.name}</span>
                  )}
                </td>
                <td>{formatFileSize(f.sizeBytes)}</td>
                <td>{formatDateTime(f.modifiedAt)}</td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  {renamingId === f.id ? (
                    <>
                      <button className="btn btn--primary btn--sm" onClick={() => submitRename(f)}>Save</button>
                      <button className="btn btn--sm" onClick={() => setRenamingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn--sm" onClick={() => startRename(f)}>Rename</button>
                      <button
                        ref={(el) => { triggerRefs.current[f.id] = { current: el }; }}
                        className="btn btn--danger btn--sm"
                        onClick={() => setDeleteId(f.id)}
                        aria-label={`Delete ${f.name}`}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      {deleteId && deleteTarget && (
        <ConfirmModal
          title="Delete File"
          body={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          triggerRef={triggerRefs.current[deleteId]}
        />
      )}
    </div>
  );
}

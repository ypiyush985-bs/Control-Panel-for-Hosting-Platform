import { useState, useRef } from 'react';
import { useNotifications } from '../../../contexts/NotificationContext';
import ProgressBar from '../../shared/ProgressBar';

const MAX_BYTES = 524_288_000; // 500 MB
const CHUNK     = 2 * 1024 * 1024; // ~2 MB per tick
const TICK_MS   = 200;

/**
 * UploadZone — drag-and-drop + file input with simulated progress.
 * Requirements: 4.9–4.12
 */
export default function UploadZone({ onFileAdded }) {
  const { addNotification } = useNotifications();
  const [dragging, setDragging]   = useState(false);
  const [uploads, setUploads]     = useState([]);
  const [sizeError, setSizeError] = useState(null);
  const inputRef = useRef(null);

  function startUpload(file) {
    if (file.size > MAX_BYTES) {
      setSizeError(`"${file.name}" exceeds 500 MB limit.`);
      return;
    }
    setSizeError(null);

    const id = crypto.randomUUID();
    setUploads((prev) => [...prev, { id, name: file.name, size: file.size, uploaded: 0, done: false }]);

    const interval = setInterval(() => {
      setUploads((prev) => prev.map((u) => {
        if (u.id !== id) return u;
        const next = Math.min(u.uploaded + CHUNK, u.size);
        if (next >= u.size) {
          clearInterval(interval);
          addNotification({ type: 'success', message: `"${file.name}" uploaded successfully.` });
          onFileAdded?.({
            id: crypto.randomUUID(),
            name: file.name,
            type: 'file',
            sizeBytes: file.size,
            modifiedAt: new Date(),
            children: [],
          });
          return { ...u, uploaded: u.size, done: true };
        }
        return { ...u, uploaded: next };
      }));
    }, TICK_MS);
  }

  function handleFiles(fileList) {
    Array.from(fileList).forEach(startUpload);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const activeUploads = uploads.filter((u) => !u.done);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 8,
          padding: '1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'var(--accent-bg)' : 'transparent',
          transition: 'all 150ms ease',
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
        }}
        role="button"
        aria-label="Upload files — click or drag and drop"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        📤 Click or drag files here to upload (max 500 MB each)
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {sizeError && <p className="field-error" role="alert" style={{ marginTop: '0.5rem' }}>{sizeError}</p>}

      {activeUploads.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {activeUploads.map((u) => (
            <div key={u.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span>{u.name}</span>
                <span>{Math.round((u.uploaded / u.size) * 100)}%</span>
              </div>
              <ProgressBar value={Math.round((u.uploaded / u.size) * 100)} variant="normal" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

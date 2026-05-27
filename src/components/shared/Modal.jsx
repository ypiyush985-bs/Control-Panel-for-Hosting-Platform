import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

/**
 * useFocusTrap — traps keyboard focus inside `containerRef`.
 * Closes on Escape. Returns focus to `triggerRef` on close.
 */
function useFocusTrap(containerRef, onClose) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, onClose]);
}

/**
 * Modal — accessible dialog rendered via portal.
 * Props: title, body, confirmLabel, cancelLabel, onConfirm, onCancel,
 *        variant ('danger' | 'info'), triggerRef
 * Requirements: 3.5–3.7, 4.7–4.8, 5.4–5.5, 6.6–6.7, 7.6–7.7, 11.3, 11.4
 */
export default function Modal({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
  triggerRef,
}) {
  const containerRef = useRef(null);

  function handleClose() {
    onCancel?.();
    // Return focus to the element that opened the modal
    setTimeout(() => triggerRef?.current?.focus(), 0);
  }

  function handleConfirm() {
    onConfirm?.();
    setTimeout(() => triggerRef?.current?.focus(), 0);
  }

  useFocusTrap(containerRef, handleClose);

  const confirmClass =
    variant === 'danger' ? 'modal__btn modal__btn--danger' : 'modal__btn modal__btn--confirm';

  return ReactDOM.createPortal(
    <div className="modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div
        ref={containerRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-body"
      >
        <h2 id="modal-title" className="modal__title">{title}</h2>
        <p id="modal-body" className="modal__body">{body}</p>
        <div className="modal__actions">
          <button className="modal__btn" onClick={handleClose}>{cancelLabel}</button>
          <button className={confirmClass} onClick={handleConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

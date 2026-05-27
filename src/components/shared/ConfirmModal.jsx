import Modal from './Modal';

/**
 * ConfirmModal — convenience wrapper around Modal with variant="danger".
 * Requirements: 3.5–3.7, 4.7–4.8, 5.4–5.5, 6.6–6.7, 7.6–7.7
 */
export default function ConfirmModal({
  title,
  body,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  triggerRef,
}) {
  return (
    <Modal
      title={title}
      body={body}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      onCancel={onCancel}
      variant="danger"
      triggerRef={triggerRef}
    />
  );
}

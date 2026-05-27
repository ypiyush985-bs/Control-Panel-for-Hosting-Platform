import { createContext, useContext, useState } from 'react';

/**
 * @typedef {{ title: string, body: string, confirmLabel: string, cancelLabel: string, variant: 'danger' | 'info', onConfirm: () => void, onCancel: () => void }} ModalConfig
 */

/**
 * @typedef {{ modal: ModalConfig | null, openModal: (config: ModalConfig) => void, closeModal: () => void }} ModalContextValue
 */

const ModalContext = createContext(null);

/**
 * ModalProvider manages a single modal slot.
 * Only one modal can be open at a time; opening a new one replaces any existing one.
 *
 * Requirements: 3.5, 4.7, 5.4, 6.6, 7.6
 */
export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  /**
   * Open a modal with the given configuration.
   * @param {ModalConfig} config
   */
  function openModal(config) {
    setModal(config);
  }

  /**
   * Close the currently open modal, clearing the modal state.
   */
  function closeModal() {
    setModal(null);
  }

  return (
    <ModalContext.Provider value={{ modal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

/**
 * Hook to consume ModalContext.
 * Must be used inside a ModalProvider.
 */
export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
}

export default ModalContext;

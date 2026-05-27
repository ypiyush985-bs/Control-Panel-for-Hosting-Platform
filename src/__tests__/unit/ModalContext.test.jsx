import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ModalProvider, useModal } from '../../contexts/ModalContext';

const wrapper = ({ children }) => <ModalProvider>{children}</ModalProvider>;

/** Helper to build a minimal ModalConfig */
function makeConfig(overrides = {}) {
  return {
    title: 'Confirm',
    body: 'Are you sure?',
    confirmLabel: 'Yes',
    cancelLabel: 'No',
    variant: 'danger',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
}

describe('ModalContext', () => {
  it('initialises modal to null', () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    expect(result.current.modal).toBeNull();
  });

  it('openModal sets the modal config', () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    const config = makeConfig();

    act(() => {
      result.current.openModal(config);
    });

    expect(result.current.modal).toEqual(config);
  });

  it('closeModal resets modal to null', () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    const config = makeConfig();

    act(() => {
      result.current.openModal(config);
    });
    expect(result.current.modal).not.toBeNull();

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.modal).toBeNull();
  });

  it('openModal replaces an existing modal', () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    const first = makeConfig({ title: 'First' });
    const second = makeConfig({ title: 'Second' });

    act(() => {
      result.current.openModal(first);
    });
    expect(result.current.modal.title).toBe('First');

    act(() => {
      result.current.openModal(second);
    });
    expect(result.current.modal.title).toBe('Second');
  });

  it('modal config preserves all ModalConfig fields', () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const config = {
      title: 'Delete domain',
      body: 'This will permanently remove example.com.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm,
      onCancel,
    };

    act(() => {
      result.current.openModal(config);
    });

    const { modal } = result.current;
    expect(modal.title).toBe('Delete domain');
    expect(modal.body).toBe('This will permanently remove example.com.');
    expect(modal.confirmLabel).toBe('Delete');
    expect(modal.cancelLabel).toBe('Cancel');
    expect(modal.variant).toBe('danger');
    expect(modal.onConfirm).toBe(onConfirm);
    expect(modal.onCancel).toBe(onCancel);
  });

  it('supports variant "info"', () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    const config = makeConfig({ variant: 'info' });

    act(() => {
      result.current.openModal(config);
    });

    expect(result.current.modal.variant).toBe('info');
  });

  it('closeModal is idempotent when no modal is open', () => {
    const { result } = renderHook(() => useModal(), { wrapper });

    // Should not throw when called with no modal open
    act(() => {
      result.current.closeModal();
    });

    expect(result.current.modal).toBeNull();
  });

  it('useModal throws when used outside ModalProvider', () => {
    const consoleError = console.error;
    console.error = () => {};

    expect(() => renderHook(() => useModal())).toThrow(
      'useModal must be used within a ModalProvider'
    );

    console.error = consoleError;
  });
});

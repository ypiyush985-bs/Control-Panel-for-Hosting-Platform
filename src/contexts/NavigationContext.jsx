import { createContext, useContext, useState } from 'react';

/**
 * @typedef {'dashboard' | 'domains' | 'files' | 'databases' | 'email' | 'ssl' | 'server'} SectionId
 */

/**
 * @typedef {{ type: 'open-create-form', target: SectionId }} PendingAction
 */

/**
 * @typedef {{ activeSection: SectionId, pendingAction: PendingAction | null, navigateTo: (sectionId: SectionId) => void, clearPendingAction: () => void }} NavigationContextValue
 */

const NavigationContext = createContext(null);

/**
 * NavigationProvider manages the active section and any pending action
 * (e.g. a quick-action shortcut that should auto-open a creation form).
 *
 * Requirements: 1.3, 2.4
 */
export function NavigationProvider({ children }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pendingAction, setPendingAction] = useState(null);

  /**
   * Navigate to a section, optionally carrying a pending action.
   * @param {SectionId} sectionId
   * @param {PendingAction | null} [action]
   */
  function navigateTo(sectionId, action = null) {
    setActiveSection(sectionId);
    setPendingAction(action);
  }

  /**
   * Clear the pending action once the target section has consumed it.
   */
  function clearPendingAction() {
    setPendingAction(null);
  }

  return (
    <NavigationContext.Provider
      value={{ activeSection, pendingAction, navigateTo, clearPendingAction }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to consume NavigationContext.
 * Must be used inside a NavigationProvider.
 */
export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
}

export default NavigationContext;

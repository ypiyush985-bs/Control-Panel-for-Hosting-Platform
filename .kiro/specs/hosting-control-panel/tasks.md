# Implementation Plan: Hosting Control Panel

## Overview

Build a React 19 + Vite single-page hosting control panel with eight navigable sections (Dashboard, Domains, File Manager, Databases, Email, SSL, Server Monitor), a global notification system, a modal system, and a light/dark theme. All data is simulated in-memory; navigation is driven by React state. Implementation follows a foundation-first order: project setup → core infrastructure → app shell → feature sections → tests.

## Tasks

- [x] 1. Project setup and foundation
  - [x] 1.1 Install test dependencies and configure Vitest
    - Run `npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom fast-check jsdom`
    - Add `"test": "vitest --run"` script to `package.json`
    - Create `vitest.config.js` (or extend `vite.config.js`) with `environment: 'jsdom'` and `setupFiles: ['./src/__tests__/setup.js']`
    - Create `src/__tests__/setup.js` importing `@testing-library/jest-dom`
    - _Requirements: Design — Testing Strategy_

  - [x] 1.2 Create folder structure and CSS token file
    - Create directories: `src/contexts/`, `src/components/shell/`, `src/components/shared/`, `src/components/sections/`, `src/utils/`, `src/data/`, `src/styles/`, `src/__tests__/unit/`, `src/__tests__/property/`
    - Create `src/styles/hcp-tokens.css` with all CSS custom properties from the design (layout, status colors, progress bar variants, notification, SSL badges, sidebar, card, transitions, dark-theme overrides)
    - Import `src/styles/hcp-tokens.css` in `src/main.jsx`
    - _Requirements: 9.4, 9.5, 12.4; Design — CSS Architecture_

- [x] 2. Core infrastructure — utility functions
  - [x] 2.1 Implement validation utility functions
    - Create `src/utils/validation.js` exporting: `validateDomainName`, `validateDatabaseName`, `validateDbUsername`, `validateDbPassword`, `validateEmailAddress`, `validateEmailPassword`, `validateFilename`
    - Each function returns `{ valid: boolean, error: string | null }`
    - Use exact regex patterns from requirements (domain: `^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$`, database: `^[a-zA-Z][a-zA-Z0-9_]{0,63}$`, dbUser: `^[a-zA-Z][a-zA-Z0-9_]{0,31}$`, email: `^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`, filename: `[a-zA-Z0-9._\-\s]`)
    - _Requirements: 3.3, 3.4, 4.5, 4.6, 5.2, 5.3, 5.7, 5.8, 6.2, 6.3_

  - [x] 2.2 Implement formatting utility functions
    - Create `src/utils/formatting.js` exporting: `formatDate(date)` → `DD MMM YYYY`, `formatDateTime(date)` → `DD MMM YYYY HH:MM`, `formatFileSize(bytes)` → KB or MB string, `formatUptime(seconds)` → `"X days, Y hours, Z minutes"`
    - `formatFileSize`: use KB (1 decimal) if `bytes < 1_048_576`, else MB (1 decimal)
    - `formatUptime`: days = `floor(s/86400)`, hours = `floor((s%86400)/3600)`, minutes = `floor((s%3600)/60)`
    - _Requirements: 3.1, 4.3, 8.7_

  - [x] 2.3 Implement SSL utility functions
    - Create `src/utils/ssl.js` exporting: `isExpiringSoon(expiresAt)` → true if within 30 days, `computeSSLExpiry()` → Date 365 days from now
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 2.4 Implement notification queue utility
    - Create `src/utils/notifications.js` exporting: `addNotificationToQueue(queue, newItem)` → returns new array with cap of 5, evicting oldest when over limit
    - _Requirements: 10.6, 10.7_

  - [x] 2.5 Implement theme resolution utility
    - Create `src/utils/theme.js` exporting: `resolveInitialTheme()` → reads `localStorage['hcp-theme']`; if valid (`'light'`/`'dark'`) returns it; else returns `'dark'` if `prefers-color-scheme: dark`, else `'light'`
    - _Requirements: 9.1, 9.7, 9.8_

- [ ] 3. Core infrastructure — mock data and contexts
  - [x] 3.1 Create mock data module
    - Create `src/data/mockData.js` exporting: `MOCK_DOMAINS` (3 entries, mixed statuses), `MOCK_DATABASES` (3–4 with users), `MOCK_EMAIL_ACCOUNTS` (4–5 entries), `MOCK_SSL_RECORDS` (one per domain, mixed statuses including one expiring soon), `MOCK_FILE_TREE` (nested `FileNode` tree from root `/`)
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

  - [x] 3.2 Implement NavigationContext
    - Create `src/contexts/NavigationContext.jsx` with `NavigationProvider` managing `activeSection` (initial: `'dashboard'`) and `pendingAction` (initial: `null`)
    - Export `useNavigation` hook; expose `navigateTo(sectionId)` and `clearPendingAction()`
    - _Requirements: 1.3, 2.4_

  - [x] 3.3 Implement ThemeContext
    - Create `src/contexts/ThemeContext.jsx` with `ThemeProvider` calling `resolveInitialTheme()` on mount
    - `useEffect` to set `document.documentElement.setAttribute('data-theme', theme)` and `localStorage.setItem('hcp-theme', theme)` on every theme change
    - Export `useTheme` hook; expose `toggleTheme()`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 3.4 Implement NotificationContext
    - Create `src/contexts/NotificationContext.jsx` with `NotificationProvider` using `useReducer` and the `addNotificationToQueue` utility
    - Reducer handles `ADD` (enforces 5-cap via utility) and `DISMISS` actions
    - Export `useNotifications` hook; expose `addNotification({ type, message })` and `dismissNotification(id)`
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7_

  - [-] 3.5 Implement ModalContext
    - Create `src/contexts/ModalContext.jsx` with `ModalProvider` managing `modal: ModalConfig | null`
    - Export `useModal` hook; expose `openModal(config)` and `closeModal()`
    - _Requirements: 3.5, 4.7, 5.4, 6.6, 7.6_

  - [-] 3.6 Implement domain, database, email, and SSL contexts
    - Create `src/contexts/DomainContext.jsx`: `DomainProvider` with `MOCK_DOMAINS` as initial state; actions: `addDomain`, `deleteDomain`
    - Create `src/contexts/DatabaseContext.jsx`: `DatabaseProvider` with `MOCK_DATABASES`; actions: `addDatabase`, `deleteDatabase`, `addDbUser`, `deleteDbUser`
    - Create `src/contexts/EmailContext.jsx`: `EmailProvider` with `MOCK_EMAIL_ACCOUNTS`; actions: `addEmail`, `deleteEmail`, `suspendEmail`, `activateEmail`
    - Create `src/contexts/SSLContext.jsx`: `SSLProvider` with `MOCK_SSL_RECORDS`; actions: `installSSL`, `renewSSL`, `revokeSSL`
    - _Requirements: 3.1–3.8, 5.1–5.10, 6.1–6.8, 7.1–7.7_

  - [ ] 3.7 Implement ServerContext with polling
    - Create `src/contexts/ServerContext.jsx`: `ServerProvider` managing `metrics: ServerMetrics`, `history: MetricSnapshot[]` (max 20), `uptimeSeconds: number`
    - `setInterval` every 5 seconds: generate next metric values using random-walk algorithm; push snapshot to history (slice to last 20); increment uptime; on simulated failure set `fetchError: true` without updating values
    - Export `useServer` hook
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ] 4. App shell — shared UI components
  - [~] 4.1 Implement ProgressBar shared component
    - Create `src/components/shared/ProgressBar.jsx` and `ProgressBar.css`
    - Props: `value` (0–100), `variant: 'normal' | 'warning' | 'critical'`
    - Apply `--progress-normal`, `--progress-warning`, `--progress-critical` CSS variables based on variant
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [~] 4.2 Implement Modal and ModalPortal components
    - Create `src/components/shared/Modal.jsx` and `Modal.css`
    - Render via `ReactDOM.createPortal` into `document.body`
    - Implement `useFocusTrap` hook: query all focusable elements inside modal, trap Tab/Shift+Tab, close on Escape key
    - Props: `title`, `body`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`, `variant: 'danger' | 'info'`
    - On close, return focus to the element that triggered the modal (accept `triggerRef` prop)
    - _Requirements: 3.5, 3.6, 3.7, 4.7, 4.8, 5.4, 5.5, 6.6, 6.7, 7.6, 7.7, 11.3, 11.4_

  - [~] 4.3 Implement Notification and NotificationStack components
    - Create `src/components/shared/Notification.jsx` and `NotificationStack.jsx` with co-located CSS
    - `Notification`: auto-dismiss via `useEffect` + 5s `setTimeout` for `type === 'success'`; dismiss button calls `dismissNotification(id)` within 300ms; `aria-label` on dismiss button
    - `NotificationStack`: `position: fixed; top: 1rem; right: 1rem; z-index: 9999`; two `aria-live` regions (polite for success, assertive for error); renders up to 5 items
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 11.7_

  - [~] 4.4 Implement DataTable, SearchInput, and ConfirmModal shared components
    - `DataTable`: wraps `<table>` in `<div style="overflow-x: auto">` for horizontal scroll
    - `SearchInput`: controlled input, calls `onChange` on every keystroke
    - `ConfirmModal`: convenience wrapper around `Modal` with `variant="danger"` and standard confirm/cancel labels
    - _Requirements: 3.8, 6.8, 12.5_

- [ ] 5. App shell — shell components
  - [~] 5.1 Implement Sidebar component
    - Create `src/components/shell/Sidebar.jsx` and `Sidebar.css`
    - `<nav>` element with 7 nav items: Dashboard, Domains, File Manager, Databases, Email, SSL, Server
    - Props: `expanded: boolean`, `onToggle: () => void`
    - Read `activeSection` from `NavigationContext`; apply active styles (background + font-weight) to matching item
    - When `expanded === false`: hide text labels (`.sidebar__label { display: none }`), show icons only
    - Each nav item: SVG `<use>` icon + label span; `aria-label` on icon-only buttons
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8, 11.1, 11.5, 11.6_

  - [~] 5.2 Implement Breadcrumb and ThemeToggle components
    - `Breadcrumb`: `<nav aria-label="breadcrumb">` reading `activeSection` from `NavigationContext`; maps section ID to human-readable name
    - `ThemeToggle`: icon button reading `theme` from `ThemeContext`; sun icon when dark (action: switch to light), moon icon when light (action: switch to dark); `aria-label` describes the action
    - _Requirements: 1.4, 9.2, 9.3, 11.5_

  - [~] 5.3 Implement Header component
    - Create `src/components/shell/Header.jsx` and `Header.css`
    - `<header>` element containing `<Breadcrumb>` and `<ThemeToggle>`
    - Height: `var(--header-height)`
    - _Requirements: 1.4, 9.2, 11.6_

  - [~] 5.4 Implement AppShell and wire all providers into App.jsx
    - Create `src/components/shell/AppShell.jsx` and `AppShell.css`
    - CSS Grid layout: `grid-template-columns: var(--sidebar-width) 1fr`, `grid-template-rows: var(--header-height) 1fr`
    - Manage `sidebarExpanded` state: initialize from viewport width (`>= 1024px` → expanded, `< 1024px` → collapsed)
    - Render `<Sidebar>`, `<Header>`, `<main>` (section switcher based on `activeSection`)
    - Render `<ModalPortal>` and `<NotificationStack>` outside normal flow
    - Update `src/App.jsx` to wrap everything in `ThemeProvider > NotificationProvider > ModalProvider > NavigationContext providers > domain/db/email/ssl/server providers > AppShell`
    - _Requirements: 1.1, 1.6, 1.7, 1.8, 12.1, 12.2, 12.3, 12.4_

- [~] 6. Checkpoint — shell integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Dashboard section
  - [~] 7.1 Implement SummaryCards component
    - Create `src/components/sections/Dashboard/SummaryCards.jsx`
    - Read from `DomainContext`, `DatabaseContext`, `EmailContext`, `SSLContext`
    - Display 4 stat cards: active domains count, total databases count, total email accounts count, SSL breakdown (valid / expiring within 30 days / expired)
    - Use `isExpiringSoon` from `src/utils/ssl.js` for the expiring-soon count
    - _Requirements: 2.1_

  - [~] 7.2 Implement ResourceSummaryWidget component
    - Create `src/components/sections/Dashboard/ResourceSummaryWidget.jsx`
    - Read latest CPU/RAM/disk from `ServerContext`; display numeric values
    - Own `setInterval` at 30-second interval to trigger re-read; on simulated failure: retain last values, show stale-data indicator, show `lastSuccessfulRefreshAt` timestamp
    - _Requirements: 2.2, 2.5, 2.6_

  - [~] 7.3 Implement QuickActions component and Dashboard section
    - Create `src/components/sections/Dashboard/QuickActions.jsx` with 6–8 shortcut buttons (at minimum: Add Domain, Create Database, Add Email Account)
    - Each button calls `navigateTo(sectionId)` and sets `pendingAction: { type: 'open-create-form', target: sectionId }` via `NavigationContext`
    - Create `src/components/sections/Dashboard/Dashboard.jsx` composing `SummaryCards`, `ResourceSummaryWidget`, `QuickActions`
    - _Requirements: 2.3, 2.4_

- [ ] 8. Domain Manager section
  - [~] 8.1 Implement AddDomainForm component
    - Create `src/components/sections/DomainManager/AddDomainForm.jsx`
    - Controlled input; on submit call `validateDomainName` and check for duplicates in `DomainContext`
    - Show inline `<span role="alert">` error beneath input for invalid or duplicate names; clear error on input change
    - On success: call `DomainContext.addDomain`, call `addNotification({ type: 'success', ... })`, reset form
    - Auto-focus input when `pendingAction.target === 'domains'`; call `clearPendingAction()` after focusing
    - _Requirements: 3.2, 3.3, 3.4, 2.4_

  - [~] 8.2 Implement DomainTable and DomainSearch components
    - `DomainSearch`: `<SearchInput>` that filters domain list on every keystroke (case-insensitive substring match on name)
    - `DomainTable`: `<DataTable>` with columns Name, Status, Created (formatted via `formatDate`); delete button per row opens `<ConfirmModal>` with domain name; on confirm calls `DomainContext.deleteDomain` + success notification; on cancel leaves list unchanged
    - Store `triggerRef` for each delete button to restore focus after modal closes
    - _Requirements: 3.1, 3.5, 3.6, 3.7, 3.8, 11.4_

  - [~] 8.3 Compose DomainManager section
    - Create `src/components/sections/DomainManager/DomainManager.jsx` composing `AddDomainForm`, `DomainSearch`, `DomainTable`
    - _Requirements: 3.1–3.8_

- [ ] 9. File Manager section
  - [~] 9.1 Implement DirectoryTree component
    - Create `src/components/sections/FileManager/DirectoryTree.jsx`
    - Render recursive tree of `FileNode` items from `FileContext` (or local state seeded from `MOCK_FILE_TREE`)
    - Click on directory: expand/collapse and set selected directory; display children in `FileListPanel`
    - _Requirements: 4.1, 4.2_

  - [~] 9.2 Implement FileListPanel with rename and delete
    - Create `src/components/sections/FileManager/FileListPanel.jsx`
    - Show each entry: name, size (via `formatFileSize`), last-modified (via `formatDateTime`)
    - Rename: click rename → show inline `<input>` pre-filled with current name; on submit call `validateFilename`; show inline error or update entry + success notification
    - Delete: click delete → `<ConfirmModal>` → on confirm remove entry + success notification; on cancel leave unchanged
    - On any operation failure: show error notification, do not alter listing
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.12_

  - [~] 9.3 Implement UploadZone component
    - Create `src/components/sections/FileManager/UploadZone.jsx`
    - Accept files via drag-and-drop and `<input type="file">`
    - Reject files > 500 MB (524,288,000 bytes) with inline error; accept others
    - Simulate upload with `setInterval` incrementing `uploadedBytes` by ~2 MB per 200ms tick; show per-file progress bar (percentage)
    - On complete: add file to current directory listing + success notification
    - On failure: error notification, do not alter listing
    - _Requirements: 4.9, 4.10, 4.11, 4.12_

  - [~] 9.4 Compose FileManager section
    - Create `src/components/sections/FileManager/FileManager.jsx` composing `DirectoryTree`, `FileListPanel`, `UploadZone`
    - _Requirements: 4.1–4.12_

- [ ] 10. Database Manager section
  - [~] 10.1 Implement CreateDatabaseForm component
    - Create `src/components/sections/DatabaseManager/CreateDatabaseForm.jsx`
    - Controlled input; on submit call `validateDatabaseName` and check for duplicates in `DatabaseContext`
    - Inline `<span role="alert">` error for invalid or duplicate names; clear on input change
    - On success: `DatabaseContext.addDatabase` + success notification + reset form
    - Auto-focus when `pendingAction.target === 'databases'`; call `clearPendingAction()` after focusing
    - _Requirements: 5.2, 5.3, 5.9, 2.4_

  - [~] 10.2 Implement DatabaseTable with user management
    - Create `src/components/sections/DatabaseManager/DatabaseTable.jsx`
    - List databases: name, size (MB), user count; delete button → `<ConfirmModal>` → on confirm `deleteDatabase` (removes db + all users) + success notification; on failure error notification
    - Expandable row: show associated users; `CreateUserForm` scoped to selected database
    - `CreateUserForm`: username + password inputs; validate via `validateDbUsername` + `validateDbPassword`; check for duplicate username on selected db; on success `addDbUser` + success notification
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 5.8, 5.10_

  - [~] 10.3 Compose DatabaseManager section
    - Create `src/components/sections/DatabaseManager/DatabaseManager.jsx` composing `CreateDatabaseForm`, `DatabaseTable`
    - _Requirements: 5.1–5.10_

- [ ] 11. Email Manager section
  - [~] 11.1 Implement CreateEmailForm component
    - Create `src/components/sections/EmailManager/CreateEmailForm.jsx`
    - Controlled inputs for email address and password; validate via `validateEmailAddress` + `validateEmailPassword`
    - Inline `<span role="alert">` errors; clear on input change
    - On success: `EmailContext.addEmail` + success notification + reset form
    - Auto-focus when `pendingAction.target === 'email'`; call `clearPendingAction()` after focusing
    - _Requirements: 6.2, 6.3, 2.4_

  - [~] 11.2 Implement EmailTable and EmailSearch components
    - `EmailSearch`: `<SearchInput>` filtering on every keystroke (case-insensitive substring on address)
    - `EmailTable`: `<DataTable>` with columns address, domain, quota (MB), status; suspend/activate toggle button per row (calls `suspendEmail`/`activateEmail` + success notification); delete button → `<ConfirmModal>` → on confirm `deleteEmail` + success notification
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [~] 11.3 Compose EmailManager section
    - Create `src/components/sections/EmailManager/EmailManager.jsx` composing `CreateEmailForm`, `EmailSearch`, `EmailTable`
    - _Requirements: 6.1–6.8_

- [ ] 12. SSL Manager section
  - [~] 12.1 Implement SSLTable component
    - Create `src/components/sections/SSLManager/SSLTable.jsx`
    - `<DataTable>` with columns: domain name, SSL status badge, expiry date (blank when `None`), issuer (blank when `None`)
    - Status `Active` + `expiresAt` within 30 days: yellow warning indicator row (use `isExpiringSoon`)
    - Status `Expired`: red error indicator row
    - Actions per row: Install SSL (when `None`) → `installSSL` + success notification (visible ≥ 3s); Renew SSL (when `Active` or `Expired`) → `renewSSL` + success notification (≥ 3s); Revoke SSL (when `Active`) → `<ConfirmModal>` with domain name + revocation description → on confirm `revokeSSL` + success notification (≥ 3s)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [~] 12.2 Compose SSLManager section
    - Create `src/components/sections/SSLManager/SSLManager.jsx` composing `SSLTable`
    - _Requirements: 7.1–7.7_

- [ ] 13. Server Monitor section
  - [~] 13.1 Implement MetricCard and UptimeDisplay components
    - `MetricCard`: label, numeric value (%), `<ProgressBar>` with variant derived from value (CPU/RAM: `warning` if > 80, else `normal`; disk: `critical` if > 90, else `normal`)
    - `UptimeDisplay`: reads `uptimeSeconds` from `ServerContext`; formats via `formatUptime`
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.7_

  - [~] 13.2 Implement UsageHistoryChart component
    - Create `src/components/sections/ServerMonitor/UsageHistoryChart.jsx`
    - SVG line chart for CPU and RAM; reads `history` from `ServerContext`; renders `min(history.length, 20)` data points
    - Two lines (CPU and RAM) with distinct colors; axes labeled
    - _Requirements: 8.6_

  - [~] 13.3 Compose ServerMonitor section
    - Create `src/components/sections/ServerMonitor/ServerMonitor.jsx` composing three `MetricCard` instances (CPU, RAM, disk), `UsageHistoryChart`, `UptimeDisplay`
    - Show error indicator when `metrics.fetchError === true`; retain last values
    - _Requirements: 8.1, 8.2, 8.8_

- [~] 14. Checkpoint — all sections integrated
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Property-based tests — pure utility functions
  - [~] 15.1 Write property tests for domain validation (Properties 7, 8)
    - Create `src/__tests__/property/validation.property.test.js`
    - **Property 7: Invalid domain name is rejected** — `fc.string().filter(s => !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(s))` → `validateDomainName` returns `valid: false`
    - **Property 8: Duplicate domain is rejected** — generate valid domain, add to list, submit again → duplicate check returns error
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 15.2 Write property tests for valid domain addition (Property 6)
    - **Property 6: Valid domain addition grows the list** — `fc.string().filter(s => /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(s))` → list length increases by 1
    - **Validates: Requirements 3.2**

  - [~] 15.3 Write property tests for domain deletion (Properties 9, 10)
    - **Property 9: Domain deletion removes exactly the target** — confirm deletion → target absent, others unchanged
    - **Property 10: Domain deletion cancellation preserves list** — cancel deletion → list identical
    - **Validates: Requirements 3.6, 3.7**

  - [ ]* 15.4 Write property tests for domain search (Property 11)
    - **Property 11: Domain search filters correctly** — for any search string and domain list, filtered results contain exactly matching entries
    - **Validates: Requirements 3.8**

  - [~] 15.5 Write property tests for file formatting (Properties 12, 13)
    - Add to `src/__tests__/property/formatting.property.test.js`
    - **Property 12: File size display format** — `fc.integer({ min: 0 })` → KB if < 1,048,576 bytes, else MB
    - **Property 13: File date formatting** — `fc.date()` → output matches `DD MMM YYYY HH:MM` pattern
    - **Validates: Requirements 4.3**

  - [~] 15.6 Write property tests for filename validation (Properties 14, 15)
    - **Property 14: Valid filename rename succeeds** — strings 1–255 chars matching `[a-zA-Z0-9._\-\s]` → `validateFilename` returns `valid: true`
    - **Property 15: Invalid filename rename is rejected** — empty, >255 chars, or invalid chars → `valid: false`
    - **Validates: Requirements 4.5, 4.6**

  - [ ]* 15.7 Write property test for file upload size gate (Property 16)
    - **Property 16: File upload size gate** — files > 524,288,000 bytes rejected; ≤ 500 MB accepted
    - **Validates: Requirements 4.9**

  - [~] 15.8 Write property tests for database validation (Properties 18, 19, 20, 21, 22)
    - **Property 18: Valid database name addition grows the list**
    - **Property 19: Invalid database name is rejected**
    - **Property 20: Database deletion removes database and all its users**
    - **Property 21: Valid database user creation adds user to database**
    - **Property 22: Invalid database user credentials are rejected**
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.7, 5.8**

  - [~] 15.9 Write property tests for email validation (Properties 23, 24, 25, 26)
    - **Property 23: Valid email creation adds account to list**
    - **Property 24: Invalid email credentials are rejected**
    - **Property 25: Email suspend/activate round-trip** — suspend → `Suspended`; activate → `Active`; other fields unchanged
    - **Property 26: Email search filters correctly**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.8**

  - [~] 15.10 Write property tests for SSL utilities (Properties 27, 28, 29, 30, 31)
    - Create `src/__tests__/property/ssl.property.test.js`
    - **Property 27: SSL install sets Active status with 365-day expiry**
    - **Property 28: SSL renewal resets expiry to 365 days from now**
    - **Property 29: SSL expiry warning indicator** — `isExpiringSoon` true iff within 30 days and `Active`
    - **Property 30: SSL expired error indicator** — red indicator iff status `Expired`
    - **Property 31: SSL revocation clears certificate data** — status → `None`, `expiresAt` → null, `issuer` → null
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.7**

  - [~] 15.11 Write property tests for server utilities (Properties 32, 33, 34)
    - Create `src/__tests__/property/server.property.test.js`
    - **Property 32: Server metric threshold coloring** — CPU/RAM > 80 → warning; disk > 90 → critical; else normal
    - **Property 33: Usage history chart data point count** — `min(N, 20)` points rendered
    - **Property 34: Uptime string formatting** — `fc.integer({ min: 0 })` → correct `"X days, Y hours, Z minutes"`
    - **Validates: Requirements 8.3, 8.4, 8.5, 8.6, 8.7**

  - [~] 15.12 Write property tests for theme utilities (Properties 35, 36, 37, 38, 39)
    - Create `src/__tests__/property/theme.property.test.js`
    - **Property 35: Theme toggle is a round-trip** — toggle twice → original value
    - **Property 36: data-theme attribute matches active theme**
    - **Property 37: Theme persisted to localStorage on change**
    - **Property 38: Valid stored theme is applied on load**
    - **Property 39: Invalid stored theme is discarded on load**
    - **Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7, 9.8**

  - [~] 15.13 Write property tests for notification queue (Properties 40, 41, 42)
    - Create `src/__tests__/property/notifications.property.test.js`
    - **Property 40: Notification queue cap at 5** — N ≤ 5 notifications → all visible
    - **Property 41: Sixth notification evicts the oldest** — 6 added → first absent, sixth present
    - **Property 42: Error notifications do not auto-dismiss** — after 10+ seconds, error notification still present
    - **Validates: Requirements 10.6, 10.7, 10.8**

- [ ] 16. Property-based tests — component-level (Properties 1–5)
  - [ ]* 16.1 Write property tests for navigation and breadcrumb (Properties 1, 2, 3)
    - Create `src/__tests__/property/navigation.property.test.jsx`
    - **Property 1: Navigation reflects active section in breadcrumb** — for any valid `SectionId`, set active → breadcrumb text equals human-readable name
    - **Property 2: Sidebar active link is exclusive** — for any active section, only that link has active state
    - **Property 3: Navigation click changes active section** — clicking any sidebar link sets `activeSection` to corresponding ID
    - **Validates: Requirements 1.3, 1.4, 1.5**

  - [ ]* 16.2 Write property test for dashboard summary counts (Property 4)
    - **Property 4: Dashboard summary counts match data state** — for any combination of domain/db/email/SSL collections, summary cards display exact counts
    - **Validates: Requirements 2.1**

  - [ ]* 16.3 Write property test for domain date formatting in list (Property 5)
    - **Property 5: Domain date formatting** — for any `Domain` with any `createdAt`, displayed date matches `DD MMM YYYY`
    - **Validates: Requirements 3.1**

- [ ] 17. Unit tests — shell and shared components
  - [ ]* 17.1 Write unit tests for Sidebar component
    - Create `src/__tests__/unit/Sidebar.test.jsx`
    - Test: all 7 nav links present; active link has active styles; collapsed state hides labels; toggle button expands sidebar; ARIA attributes on icon-only buttons
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7, 11.5_

  - [ ]* 17.2 Write unit tests for Modal component
    - Create `src/__tests__/unit/Modal.test.jsx`
    - Test: focus trapped inside modal; Escape key closes modal; focus returns to trigger element after close; renders via portal
    - _Requirements: 11.3, 11.4_

  - [ ]* 17.3 Write unit tests for NotificationStack component
    - Create `src/__tests__/unit/NotificationStack.test.jsx`
    - Test: success notification auto-dismisses after 5s; error notification does not auto-dismiss; dismiss button removes within 300ms; `aria-live` regions present; max 5 shown
    - _Requirements: 10.4, 10.5, 10.6, 10.8, 11.7_

  - [ ]* 17.4 Write unit tests for Dashboard, DomainManager, FileManager
    - Create `src/__tests__/unit/Dashboard.test.jsx`, `DomainManager.test.jsx`, `FileManager.test.jsx`
    - Dashboard: summary cards render; resource widget shows CPU/RAM/disk; quick-action navigates and opens form
    - DomainManager: domain list renders; search filters; delete modal appears; add form validates
    - FileManager: directory tree renders; rename inline edit; upload zone rejects >500 MB
    - _Requirements: 2.1–2.6, 3.1–3.8, 4.1–4.12_

  - [ ]* 17.5 Write unit tests for DatabaseManager, EmailManager, SSLManager, ServerMonitor
    - Create `src/__tests__/unit/DatabaseManager.test.jsx`, `EmailManager.test.jsx`, `SSLManager.test.jsx`, `ServerMonitor.test.jsx`
    - DatabaseManager: create db validates; user count displayed; delete removes users
    - EmailManager: suspend/activate toggle; search filters; delete modal
    - SSLManager: warning/error row indicators; install/renew/revoke actions; notification ≥ 3s
    - ServerMonitor: metric cards render; progress bar variants; failed poll retains last values; uptime string format
    - _Requirements: 5.1–5.10, 6.1–6.8, 7.1–7.7, 8.1–8.8_

- [~] 18. Final checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 6, 14, and 18 ensure incremental validation
- Property tests (Properties 1–42) target pure utility functions directly where possible; component-level properties use `@testing-library/react` + `fast-check`
- Unit tests cover structural rendering, specific interactions, responsive behavior, accessibility, and error states
- All validation logic lives in `src/utils/` so it can be tested without rendering React components
- The `SIMULATE_FAILURE_RATE` constant in `ServerContext` (default `0`) can be raised during testing to exercise error paths
- CSS class names are prefixed with component name (e.g., `.sidebar__nav-item`) — no CSS Modules needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 3, "tasks": ["3.6", "3.7"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "4.4"] },
    { "id": 5, "tasks": ["5.1", "5.2"] },
    { "id": 6, "tasks": ["5.3", "5.4"] },
    { "id": 7, "tasks": ["7.1", "7.2", "8.1", "10.1", "11.1", "12.1", "13.1"] },
    { "id": 8, "tasks": ["7.3", "8.2", "8.3", "9.1", "10.2", "11.2", "12.2", "13.2"] },
    { "id": 9, "tasks": ["9.2", "9.3", "9.4", "10.3", "11.3", "13.3"] },
    { "id": 10, "tasks": ["15.1", "15.3", "15.5", "15.6", "15.8", "15.9", "15.10", "15.11", "15.12", "15.13"] },
    { "id": 11, "tasks": ["15.2", "15.4", "15.7", "16.1", "16.2", "16.3"] },
    { "id": 12, "tasks": ["17.1", "17.2", "17.3"] },
    { "id": 13, "tasks": ["17.4", "17.5"] }
  ]
}
```

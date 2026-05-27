# Design Document: Hosting Control Panel

## Overview

The Hosting Control Panel (HCP) is a single-page React 19 application that provides a cPanel/Plesk-inspired interface for managing hosting resources. It is a pure frontend application — all data is simulated in-memory, there is no backend, and all navigation is driven by React state rather than a URL router.

The application is structured around a persistent shell (Sidebar + Header + main content area) with eight navigable sections: Dashboard, Domains, File Manager, Databases, Email, SSL, and Server Monitor. A global notification system, a theme system (light/dark), and a modal system are layered on top of the shell via React Context.

### Key Design Decisions

- **No routing library**: Navigation is a single `activeSection` string in a top-level context. This keeps the dependency footprint minimal and matches the project constraint.
- **No external state management**: All state lives in `useState`/`useReducer` hooks composed into Context providers. Each domain (domains, databases, email, SSL, server) gets its own context so components only re-render when their slice of state changes.
- **Simulated data**: Mock data is generated at app startup and stored in context state. Async operations (uploads, SSL install, server polling) are simulated with `setTimeout`/`setInterval`.
- **CSS custom properties**: The existing `--text`, `--bg`, `--border`, `--accent`, etc. variables are extended with HCP-specific tokens. Theme switching is done by toggling `data-theme` on `<html>`.

---

## Architecture

### High-Level Component Tree

```
<App>
  <ThemeProvider>          ← manages data-theme on <html>, persists to localStorage
    <NotificationProvider> ← global notification queue (max 5)
      <ModalProvider>      ← single modal slot, rendered via portal
        <AppShell>
          <Sidebar />      ← persistent navigation
          <div.main-layout>
            <Header />     ← breadcrumb + theme toggle
            <main>
              <Dashboard />        ← activeSection === 'dashboard'
              <DomainManager />    ← activeSection === 'domains'
              <FileManager />      ← activeSection === 'files'
              <DatabaseManager />  ← activeSection === 'databases'
              <EmailManager />     ← activeSection === 'email'
              <SSLManager />       ← activeSection === 'ssl'
              <ServerMonitor />    ← activeSection === 'server'
            </main>
          </div.main-layout>
        </AppShell>
        <ModalPortal />    ← renders active modal outside normal flow
        <NotificationStack /> ← fixed top-right, renders notification queue
      </ModalProvider>
    </NotificationProvider>
  </ThemeProvider>
</App>
```

### Navigation State Machine

Navigation is a finite set of string values managed in `NavigationContext`.

```
States: 'dashboard' | 'domains' | 'files' | 'databases' | 'email' | 'ssl' | 'server'
Initial state: 'dashboard'
Transitions: navigateTo(section) → sets activeSection to section
```

The `NavigationContext` also carries an optional `pendingAction` field that quick-action shortcuts use to signal that a creation form should be auto-opened when the target section mounts.

```typescript
interface NavigationState {
  activeSection: SectionId;
  pendingAction: PendingAction | null;
}

type SectionId = 'dashboard' | 'domains' | 'files' | 'databases' | 'email' | 'ssl' | 'server';

interface PendingAction {
  type: 'open-create-form';
  target: SectionId;
}
```

### Context Architecture

Each concern gets its own context + provider to avoid unnecessary re-renders:

| Context | State Managed | Key Actions |
|---|---|---|
| `NavigationContext` | `activeSection`, `pendingAction` | `navigateTo`, `clearPendingAction` |
| `ThemeContext` | `theme: 'light' \| 'dark'` | `toggleTheme` |
| `NotificationContext` | `notifications: Notification[]` | `addNotification`, `dismissNotification` |
| `ModalContext` | `modal: ModalConfig \| null` | `openModal`, `closeModal` |
| `DomainContext` | `domains: Domain[]` | `addDomain`, `deleteDomain` |
| `DatabaseContext` | `databases: Database[]` | `addDatabase`, `deleteDatabase`, `addDbUser`, `deleteDbUser` |
| `EmailContext` | `emailAccounts: EmailAccount[]` | `addEmail`, `deleteEmail`, `suspendEmail`, `activateEmail` |
| `SSLContext` | `sslRecords: SSLRecord[]` | `installSSL`, `renewSSL`, `revokeSSL` |
| `ServerContext` | `metrics: ServerMetrics`, `history: MetricSnapshot[]`, `uptimeSeconds: number` | internal polling only |

---

## Components and Interfaces

### Shell Components

**`AppShell`** — top-level layout container. Reads `sidebarExpanded` state (derived from viewport width on mount, togglable). Renders `<Sidebar>` and the main column.

**`Sidebar`** — `<nav>` element. Props: `expanded: boolean`, `onToggle: () => void`. Renders 7 nav items. Each item: icon (SVG `<use>`), optional label (hidden when collapsed), active state from `NavigationContext`.

**`Header`** — `<header>` element. Contains `<Breadcrumb>` (reads `activeSection` from `NavigationContext`) and `<ThemeToggle>` (reads/writes `ThemeContext`).

**`Breadcrumb`** — renders current section name as `<nav aria-label="breadcrumb">` with a single crumb.

**`ThemeToggle`** — icon button that shows sun/moon icon based on current theme.

### Shared UI Components

**`Modal`** — rendered via `ModalPortal` into `document.body`. Traps focus, closes on Escape. Props: `title`, `body`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`, `variant: 'danger' | 'info'`.

**`Notification`** — single notification item. Props: `notification: NotificationItem`, `onDismiss`. Auto-dismiss timer for success type.

**`NotificationStack`** — fixed `position: fixed; top: 1rem; right: 1rem` container. Renders up to 5 `<Notification>` items stacked vertically. Uses `aria-live` region.

**`ProgressBar`** — reusable progress bar. Props: `value: number` (0–100), `variant: 'normal' | 'warning' | 'critical'`.

**`SearchInput`** — controlled input with debounce-free onChange (updates on every keystroke per requirements).

**`ConfirmModal`** — convenience wrapper around `Modal` for destructive confirmations.

**`DataTable`** — horizontally scrollable table wrapper. Renders `<div style="overflow-x: auto">` around `<table>`.

### Section Components

**`Dashboard`**
- `<SummaryCards>` — 4 stat cards (domains count, databases count, email count, SSL breakdown)
- `<ResourceSummaryWidget>` — shows last CPU/RAM/disk values; polls every 30s via `setInterval`; shows stale-data indicator on failure
- `<QuickActions>` — 6–8 shortcut buttons that call `navigateTo` + set `pendingAction`

**`DomainManager`**
- `<AddDomainForm>` — controlled input with regex validation; inline error display
- `<DomainSearch>` — search input that filters the domain list
- `<DomainTable>` — `<DataTable>` with columns: Name, Status, Created; delete action per row

**`FileManager`**
- `<DirectoryTree>` — recursive tree of `FileNode` items; click to expand/select
- `<FileListPanel>` — shows contents of selected directory; rename inline edit; delete action
- `<UploadZone>` — drag-and-drop + file picker; 500 MB limit; progress bars per file

**`DatabaseManager`**
- `<CreateDatabaseForm>` — name input with regex validation
- `<DatabaseTable>` — list with name, size, user count; expand row to show users; delete action
- `<CreateUserForm>` — username + password inputs with validation; scoped to selected database

**`EmailManager`**
- `<CreateEmailForm>` — email address + password inputs with validation
- `<EmailSearch>` — search input
- `<EmailTable>` — address, domain, quota, status; suspend/activate toggle; delete action

**`SSLManager`**
- `<SSLTable>` — domain, status badge, expiry date, issuer; Install/Renew/Revoke actions; warning/error row indicators

**`ServerMonitor`**
- `<MetricCard>` — shows label, numeric value, `<ProgressBar>`; one each for CPU, RAM, disk
- `<UsageHistoryChart>` — SVG line chart for CPU and RAM; up to 20 data points
- `<UptimeDisplay>` — formatted uptime string

---

## Data Models

```typescript
// ── Navigation ──────────────────────────────────────────────────────────────
type SectionId = 'dashboard' | 'domains' | 'files' | 'databases' | 'email' | 'ssl' | 'server';

// ── Theme ────────────────────────────────────────────────────────────────────
type Theme = 'light' | 'dark';

// ── Notifications ────────────────────────────────────────────────────────────
type NotificationType = 'success' | 'error';

interface NotificationItem {
  id: string;           // crypto.randomUUID()
  type: NotificationType;
  message: string;
  createdAt: number;    // Date.now()
}

// ── Modal ────────────────────────────────────────────────────────────────────
interface ModalConfig {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}
```

```typescript
// ── Domains ──────────────────────────────────────────────────────────────────
type DomainStatus = 'Active' | 'Parked' | 'Redirected';

interface Domain {
  id: string;
  name: string;           // e.g. "example.com"
  status: DomainStatus;
  createdAt: Date;
}

// ── File Manager ─────────────────────────────────────────────────────────────
type FileNodeType = 'file' | 'directory';

interface FileNode {
  id: string;
  name: string;
  type: FileNodeType;
  parentId: string | null;  // null = root
  sizeBytes: number;        // 0 for directories
  modifiedAt: Date;
  children?: FileNode[];    // populated lazily when directory is expanded
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  totalBytes: number;
  uploadedBytes: number;
  status: 'uploading' | 'complete' | 'error';
}

// ── Databases ────────────────────────────────────────────────────────────────
interface DatabaseUser {
  id: string;
  username: string;
  databaseId: string;
}

interface Database {
  id: string;
  name: string;
  sizeMB: number;
  users: DatabaseUser[];
}

// ── Email ────────────────────────────────────────────────────────────────────
type EmailStatus = 'Active' | 'Suspended';

interface EmailAccount {
  id: string;
  address: string;        // full address e.g. "user@example.com"
  domain: string;         // e.g. "example.com"
  quotaMB: number;
  status: EmailStatus;
}

// ── SSL ──────────────────────────────────────────────────────────────────────
type SSLStatus = 'Active' | 'Expired' | 'None';

interface SSLRecord {
  domainId: string;
  domainName: string;
  status: SSLStatus;
  expiresAt: Date | null;   // null when status is 'None'
  issuer: string | null;    // null when status is 'None'
}

// ── Server Monitor ───────────────────────────────────────────────────────────
interface ServerMetrics {
  cpuPercent: number;       // 0–100
  ramPercent: number;       // 0–100
  diskPercent: number;      // 0–100
  lastUpdatedAt: number;    // Date.now()
  fetchError: boolean;
}

interface MetricSnapshot {
  timestamp: number;
  cpuPercent: number;
  ramPercent: number;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

#### Redundancy Analysis

Before listing properties, redundancies are eliminated:

- 1.4 (breadcrumb matches active section) and 1.5 (active link is highlighted) both test "for any active section, the UI reflects it correctly" — these are kept separate because they test different UI elements.
- 3.2 (add valid domain) and 3.6 (delete domain) are complementary round-trip operations — kept separate.
- 6.4 (suspend) and 6.5 (activate) form a round-trip — combined into a single suspend/activate round-trip property.
- 9.4 and 9.5 (data-theme attribute for dark and light) are the same property stated twice — merged into one.
- 8.3 and 8.4 (CPU warning color, RAM warning color) share the same threshold logic — combined into one property about metric threshold coloring.
- 10.1 and 10.2 (success/error notification appearance) are kept separate because they test different visual indicators and different auto-dismiss behavior.

---

### Property 1: Navigation reflects active section in breadcrumb

*For any* section ID in the set of valid sections, when that section is set as active, the breadcrumb text displayed in the header SHALL equal the human-readable name of that section.

**Validates: Requirements 1.4**

---

### Property 2: Sidebar active link is exclusive

*For any* active section, the sidebar navigation link corresponding to that section SHALL have the active visual state applied, and all other sidebar links SHALL NOT have the active visual state applied.

**Validates: Requirements 1.5**

---

### Property 3: Navigation click changes active section

*For any* sidebar navigation link, clicking it SHALL result in the `activeSection` value in `NavigationContext` being set to the corresponding section ID.

**Validates: Requirements 1.3**

---

### Property 4: Dashboard summary counts match data state

*For any* combination of domains, databases, email accounts, and SSL records held in their respective contexts, the dashboard summary cards SHALL display counts that exactly equal the lengths of those collections (and SSL sub-counts that exactly equal the number of records in each SSL status category).

**Validates: Requirements 2.1**

---

### Property 5: Domain date formatting

*For any* `Domain` object with any `createdAt` date value, the date displayed in the domain list SHALL match the format `DD MMM YYYY` (e.g., "05 Jun 2025"), where DD is zero-padded, MMM is the three-letter English month abbreviation, and YYYY is the four-digit year.

**Validates: Requirements 3.1**

---

### Property 6: Valid domain addition grows the list

*For any* domain name string that matches `^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$` and does not already exist in the domain list, submitting it via the Add Domain form SHALL increase the domain list length by exactly 1 and the new entry SHALL have the submitted name.

**Validates: Requirements 3.2**

---

### Property 7: Invalid domain name is rejected

*For any* string that does NOT match `^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$` (including empty string), submitting it via the Add Domain form SHALL display an inline validation error and SHALL NOT change the domain list.

**Validates: Requirements 3.3**

---

### Property 8: Duplicate domain is rejected

*For any* domain name already present in the domain list, submitting that same name again via the Add Domain form SHALL display an inline validation error and SHALL NOT add a duplicate entry to the list.

**Validates: Requirements 3.4**

---

### Property 9: Domain deletion removes exactly the target

*For any* domain in the domain list, confirming its deletion SHALL result in that domain no longer appearing in the list, and all other domains SHALL remain unchanged.

**Validates: Requirements 3.6**

---

### Property 10: Domain deletion cancellation preserves list

*For any* domain in the domain list, cancelling its deletion confirmation SHALL leave the domain list length and contents identical to the state before the delete action was triggered.

**Validates: Requirements 3.7**

---

### Property 11: Domain search filters correctly

*For any* search string and any domain list, the filtered results displayed SHALL contain exactly those domains whose names contain the search string (case-insensitive), and no domain whose name contains the search string SHALL be omitted from the results.

**Validates: Requirements 3.8**

---

### Property 12: File size display format

*For any* file with a size in bytes, the displayed size SHALL be in KB (rounded to one decimal place) if the size is less than 1,048,576 bytes (1024 KB), and in MB (rounded to one decimal place) otherwise.

**Validates: Requirements 4.3**

---

### Property 13: File date formatting

*For any* `FileNode` with any `modifiedAt` date value, the date displayed in the file listing SHALL match the format `DD MMM YYYY HH:MM` with zero-padded day, three-letter month abbreviation, four-digit year, and zero-padded 24-hour time.

**Validates: Requirements 4.3**

---

### Property 14: Valid filename rename succeeds

*For any* filename string with length between 1 and 255 characters (inclusive) containing only characters matching `[a-zA-Z0-9._\-\s]`, submitting it as a rename SHALL update the entry's name to the submitted string and SHALL NOT display a validation error.

**Validates: Requirements 4.5**

---

### Property 15: Invalid filename rename is rejected

*For any* filename string that is empty, exceeds 255 characters, or contains characters outside `[a-zA-Z0-9._\-\s]`, submitting it as a rename SHALL display an inline validation error and SHALL NOT change the entry's name.

**Validates: Requirements 4.6**

---

### Property 16: File upload size gate

*For any* file object, if its size exceeds 500 MB (524,288,000 bytes), the upload SHALL be rejected with an inline error message and the file SHALL NOT be added to the directory listing. If its size is 500 MB or less, the upload SHALL be accepted.

**Validates: Requirements 4.9**

---

### Property 17: Database user count display

*For any* `Database` object with any number of associated `DatabaseUser` entries, the user count displayed in the database list SHALL equal the length of the `users` array for that database.

**Validates: Requirements 5.1**

---

### Property 18: Valid database name addition grows the list

*For any* database name string that matches `^[a-zA-Z][a-zA-Z0-9_]{0,63}$` and does not already exist in the database list, submitting it SHALL increase the database list length by exactly 1.

**Validates: Requirements 5.2**

---

### Property 19: Invalid database name is rejected

*For any* string that does NOT match `^[a-zA-Z][a-zA-Z0-9_]{0,63}$`, submitting it via the Create Database form SHALL display an inline validation error and SHALL NOT change the database list.

**Validates: Requirements 5.3**

---

### Property 20: Database deletion removes database and all its users

*For any* database in the list (with any number of associated users), confirming its deletion SHALL remove that database from the list and SHALL remove all `DatabaseUser` entries associated with that database.

**Validates: Requirements 5.5**

---

### Property 21: Valid database user creation adds user to database

*For any* username matching `^[a-zA-Z][a-zA-Z0-9_]{0,31}$`, a password between 8 and 128 non-whitespace characters, and a username not already existing on the selected database, submitting the Create User form SHALL add the user to that database's `users` array.

**Validates: Requirements 5.7**

---

### Property 22: Invalid database user credentials are rejected

*For any* combination of username or password that violates the constraints (username not matching the pattern, password shorter than 8 characters, password longer than 128 characters, or password containing only whitespace), submitting the Create User form SHALL display an inline validation error and SHALL NOT add a user.

**Validates: Requirements 5.8**

---

### Property 23: Valid email creation adds account to list

*For any* email address string matching `^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$` and a password of at least 8 characters, submitting the Create Email form SHALL add the account to the email list.

**Validates: Requirements 6.2**

---

### Property 24: Invalid email credentials are rejected

*For any* email address that does NOT match the email regex, or any password shorter than 8 characters, submitting the Create Email form SHALL display an inline validation error and SHALL NOT add an account.

**Validates: Requirements 6.3**

---

### Property 25: Email suspend/activate round-trip

*For any* email account, suspending it SHALL change its status to `Suspended`, and subsequently activating it SHALL change its status back to `Active`, leaving all other account fields unchanged.

**Validates: Requirements 6.4, 6.5**

---

### Property 26: Email search filters correctly

*For any* search string and any email account list, the filtered results SHALL contain exactly those accounts whose addresses contain the search string (case-insensitive), and no matching account SHALL be omitted.

**Validates: Requirements 6.8**

---

### Property 27: SSL install sets Active status with 365-day expiry

*For any* domain with SSL status `None`, clicking Install SSL SHALL set the domain's SSL status to `Active` and set the `expiresAt` date to exactly 365 days after the current date (within a 1-second tolerance for test execution time).

**Validates: Requirements 7.2**

---

### Property 28: SSL renewal resets expiry to 365 days from now

*For any* domain with SSL status `Active` or `Expired`, clicking Renew SSL SHALL set the `expiresAt` date to exactly 365 days after the current date (within a 1-second tolerance).

**Validates: Requirements 7.3**

---

### Property 29: SSL expiry warning indicator

*For any* SSL record with status `Active` and an `expiresAt` date within 30 days of the current date, the corresponding row SHALL display the yellow warning indicator. For any SSL record with status `Active` and `expiresAt` more than 30 days away, the yellow warning indicator SHALL NOT be displayed.

**Validates: Requirements 7.4**

---

### Property 30: SSL expired error indicator

*For any* SSL record with status `Expired`, the corresponding row SHALL display the red error indicator. For any SSL record with status other than `Expired`, the red error indicator SHALL NOT be displayed.

**Validates: Requirements 7.5**

---

### Property 31: SSL revocation clears certificate data

*For any* domain with SSL status `Active`, confirming revocation SHALL set the domain's SSL status to `None`, set `expiresAt` to `null`, and set `issuer` to `null`.

**Validates: Requirements 7.7**

---

### Property 32: Server metric threshold coloring

*For any* CPU or RAM usage value, the corresponding progress bar SHALL use the warning color variant when the value exceeds 80, and the normal color variant when the value is 80 or below. For any disk usage value, the progress bar SHALL use the critical color variant when the value exceeds 90, and the normal color variant when the value is 90 or below.

**Validates: Requirements 8.3, 8.4, 8.5**

---

### Property 33: Usage history chart data point count

*For any* history array of `MetricSnapshot` entries with length N, the usage history chart SHALL render exactly `min(N, 20)` data points.

**Validates: Requirements 8.6**

---

### Property 34: Uptime string formatting

*For any* uptime duration expressed as a non-negative integer number of seconds, the formatted uptime string SHALL correctly represent it as `"X days, Y hours, Z minutes"` where X, Y, Z are non-negative integers computed by integer division (days = floor(seconds / 86400), hours = floor((seconds % 86400) / 3600), minutes = floor((seconds % 3600) / 60)).

**Validates: Requirements 8.7**

---

### Property 35: Theme toggle is a round-trip

*For any* current theme value (`light` or `dark`), toggling the theme twice SHALL return the theme to its original value.

**Validates: Requirements 9.3**

---

### Property 36: data-theme attribute matches active theme

*For any* theme value (`light` or `dark`) set as the active theme, the `data-theme` attribute on the document root element SHALL equal that theme value.

**Validates: Requirements 9.4, 9.5**

---

### Property 37: Theme persisted to localStorage on change

*For any* theme change (to `light` or `dark`), the value stored in `localStorage` under the key `hcp-theme` SHALL equal the new theme value immediately after the change.

**Validates: Requirements 9.6**

---

### Property 38: Valid stored theme is applied on load

*For any* value of `light` or `dark` stored in `localStorage` under `hcp-theme`, loading the application SHALL apply that theme regardless of the OS-level color scheme preference.

**Validates: Requirements 9.7**

---

### Property 39: Invalid stored theme is discarded on load

*For any* string stored in `localStorage` under `hcp-theme` that is neither `light` nor `dark`, loading the application SHALL ignore that stored value and apply the theme based on OS-level preference (dark if `prefers-color-scheme: dark`, light otherwise).

**Validates: Requirements 9.8**

---

### Property 40: Notification queue cap at 5

*For any* sequence of N notifications added where N ≤ 5, all N notifications SHALL be simultaneously visible in the notification stack.

**Validates: Requirements 10.6**

---

### Property 41: Sixth notification evicts the oldest

*For any* sequence of 6 notifications added in order, after the 6th notification is added, the notification that was added first SHALL no longer be present in the stack, and the 6th notification SHALL be present.

**Validates: Requirements 10.7**

---

### Property 42: Error notifications do not auto-dismiss

*For any* error notification, after 10 or more seconds have elapsed without user interaction, the notification SHALL still be present in the notification stack.

**Validates: Requirements 10.8**

---

## Error Handling

### Validation Errors

All form inputs use controlled components with inline error display. Errors are shown beneath the relevant input field using a `<span role="alert">` element so screen readers announce them immediately. Errors clear when the user modifies the input.

Validation is synchronous and runs on form submit (not on every keystroke, except for search inputs which filter on every keystroke per requirements).

### Simulated Async Failures

Since there is no real backend, async operations (SSL install, file upload, server polling) are simulated with `setTimeout`. A configurable `SIMULATE_FAILURE_RATE` constant (default `0`) can be set during testing to trigger error paths. When a simulated operation fails:

- The relevant context action dispatches an `error` action that leaves state unchanged.
- `NotificationContext.addNotification` is called with `type: 'error'` and a descriptive message.
- For server polling failures, the `fetchError` flag on `ServerMetrics` is set to `true` and the last known values are retained.

### Modal Confirmation for Destructive Actions

All delete and revoke operations go through `ModalContext.openModal`. The modal renders via a React portal outside the normal DOM tree to ensure it always appears above all other content. Focus is trapped inside the modal using a `useFocusTrap` hook that queries all focusable elements within the modal container.

### Notification Error Display

Error notifications use `aria-live="assertive"` so screen readers interrupt current speech to announce them. They do not auto-dismiss — the user must click the dismiss button. This ensures errors are not silently lost.

---

## Testing Strategy

### Dual Testing Approach

The testing strategy combines example-based unit tests for specific scenarios and property-based tests for universal correctness properties.

**Test framework**: Vitest (already in the Vite ecosystem, zero-config with `@vitejs/plugin-react`)
**Component testing**: `@testing-library/react` + `@testing-library/user-event`
**Property-based testing**: `fast-check` (TypeScript-native, works in Vitest, no additional setup)

Install commands:
```
npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom fast-check jsdom
```

### Unit Tests (Example-Based)

Unit tests cover:
- Structural rendering: sidebar links present, dashboard widgets present, SSL table columns present
- Specific interactions: toggle sidebar, click quick-action, open/close modal, dismiss notification
- Responsive behavior: sidebar collapsed at <768px, expanded at ≥1024px
- Accessibility: ARIA attributes on icon buttons, focus trap in modal, focus return after modal close
- Error states: failed server poll retains last values, failed upload shows error notification

### Property-Based Tests

Each correctness property (Properties 1–42) is implemented as a single `fast-check` property test with a minimum of 100 runs. Tests are tagged with a comment referencing the design property.

**Tag format**: `// Feature: hosting-control-panel, Property N: <property_text>`

Example structure:
```javascript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Domain validation', () => {
  it('rejects any string not matching the domain regex', () => {
    // Feature: hosting-control-panel, Property 7: Invalid domain name is rejected
    fc.assert(
      fc.property(
        fc.string().filter(s => !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(s)),
        (invalidName) => {
          const result = validateDomainName(invalidName);
          expect(result.valid).toBe(false);
          expect(result.error).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Pure Logic Extraction

To make property tests fast and deterministic, all validation and formatting logic is extracted into pure functions in a `src/utils/` directory:

| File | Functions |
|---|---|
| `src/utils/validation.ts` | `validateDomainName`, `validateDatabaseName`, `validateDbUsername`, `validateDbPassword`, `validateEmailAddress`, `validateEmailPassword`, `validateFilename` |
| `src/utils/formatting.ts` | `formatDate` (DD MMM YYYY), `formatDateTime` (DD MMM YYYY HH:MM), `formatFileSize`, `formatUptime` |
| `src/utils/ssl.ts` | `isExpiringSoon` (within 30 days), `computeSSLExpiry` (now + 365 days) |
| `src/utils/notifications.ts` | `addNotificationToQueue` (enforces 5-item cap, evicts oldest) |
| `src/utils/theme.ts` | `resolveInitialTheme` (reads localStorage + matchMedia) |

Property tests target these pure functions directly, avoiding the need to render React components for the majority of correctness properties. Component-level property tests (Properties 1–5, 29–30, 32–33, 40–42) use `@testing-library/react` with `fast-check` generators.

### Test File Organization

```
src/
  utils/
    validation.ts
    formatting.ts
    ssl.ts
    notifications.ts
    theme.ts
  __tests__/
    unit/
      Sidebar.test.jsx
      Modal.test.jsx
      NotificationStack.test.jsx
      Dashboard.test.jsx
      DomainManager.test.jsx
      FileManager.test.jsx
      DatabaseManager.test.jsx
      EmailManager.test.jsx
      SSLManager.test.jsx
      ServerMonitor.test.jsx
    property/
      validation.property.test.js
      formatting.property.test.js
      navigation.property.test.jsx
      notifications.property.test.js
      theme.property.test.js
      ssl.property.test.js
      server.property.test.js
```

---

## Simulated Data / Mock Data Strategy

### Initial Data Generation

Mock data is generated once at app startup in `src/data/mockData.js` and passed as initial state to each context provider. This keeps the app populated with realistic data without any network calls.

```javascript
// src/data/mockData.js
export const MOCK_DOMAINS = [
  { id: '1', name: 'example.com', status: 'Active', createdAt: new Date('2024-01-15') },
  { id: '2', name: 'mysite.net', status: 'Parked', createdAt: new Date('2024-03-22') },
  { id: '3', name: 'shop.example.com', status: 'Active', createdAt: new Date('2024-06-01') },
];

export const MOCK_DATABASES = [ /* 3–4 databases with users */ ];
export const MOCK_EMAIL_ACCOUNTS = [ /* 4–5 email accounts */ ];
export const MOCK_SSL_RECORDS = [ /* one per domain, mixed statuses */ ];
export const MOCK_FILE_TREE = [ /* nested FileNode tree */ ];
```

### Server Metrics Simulation

The `ServerContext` uses `setInterval` to update metrics every 5 seconds. Values are generated with a random walk algorithm to simulate realistic fluctuation:

```javascript
function nextMetricValue(current, min = 5, max = 95, step = 8) {
  const delta = (Math.random() - 0.5) * 2 * step;
  return Math.min(max, Math.max(min, current + delta));
}
```

A `SIMULATE_FAILURE_RATE` constant (0.0–1.0) controls how often a polling cycle "fails". When `Math.random() < SIMULATE_FAILURE_RATE`, the cycle sets `fetchError: true` without updating values.

### File Upload Simulation

File uploads are simulated with a `setInterval` that increments `uploadedBytes` by a random chunk size every 200ms until `totalBytes` is reached. The simulated upload speed is ~2 MB per tick, so a 10 MB file takes ~1 second.

### Dashboard Resource Refresh

The `ResourceSummaryWidget` in the Dashboard uses a separate `setInterval` (30-second interval) that reads the latest values from `ServerContext`. On simulated failure, it sets a `staleData` flag and records `lastSuccessfulRefreshAt`.

---

## CSS Architecture

### Extending Existing Custom Properties

The existing `src/index.css` variables are preserved unchanged. HCP-specific tokens are added in a new `src/styles/hcp-tokens.css` file that is imported in `main.jsx`:

```css
/* src/styles/hcp-tokens.css */
:root {
  /* Layout */
  --sidebar-width-expanded: 240px;
  --sidebar-width-collapsed: 60px;
  --header-height: 56px;

  /* Status colors */
  --status-success: #22c55e;
  --status-warning: #f59e0b;
  --status-error: #ef4444;
  --status-info: #3b82f6;

  /* Progress bar variants */
  --progress-normal: var(--accent);
  --progress-warning: #f59e0b;
  --progress-critical: #ef4444;

  /* Notification */
  --notification-success-bg: rgba(34, 197, 94, 0.12);
  --notification-success-border: rgba(34, 197, 94, 0.4);
  --notification-error-bg: rgba(239, 68, 68, 0.12);
  --notification-error-border: rgba(239, 68, 68, 0.4);

  /* SSL status badges */
  --ssl-active: #22c55e;
  --ssl-expired: #ef4444;
  --ssl-none: var(--text);

  /* Sidebar */
  --sidebar-bg: var(--bg);
  --sidebar-active-bg: var(--accent-bg);
  --sidebar-active-border: var(--accent);
  --sidebar-hover-bg: var(--accent-bg);

  /* Card */
  --card-bg: var(--bg);
  --card-border: var(--border);
  --card-shadow: var(--shadow);

  /* Transitions */
  --sidebar-transition: width 200ms ease;
  --notification-transition: opacity 300ms ease, transform 300ms ease;
}

[data-theme="dark"] {
  --status-success: #4ade80;
  --status-warning: #fbbf24;
  --status-error: #f87171;
  --notification-success-bg: rgba(74, 222, 128, 0.1);
  --notification-success-border: rgba(74, 222, 128, 0.35);
  --notification-error-bg: rgba(248, 113, 113, 0.1);
  --notification-error-border: rgba(248, 113, 113, 0.35);
}
```

### Layout Structure

The app shell uses CSS Grid for the top-level layout:

```css
/* AppShell */
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--header-height) 1fr;
  min-height: 100svh;
}

/* Sidebar spans full height */
.sidebar {
  grid-row: 1 / -1;
  width: var(--sidebar-width-expanded);
  transition: var(--sidebar-transition);
}

.sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
}
```

The `--sidebar-width` CSS custom property is toggled via JavaScript (setting it on the `.app-shell` element) so the grid reflows automatically.

### Component-Scoped CSS

Each component has a co-located `.css` file (e.g., `Sidebar.css`, `DomainManager.css`). No CSS Modules are used — class names are prefixed with the component name (e.g., `.sidebar__nav-item`, `.domain-manager__table`) to avoid collisions.

### Responsive Breakpoints

```css
/* Tablet: 768px–1023px → collapsed sidebar */
@media (max-width: 1023px) {
  .sidebar { width: var(--sidebar-width-collapsed); }
  .sidebar__label { display: none; }
}

/* Mobile: <768px → sidebar hidden behind toggle */
@media (max-width: 767px) {
  .sidebar { position: fixed; z-index: 100; transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
}
```

### Focus Indicators

All interactive elements get a consistent focus ring using the `:focus-visible` pseudo-class:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

This meets the WCAG 2.1 AA 3:1 contrast ratio requirement against both light and dark backgrounds given the `--accent` color values defined in `index.css`.

---

## Notification System Design

The `NotificationContext` manages a queue of up to 5 `NotificationItem` objects using `useReducer`:

```javascript
function notificationReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const next = [...state, action.payload];
      // Enforce 5-item cap: drop oldest if needed
      return next.length > 5 ? next.slice(next.length - 5) : next;
    }
    case 'DISMISS':
      return state.filter(n => n.id !== action.id);
    default:
      return state;
  }
}
```

The `NotificationStack` component renders notifications in a `<div>` with `position: fixed; top: 1rem; right: 1rem; z-index: 9999`. It contains an `aria-live="polite"` region for success notifications and an `aria-live="assertive"` region for error notifications (implemented as two separate `<div>` elements, one per live region type).

Auto-dismiss for success notifications is handled inside the `<Notification>` component via `useEffect` with a 5-second `setTimeout`. The timer is cleared on unmount to prevent state updates on unmounted components.

---

## Theme System Design

`ThemeContext` wraps the app and manages the `theme` value. On mount, `resolveInitialTheme()` is called:

```javascript
function resolveInitialTheme() {
  const stored = localStorage.getItem('hcp-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  // Invalid or missing stored value → use OS preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
```

Whenever `theme` changes, a `useEffect` applies it to the document root and persists it:

```javascript
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('hcp-theme', theme);
}, [theme]);
```

The `ThemeToggle` button in the `Header` calls `toggleTheme()` from context. It renders a sun icon when dark mode is active (clicking switches to light) and a moon icon when light mode is active (clicking switches to dark), with an `aria-label` that describes the action ("Switch to light mode" / "Switch to dark mode").

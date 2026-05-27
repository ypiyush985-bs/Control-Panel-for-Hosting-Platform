/**
 * Mock data module for the Hosting Control Panel.
 * Provides initial state for all context providers.
 *
 * Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
 */

// ── Domains ──────────────────────────────────────────────────────────────────
// 3 entries with mixed statuses: Active, Parked, Redirected

/** @type {import('../types').Domain[]} */
export const MOCK_DOMAINS = [
  {
    id: 'd1',
    name: 'example.com',
    status: 'Active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'd2',
    name: 'mysite.net',
    status: 'Parked',
    createdAt: new Date('2024-03-22'),
  },
  {
    id: 'd3',
    name: 'shop.example.com',
    status: 'Redirected',
    createdAt: new Date('2024-06-01'),
  },
];

// ── Databases ────────────────────────────────────────────────────────────────
// 4 databases with associated users

/** @type {import('../types').Database[]} */
export const MOCK_DATABASES = [
  {
    id: 'db1',
    name: 'wordpress_main',
    sizeMB: 128,
    users: [
      { id: 'dbu1', username: 'wp_admin', databaseId: 'db1' },
      { id: 'dbu2', username: 'wp_readonly', databaseId: 'db1' },
    ],
  },
  {
    id: 'db2',
    name: 'shop_db',
    sizeMB: 256,
    users: [
      { id: 'dbu3', username: 'shop_user', databaseId: 'db2' },
    ],
  },
  {
    id: 'db3',
    name: 'analytics_db',
    sizeMB: 512,
    users: [
      { id: 'dbu4', username: 'analytics_rw', databaseId: 'db3' },
      { id: 'dbu5', username: 'analytics_ro', databaseId: 'db3' },
    ],
  },
  {
    id: 'db4',
    name: 'staging_db',
    sizeMB: 64,
    users: [],
  },
];

// ── Email Accounts ────────────────────────────────────────────────────────────
// 5 entries with mixed statuses

/** @type {import('../types').EmailAccount[]} */
export const MOCK_EMAIL_ACCOUNTS = [
  {
    id: 'em1',
    address: 'admin@example.com',
    domain: 'example.com',
    quotaMB: 1024,
    status: 'Active',
  },
  {
    id: 'em2',
    address: 'support@example.com',
    domain: 'example.com',
    quotaMB: 512,
    status: 'Active',
  },
  {
    id: 'em3',
    address: 'info@mysite.net',
    domain: 'mysite.net',
    quotaMB: 256,
    status: 'Suspended',
  },
  {
    id: 'em4',
    address: 'sales@example.com',
    domain: 'example.com',
    quotaMB: 512,
    status: 'Active',
  },
  {
    id: 'em5',
    address: 'noreply@shop.example.com',
    domain: 'shop.example.com',
    quotaMB: 128,
    status: 'Active',
  },
];

// ── SSL Records ───────────────────────────────────────────────────────────────
// One record per domain with mixed statuses:
//   - example.com: Active (expiring soon — within 30 days)
//   - mysite.net: Active (valid, expires in ~6 months)
//   - shop.example.com: None (no certificate installed)

const NOW = Date.now();
const DAYS_MS = 24 * 60 * 60 * 1000;

/** @type {import('../types').SSLRecord[]} */
export const MOCK_SSL_RECORDS = [
  {
    domainId: 'd1',
    domainName: 'example.com',
    status: 'Active',
    // Expiring in 15 days — triggers the yellow warning indicator
    expiresAt: new Date(NOW + 15 * DAYS_MS),
    issuer: "Let's Encrypt",
  },
  {
    domainId: 'd2',
    domainName: 'mysite.net',
    status: 'Expired',
    // Expired 10 days ago — triggers the red error indicator
    expiresAt: new Date(NOW - 10 * DAYS_MS),
    issuer: 'Comodo CA',
  },
  {
    domainId: 'd3',
    domainName: 'shop.example.com',
    status: 'None',
    expiresAt: null,
    issuer: null,
  },
];

// ── File Tree ─────────────────────────────────────────────────────────────────
// Nested FileNode tree starting from root "/"
// Structure:
//   /
//   ├── public_html/
//   │   ├── index.html
//   │   ├── style.css
//   │   └── images/
//   │       ├── logo.png
//   │       └── banner.jpg
//   ├── logs/
//   │   ├── access.log
//   │   └── error.log
//   └── backups/
//       └── backup_2024-01-15.tar.gz

/** @type {import('../types').FileNode[]} */
export const MOCK_FILE_TREE = [
  {
    id: 'fn-root',
    name: '/',
    type: 'directory',
    parentId: null,
    sizeBytes: 0,
    modifiedAt: new Date('2024-06-01T10:00:00'),
    children: [
      {
        id: 'fn-public-html',
        name: 'public_html',
        type: 'directory',
        parentId: 'fn-root',
        sizeBytes: 0,
        modifiedAt: new Date('2024-06-01T10:00:00'),
        children: [
          {
            id: 'fn-index-html',
            name: 'index.html',
            type: 'file',
            parentId: 'fn-public-html',
            sizeBytes: 4096,
            modifiedAt: new Date('2024-05-20T14:30:00'),
            children: [],
          },
          {
            id: 'fn-style-css',
            name: 'style.css',
            type: 'file',
            parentId: 'fn-public-html',
            sizeBytes: 8192,
            modifiedAt: new Date('2024-05-18T09:15:00'),
            children: [],
          },
          {
            id: 'fn-images',
            name: 'images',
            type: 'directory',
            parentId: 'fn-public-html',
            sizeBytes: 0,
            modifiedAt: new Date('2024-04-10T11:00:00'),
            children: [
              {
                id: 'fn-logo-png',
                name: 'logo.png',
                type: 'file',
                parentId: 'fn-images',
                sizeBytes: 52428,
                modifiedAt: new Date('2024-04-10T11:00:00'),
                children: [],
              },
              {
                id: 'fn-banner-jpg',
                name: 'banner.jpg',
                type: 'file',
                parentId: 'fn-images',
                sizeBytes: 204800,
                modifiedAt: new Date('2024-04-10T11:05:00'),
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'fn-logs',
        name: 'logs',
        type: 'directory',
        parentId: 'fn-root',
        sizeBytes: 0,
        modifiedAt: new Date('2024-06-01T08:00:00'),
        children: [
          {
            id: 'fn-access-log',
            name: 'access.log',
            type: 'file',
            parentId: 'fn-logs',
            sizeBytes: 1048576,
            modifiedAt: new Date('2024-06-01T08:00:00'),
            children: [],
          },
          {
            id: 'fn-error-log',
            name: 'error.log',
            type: 'file',
            parentId: 'fn-logs',
            sizeBytes: 20480,
            modifiedAt: new Date('2024-05-31T23:59:00'),
            children: [],
          },
        ],
      },
      {
        id: 'fn-backups',
        name: 'backups',
        type: 'directory',
        parentId: 'fn-root',
        sizeBytes: 0,
        modifiedAt: new Date('2024-01-15T03:00:00'),
        children: [
          {
            id: 'fn-backup-tar',
            name: 'backup_2024-01-15.tar.gz',
            type: 'file',
            parentId: 'fn-backups',
            sizeBytes: 10485760,
            modifiedAt: new Date('2024-01-15T03:00:00'),
            children: [],
          },
        ],
      },
    ],
  },
];

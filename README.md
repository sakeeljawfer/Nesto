# Nesto Distribution Manager

Offline-first PWA for a Sri Lankan bottled water and beverages distribution business. It runs locally in the browser, stores data in IndexedDB, supports installable desktop/mobile PWA use, and includes JSON/CSV backup tools.

## Features

- Dashboard KPIs for sales, cash collection, pending payments, stock value, low stock, delivery status, profit, recent invoices, and payments
- Inventory with products, pricing, supplier, expiry, reorder warnings, and stock in/out history
- Customer records with route, credit limit, notes, purchase history, and calculated outstanding balance
- Invoice creation with multiple products, discounts, free items, delivery charge, tax, cash/credit/partial payment, print, and PDF
- Payment recording with partial invoice allocation, receipt print, and cash flow updates
- Cash flow for income, expenses, fuel, driver payment, vehicle repair, supplier payment, and closing balance
- Delivery routes with invoice assignment, driver, vehicle, delivery status, returns, and notes
- Supplier records with invoices, payments, and payable balance
- Reports with PDF and CSV exports
- Settings for business details, logo upload, invoice prefix, password change, backup/restore, and guarded reset

## Folder Structure

```text
.
├── public/icons/icon.svg
├── src
│   ├── components
│   │   ├── Layout.tsx
│   │   ├── Toast.tsx
│   │   └── ui.tsx
│   ├── lib
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   └── utils.ts
│   ├── modules
│   │   ├── CashFlow.tsx
│   │   ├── Customers.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Deliveries.tsx
│   │   ├── Inventory.tsx
│   │   ├── Invoices.tsx
│   │   ├── Payments.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   └── Suppliers.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── types.ts
├── index.html
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

## Installation

```bash
npm install
npm run dev
```

Open the printed local URL. Default login:

```text
User: admin
Password: admin123
```

Change the password in Settings before live use.

## Production Build

```bash
npm run build
npm run preview
```

The production output is in `dist/`. The service worker is generated during build and caches the app shell for offline use. After the first successful load, the installed PWA continues to work without internet and after browser refresh or restart.

For a client computer, use the dependency-free local production server:

```bash
npm run build
npm run serve
```

Then open `http://localhost:4173`.

## Install On Chrome

During development, run `npm run dev`, open `http://localhost:5173/`, then use Chrome's install button in the address bar or `Chrome menu -> Cast, save, and share -> Install page as app`.

For the final offline app, run `npm run build` and `npm run preview`, then install from the preview URL. Chrome may need one page refresh after the first load while the service worker activates.

## Offline/PWA Setup

- Vite PWA plugin generates the service worker and web manifest.
- App shell assets are cached locally.
- All libraries, icons, and styles are bundled with the app. No CDN is used.
- Business data is stored in browser IndexedDB through Dexie.
- Backup and restore are available in Settings to avoid local data loss.

## Database Schema

IndexedDB database: `nesto_distribution_db`

- `products`: product name, category, brand, pack size, cost/selling/wholesale price, stock, reorder level, supplier, expiry
- `stockMovements`: product stock in/out/return/adjustment history
- `customers`: shop owner details, contact, address, area/route, credit limit, opening balance, notes
- `invoices`: invoice header, customer, item list, charges, totals, paid amount, status, due date
- `payments`: customer payments linked optionally to invoice
- `cashEntries`: cash in/out, expense categories, daily balances
- `deliveries`: route, assigned invoice IDs, driver, vehicle, delivery status, returned items, notes
- `suppliers`: supplier contact, products supplied, invoice total, paid total
- `settings`: business profile, logo, invoice prefix, currency, local user credentials

## Sample Seed Data

On first launch the app creates sample products, customers, suppliers, one partial invoice, a payment, cash entries, and a delivery route. It only seeds once, unless the local database is cleared.

## Backup Guidance

Use `Settings -> Export JSON backup` regularly. Store backups outside the browser profile, such as a USB drive or cloud folder when internet is available. Restore accepts the exported JSON backup file.

# Obsidian Finance

**Obsidian Finance** is a local-first personal finance manager built with vanilla HTML, CSS, and JavaScript.

It is designed around one principle:

> **The application owns the rules. The user owns the data.**

The project is intentionally generic. It contains no personal accounts, balances, credentials, or financial records.

## Features

- Dynamic user-created accounts
- Dynamic user-created categories
- Income, expense, and transfer transactions
- Opening balances
- Monthly budgets
- Total cash calculation
- Runway estimate
- Equity / total-cash chart
- Income vs expense chart
- Spending-by-category chart
- Account-balance distribution chart
- Transaction search and filtering
- JSON backup and restore
- Legacy-data migration
- Local-first storage
- No bank credentials or financial secrets

## Architecture

```text
User Interface
     │
     ▼
UI Modules
     │
     ▼
Calculation / Validation Core
     │
     ▼
Application State
     │
     ▼
Local Storage
```

Charts consume calculated application state and do not maintain a second source of financial truth.

## Project Structure

```text
obsidian-finance/
├── index.html
├── README.md
├── LICENSE
├── .gitignore
├── css/
│   ├── main.css
│   ├── components.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── core/
│   │   ├── calculations.js
│   │   ├── storage.js
│   │   └── validators.js
│   ├── data/
│   │   └── defaults.js
│   ├── ui/
│   │   ├── dashboard.js
│   │   ├── transactions.js
│   │   └── budgets.js
│   └── charts/
│       └── charts.js
└── data/
    └── .gitkeep


## Data Model

The application stores:

- `settings`
- `accounts`
- `categories`
- `transactions`
- `budgets`

Transactions reference accounts and categories by stable IDs rather than display names.

Transfers reference a source account and destination account.

## Accounting Rules

### Income

Adds to the selected account and increases total cash.

### Expense

Subtracts from the selected account and decreases total cash.

### Transfer

Subtracts from the source account and adds to the destination account.

A transfer does **not** count as income or expense and therefore does not change total cash.

## Storage

Version 1 uses browser `localStorage`.

No financial information is sent to an Obsidian Finance server.

Users can export their complete state as JSON and restore it later.

## Security Principles

Obsidian Finance should never require or store:

- Bank passwords
- PINs
- OTPs
- Card numbers
- API secrets
- Online-banking credentials

Bank integrations, if ever introduced, should use secure OAuth/API flows rather than collecting credentials inside the application.

## Running Locally

Because the project uses JavaScript modules, serve the repository with a local static server.

Examples:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

It can also be deployed as a static site.

## Design Philosophy

Obsidian Finance is:

- Local-first
- User-owned
- Generic
- Lightweight
- Transparent
- Exportable
- Extensible

It is not intended to replace a bank, accounting platform, tax system, or regulated financial service.

## Know limitations (V1)

- Accounts ans categories can be added but not renamed or deleted
- Opening balances connaot be negative
- Runway uses the current month's spendings only
- Data lives in this browser only. use Export regularly to keep a backup

## Roadmap

### v1
- Core finance tracking
- Dynamic accounts/categories
- Budgets
- Analytics
- Backup/restore

### v1.x
- CSV import/export
- Date-range analytics
- Recurring transactions
- Improved reports
- Better mobile UX

### v2+
- Optional encrypted cloud synchronization
- Authentication
- Multi-device sync
- Optional integrations
- PWA/offline installation

Cloud functionality should remain optional so the local-first foundation remains intact.

## License

See `LICENSE`.

# M-Pesa Budget

A mobile app (Expo / React Native) for budgeting and tracking M-Pesa transactions. Confirmation SMS
are pasted into the app, parsed into structured transactions, auto-categorised, and tracked against
monthly budgets. All data stays on the device in SQLite — nothing is uploaded anywhere.

## Features

- **Import** — paste one or many M-Pesa confirmation messages; send money, receive, Pay Bill, Buy
  Goods, agent withdrawal, cash deposit and airtime purchases are recognised, including transaction
  cost and running balance. Duplicate messages are ignored by M-Pesa code.
- **Auto-categorisation** — merchant keyword rules map transactions to categories such as Food &
  Groceries, Transport, Utilities, Rent, Health, Savings & Loans; a category can be changed by
  tapping any transaction.
- **Dashboard** — money in/out, net position, fees paid, top spending categories and recent activity
  for the selected month.
- **Budgets** — per-category monthly limits with progress bars, over-budget highlighting and a copy
  of last month's budgets in one tap.

## Running it

```sh
npm install
npm start        # then press "a" for Android, "w" for web, or scan the QR code with Expo Go
```

Other scripts: `npm test` (parser unit tests), `npm run lint`, `npm run typecheck`.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/lib/mpesaParser.ts` | SMS → structured transaction parsing |
| `src/lib/categories.ts` | category list and keyword-based categorisation |
| `src/db/index.ts` | SQLite schema, transaction/budget queries and aggregates |
| `src/state/AppDataContext.tsx` | month selection and shared data loading |
| `src/screens/` | Dashboard, Activity, Import and Budgets screens |

## Notes

- Android can read M-Pesa SMS automatically, but that requires the `READ_SMS` permission and a
  custom dev build (it is not available in Expo Go). The paste-based import works everywhere today;
  automatic SMS reading is the natural next step.
- The M-Pesa Daraja API only exposes transactions for business (Pay Bill/Till) accounts, so it is
  not a substitute for SMS parsing on a personal number.

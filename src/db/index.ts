import * as SQLite from 'expo-sqlite';

import { suggestCategory } from '../lib/categories';
import { monthKey } from '../lib/format';
import type { ParsedTransaction, TransactionDirection, TransactionKind } from '../lib/mpesaParser';

export interface TransactionRecord {
  id: number;
  code: string;
  kind: TransactionKind;
  direction: TransactionDirection;
  amount: number;
  fee: number;
  balance: number | null;
  counterparty: string;
  accountRef: string | null;
  category: string;
  note: string | null;
  occurredAt: string;
  month: string;
}

export interface BudgetRecord {
  id: number;
  month: string;
  category: string;
  amount: number;
}

export interface CategorySpend {
  category: string;
  spent: number;
}

export interface MonthSummary {
  month: string;
  moneyIn: number;
  moneyOut: number;
  fees: number;
  transactionCount: number;
}

const DATABASE_NAME = 'mpesa-budget.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return databasePromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      direction TEXT NOT NULL,
      amount REAL NOT NULL,
      fee REAL NOT NULL DEFAULT 0,
      balance REAL,
      counterparty TEXT NOT NULL DEFAULT '',
      account_ref TEXT,
      category TEXT NOT NULL DEFAULT 'Uncategorized',
      note TEXT,
      occurred_at TEXT NOT NULL,
      month TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS transactions_month_idx ON transactions (month);
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY NOT NULL,
      month TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      UNIQUE (month, category)
    );
  `);
}

interface TransactionRow {
  id: number;
  code: string;
  kind: TransactionKind;
  direction: TransactionDirection;
  amount: number;
  fee: number;
  balance: number | null;
  counterparty: string;
  account_ref: string | null;
  category: string;
  note: string | null;
  occurred_at: string;
  month: string;
}

function toRecord(row: TransactionRow): TransactionRecord {
  return {
    id: row.id,
    code: row.code,
    kind: row.kind,
    direction: row.direction,
    amount: row.amount,
    fee: row.fee,
    balance: row.balance,
    counterparty: row.counterparty,
    accountRef: row.account_ref,
    category: row.category,
    note: row.note,
    occurredAt: row.occurred_at,
    month: row.month,
  };
}

/**
 * Stores parsed transactions, skipping messages whose M-Pesa code is already saved.
 * Returns how many rows were newly inserted.
 */
export async function saveParsedTransactions(parsed: ParsedTransaction[]): Promise<number> {
  const db = await getDatabase();
  let inserted = 0;

  for (const [index, transaction] of parsed.entries()) {
    const code = transaction.code || `MANUAL-${Date.now()}-${index}`;
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO transactions
         (code, kind, direction, amount, fee, balance, counterparty, account_ref, category, occurred_at, month)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      code,
      transaction.kind,
      transaction.direction,
      transaction.amount,
      transaction.fee,
      transaction.balance,
      transaction.counterparty,
      transaction.accountRef,
      suggestCategory(transaction),
      transaction.occurredAt,
      monthKey(transaction.occurredAt)
    );
    inserted += result.changes;
  }

  return inserted;
}

export async function listTransactions(month: string): Promise<TransactionRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE month = ? ORDER BY occurred_at DESC, id DESC',
    month
  );
  return rows.map(toRecord);
}

export async function listMonths(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ month: string }>(
    'SELECT DISTINCT month FROM transactions ORDER BY month DESC'
  );
  return rows.map((row) => row.month);
}

export async function getMonthSummary(month: string): Promise<MonthSummary> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    money_in: number | null;
    money_out: number | null;
    fees: number | null;
    count: number;
  }>(
    `SELECT
       SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END) AS money_in,
       SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END) AS money_out,
       SUM(fee) AS fees,
       COUNT(*) AS count
     FROM transactions WHERE month = ?`,
    month
  );

  return {
    month,
    moneyIn: row?.money_in ?? 0,
    moneyOut: row?.money_out ?? 0,
    fees: row?.fees ?? 0,
    transactionCount: row?.count ?? 0,
  };
}

export async function getCategorySpend(month: string): Promise<CategorySpend[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ category: string; spent: number }>(
    `SELECT category, SUM(amount + fee) AS spent
       FROM transactions
      WHERE month = ? AND direction = 'out'
      GROUP BY category
      ORDER BY spent DESC`,
    month
  );
  return rows;
}

export async function updateTransactionCategory(id: number, category: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE transactions SET category = ? WHERE id = ?', category, id);
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function listBudgets(month: string): Promise<BudgetRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<BudgetRecord>(
    'SELECT id, month, category, amount FROM budgets WHERE month = ? ORDER BY category',
    month
  );
}

export async function setBudget(month: string, category: string, amount: number): Promise<void> {
  const db = await getDatabase();
  if (amount <= 0) {
    await db.runAsync('DELETE FROM budgets WHERE month = ? AND category = ?', month, category);
    return;
  }
  await db.runAsync(
    `INSERT INTO budgets (month, category, amount) VALUES (?, ?, ?)
     ON CONFLICT (month, category) DO UPDATE SET amount = excluded.amount`,
    month,
    category,
    amount
  );
}

/** Copies every budget from `fromMonth` into `toMonth`, keeping existing entries. */
export async function copyBudgets(fromMonth: string, toMonth: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO budgets (month, category, amount)
     SELECT ?, category, amount FROM budgets WHERE month = ?`,
    toMonth,
    fromMonth
  );
  return result.changes;
}

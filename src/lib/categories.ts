import type { ParsedTransaction } from './mpesaParser';

export interface Category {
  name: string;
  color: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  {
    name: 'Food & Groceries',
    color: '#f97316',
    keywords: ['naivas', 'quickmart', 'carrefour', 'chandarana', 'tuskys', 'mama mboga', 'butchery', 'grocer', 'supermarket', 'bakery', 'java', 'kfc', 'restaurant', 'hotel', 'cafe'],
  },
  {
    name: 'Transport',
    color: '#0ea5e9',
    keywords: ['uber', 'bolt', 'little cab', 'matatu', 'sacco', 'shell', 'total', 'rubis', 'petrol', 'fuel', 'parking', 'nairobi expressway'],
  },
  {
    name: 'Utilities',
    color: '#8b5cf6',
    keywords: ['kplc', 'kenya power', 'water', 'nairobi water', 'zuku', 'safaricom home', 'faiba', 'dstv', 'gotv', 'startimes', 'token'],
  },
  { name: 'Airtime & Data', color: '#14b8a6', keywords: ['airtime', 'bundles', 'data'] },
  { name: 'Rent', color: '#ef4444', keywords: ['rent', 'landlord', 'caretaker', 'apartment', 'estate'] },
  { name: 'Health', color: '#ec4899', keywords: ['pharmacy', 'chemist', 'hospital', 'clinic', 'medical', 'nhif', 'sha'] },
  { name: 'Education', color: '#6366f1', keywords: ['school', 'college', 'university', 'fees', 'tuition'] },
  { name: 'Savings & Loans', color: '#22c55e', keywords: ['m-shwari', 'mshwari', 'kcb', 'fuliza', 'sacco loan', 'chama', 'loan', 'bank'] },
  { name: 'Shopping', color: '#eab308', keywords: ['jumia', 'shop', 'boutique', 'store', 'electronics', 'salon', 'barber'] },
  { name: 'Cash', color: '#64748b', keywords: ['withdraw', 'agent', 'atm'] },
  { name: 'Income', color: '#16a34a', keywords: [] },
  { name: 'Uncategorized', color: '#94a3b8', keywords: [] },
];

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.name, category.color])
);

/**
 * Picks a category for a parsed transaction using merchant keyword rules.
 */
export function suggestCategory(transaction: ParsedTransaction): string {
  if (transaction.direction === 'in') return 'Income';
  if (transaction.kind === 'airtime') return 'Airtime & Data';
  if (transaction.kind === 'withdraw') return 'Cash';

  const haystack = `${transaction.counterparty} ${transaction.accountRef ?? ''}`.toLowerCase();
  for (const category of CATEGORIES) {
    if (category.keywords.some((keyword) => haystack.includes(keyword))) {
      return category.name;
    }
  }
  return 'Uncategorized';
}

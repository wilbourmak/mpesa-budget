export function formatKes(amount: number, options: { compact?: boolean } = {}): string {
  const value = Math.abs(amount);
  if (options.compact && value >= 1000) {
    return `KSh ${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}k`;
  }
  return `KSh ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${formatDate(iso)}, ${date.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })}`;
}

/** Returns the `YYYY-MM` key used to group transactions and budgets by month. */
export function monthKey(iso: string | Date = new Date()): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
}

export function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number);
  return monthKey(new Date(year, month - 1 + delta, 1));
}

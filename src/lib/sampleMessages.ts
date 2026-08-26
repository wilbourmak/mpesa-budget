import { monthKey } from './format';

const TEMPLATES = [
  'QK{n}A1B2C3D Confirmed. Ksh2,450.00 paid to NAIVAS SUPERMARKET LTD. on {d}/{m}/{y} at 6:12 PM. New M-PESA balance is Ksh18,320.00. Transaction cost, Ksh0.00.',
  'QK{n}B2C3D4E Confirmed. Ksh1,200.00 sent to KPLC PREPAID for account 37281920 on {d}/{m}/{y} at 8:00 AM. New M-PESA balance is Ksh17,120.00. Transaction cost, Ksh0.00.',
  'QK{n}C3D4E5F Confirmed. Ksh350.00 paid to BOLT KENYA. on {d}/{m}/{y} at 7:40 PM. New M-PESA balance is Ksh16,770.00. Transaction cost, Ksh0.00.',
  'QK{n}D4E5F6G Confirmed. You bought Ksh200.00 of airtime on {d}/{m}/{y} at 9:15 AM. New M-PESA balance is Ksh16,570.00.',
  'QK{n}E5F6G7H Confirmed. Ksh18,000.00 sent to JAMES LANDLORD 0712345678 on {d}/{m}/{y} at 10:00 AM. New M-PESA balance is Ksh12,000.00. Transaction cost, Ksh55.00.',
  'QK{n}F6G7H8I Confirmed.on {d}/{m}/{y} at 5:30 PM Withdraw Ksh3,000.00 from 123456 - MAMA MBOGA AGENT New M-PESA balance is Ksh9,000.00. Transaction cost, Ksh29.00.',
  'QK{n}G7H8I9J Confirmed. You have received Ksh45,000.00 from ACME PAYROLL 0700000000 on {d}/{m}/{y} at 1:05 PM. New M-PESA balance is Ksh54,000.00.',
  'QK{n}H8I9J0K Confirmed. Ksh1,850.00 paid to GOODLIFE PHARMACY. on {d}/{m}/{y} at 4:20 PM. New M-PESA balance is Ksh52,150.00. Transaction cost, Ksh0.00.',
];

/** Builds a demo batch of M-Pesa messages spread across the current month. */
export function sampleMessages(month: string = monthKey()): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return TEMPLATES.map((template, index) =>
    template
      .replace('{n}', String(index + 1))
      .replace('{d}', String(index * 3 + 2))
      .replace('{m}', String(monthNumber))
      .replace('{y}', String(year).slice(2))
  ).join('\n');
}

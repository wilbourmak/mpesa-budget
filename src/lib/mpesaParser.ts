export type TransactionKind =
  | 'send'
  | 'receive'
  | 'paybill'
  | 'buygoods'
  | 'withdraw'
  | 'deposit'
  | 'airtime'
  | 'other';

export type TransactionDirection = 'in' | 'out';

export interface ParsedTransaction {
  code: string;
  kind: TransactionKind;
  direction: TransactionDirection;
  amount: number;
  fee: number;
  balance: number | null;
  counterparty: string;
  accountRef: string | null;
  occurredAt: string;
  raw: string;
}

const AMOUNT = String.raw`(?:Ksh|KES)\s?([\d,]+(?:\.\d{1,2})?)`;
const DATE_TIME = String.raw`on (\d{1,2}\/\d{1,2}\/\d{2,4}) at (\d{1,2}:\d{2}\s?(?:AM|PM))`;

interface Rule {
  kind: TransactionKind;
  direction: TransactionDirection;
  pattern: RegExp;
  counterpartyGroup?: number;
  accountRefGroup?: number;
  staticCounterparty?: string;
}

const RULES: Rule[] = [
  {
    kind: 'paybill',
    direction: 'out',
    pattern: new RegExp(`${AMOUNT} sent to (.+?) for account ([^\\s].*?) ${DATE_TIME}`, 'i'),
    counterpartyGroup: 2,
    accountRefGroup: 3,
  },
  {
    kind: 'send',
    direction: 'out',
    pattern: new RegExp(`${AMOUNT} sent to (.+?) ${DATE_TIME}`, 'i'),
    counterpartyGroup: 2,
  },
  {
    kind: 'buygoods',
    direction: 'out',
    pattern: new RegExp(`${AMOUNT} paid to (.+?)\\.? ${DATE_TIME}`, 'i'),
    counterpartyGroup: 2,
  },
  {
    kind: 'receive',
    direction: 'in',
    pattern: new RegExp(`You have received ${AMOUNT} from (.+?) ${DATE_TIME}`, 'i'),
    counterpartyGroup: 2,
  },
  {
    kind: 'airtime',
    direction: 'out',
    pattern: new RegExp(`You bought ${AMOUNT} of airtime(?: for (\\d+))? ${DATE_TIME}`, 'i'),
    accountRefGroup: 2,
    staticCounterparty: 'Airtime',
  },
  {
    kind: 'withdraw',
    direction: 'out',
    pattern: new RegExp(`${DATE_TIME} Withdraw ${AMOUNT} from (.+?)\\s*(?:New M-PESA balance|$)`, 'i'),
    counterpartyGroup: 4,
  },
  {
    kind: 'deposit',
    direction: 'in',
    pattern: new RegExp(`Give ${AMOUNT} cash to (.+?) ${DATE_TIME}`, 'i'),
    counterpartyGroup: 2,
  },
];

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  return Number(value.replace(/,/g, ''));
}

function cleanName(value: string | undefined): string {
  if (!value) return '';
  return value
    .replace(/\s+/g, ' ')
    .replace(/[.,]+$/, '')
    .replace(/\s+\d{7,}$/, '')
    .trim();
}

/**
 * Converts an M-Pesa `d/m/yy at h:mm AM` timestamp into an ISO 8601 string.
 */
function toIsoDate(date: string, time: string): string {
  const [day, month, shortYear] = date.split('/').map((part) => Number(part));
  const year = shortYear < 100 ? 2000 + shortYear : shortYear;
  const match = /(\d{1,2}):(\d{2})\s?(AM|PM)/i.exec(time);
  let hours = match ? Number(match[1]) % 12 : 0;
  const minutes = match ? Number(match[2]) : 0;
  if (match && /PM/i.test(match[3])) hours += 12;
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

function matchDateGroups(rule: Rule, match: RegExpMatchArray): [string, string] | null {
  const groups = match.slice(1);
  const dateIndex = groups.findIndex((group) => group && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(group));
  if (dateIndex === -1) return null;
  const date = groups[dateIndex];
  const time = groups[dateIndex + 1];
  if (!date || !time) return null;
  return [date, time];
}

/**
 * Parses a single M-Pesa confirmation SMS. Returns null when the text does not
 * look like a supported M-Pesa message.
 */
export function parseMpesaSms(message: string): ParsedTransaction | null {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const codeMatch = /\b([A-Z0-9]{10})\b(?=\s+Confirmed)/i.exec(text);
  const feeMatch = new RegExp(`Transaction cost,? ${AMOUNT}`, 'i').exec(text);
  const balanceMatch = new RegExp(`M-PESA balance is ${AMOUNT}`, 'i').exec(text);

  for (const rule of RULES) {
    const match = rule.pattern.exec(text);
    if (!match) continue;
    const dateParts = matchDateGroups(rule, match);
    if (!dateParts) continue;
    const amountGroup = match.slice(1).find((group) => group && /^[\d,]+(\.\d{1,2})?$/.test(group));

    return {
      code: codeMatch ? codeMatch[1].toUpperCase() : '',
      kind: rule.kind,
      direction: rule.direction,
      amount: toNumber(amountGroup),
      fee: toNumber(feeMatch?.[1]),
      balance: balanceMatch ? toNumber(balanceMatch[1]) : null,
      counterparty:
        rule.staticCounterparty ??
        cleanName(rule.counterpartyGroup ? match[rule.counterpartyGroup] : undefined),
      accountRef: rule.accountRefGroup ? cleanName(match[rule.accountRefGroup]) || null : null,
      occurredAt: toIsoDate(dateParts[0], dateParts[1]),
      raw: text,
    };
  }

  return null;
}

/**
 * Splits a pasted blob of SMS text into individual messages and parses each one.
 */
export function parseMpesaSmsBatch(blob: string): ParsedTransaction[] {
  return blob
    .split(/\n{2,}|(?=\b[A-Z0-9]{10}\s+Confirmed)/g)
    .map((chunk) => parseMpesaSms(chunk))
    .filter((parsed): parsed is ParsedTransaction => parsed !== null);
}

import { parseMpesaSms, parseMpesaSmsBatch } from '../mpesaParser';
import { sampleMessages } from '../sampleMessages';

describe('parseMpesaSms', () => {
  it('parses a send money message', () => {
    const parsed = parseMpesaSms(
      'TFA1B2C3D4 Confirmed. Ksh1,500.00 sent to JOHN DOE 0712345678 on 15/6/24 at 3:45 PM. New M-PESA balance is Ksh3,200.00. Transaction cost, Ksh23.00.'
    );

    expect(parsed).toMatchObject({
      code: 'TFA1B2C3D4',
      kind: 'send',
      direction: 'out',
      amount: 1500,
      fee: 23,
      balance: 3200,
      counterparty: 'JOHN DOE',
    });
    expect(parsed?.occurredAt.startsWith('2024-06-15')).toBe(true);
  });

  it('parses a received money message', () => {
    const parsed = parseMpesaSms(
      'TFB2C3D4E5 Confirmed. You have received Ksh2,000.00 from JANE WANJIKU 0722000000 on 1/7/24 at 9:05 AM. New M-PESA balance is Ksh5,200.00.'
    );

    expect(parsed).toMatchObject({
      kind: 'receive',
      direction: 'in',
      amount: 2000,
      fee: 0,
      counterparty: 'JANE WANJIKU',
    });
  });

  it('parses a buy goods message', () => {
    expect(
      parseMpesaSms(
        'TFC3D4E5F6 Confirmed. Ksh450.00 paid to NAIVAS SUPERMARKET LTD. on 2/7/24 at 6:12 PM. New M-PESA balance is Ksh4,750.00. Transaction cost, Ksh0.00.'
      )
    ).toMatchObject({
      kind: 'buygoods',
      direction: 'out',
      amount: 450,
      counterparty: 'NAIVAS SUPERMARKET LTD',
    });
  });

  it('parses a paybill message with an account reference', () => {
    expect(
      parseMpesaSms(
        'TFD4E5F6G7 Confirmed. Ksh1,200.00 sent to KPLC PREPAID for account 37281920 on 3/7/24 at 8:00 AM. New M-PESA balance is Ksh3,550.00. Transaction cost, Ksh0.00.'
      )
    ).toMatchObject({
      kind: 'paybill',
      direction: 'out',
      amount: 1200,
      counterparty: 'KPLC PREPAID',
      accountRef: '37281920',
    });
  });

  it('parses an agent withdrawal message', () => {
    expect(
      parseMpesaSms(
        'TFE5F6G7H8 Confirmed.on 4/7/24 at 5:30 PM Withdraw Ksh1,000.00 from 123456 - MAMA MBOGA AGENT New M-PESA balance is Ksh2,530.00. Transaction cost, Ksh29.00.'
      )
    ).toMatchObject({
      kind: 'withdraw',
      direction: 'out',
      amount: 1000,
      fee: 29,
      counterparty: '123456 - MAMA MBOGA AGENT',
    });
  });

  it('parses an airtime purchase message', () => {
    expect(
      parseMpesaSms(
        'TFF6G7H8I9 Confirmed. You bought Ksh100.00 of airtime on 5/7/24 at 7:45 AM. New M-PESA balance is Ksh2,430.00.'
      )
    ).toMatchObject({ kind: 'airtime', direction: 'out', amount: 100, counterparty: 'Airtime' });
  });

  it('parses a cash deposit message', () => {
    expect(
      parseMpesaSms(
        'TFG7H8I9J0 Confirmed. Give Ksh3,000.00 cash to KIMATHI AGENT on 6/7/24 at 11:15 AM. New M-PESA balance is Ksh5,430.00.'
      )
    ).toMatchObject({ kind: 'deposit', direction: 'in', amount: 3000 });
  });

  it('returns null for unrelated text', () => {
    expect(parseMpesaSms('Hello, are we still meeting at 5?')).toBeNull();
    expect(parseMpesaSms('')).toBeNull();
  });
});

describe('parseMpesaSmsBatch', () => {
  it('parses several messages pasted together', () => {
    const blob = `TFA1B2C3D4 Confirmed. Ksh1,500.00 sent to JOHN DOE 0712345678 on 15/6/24 at 3:45 PM. New M-PESA balance is Ksh3,200.00. Transaction cost, Ksh23.00.
TFB2C3D4E5 Confirmed. You have received Ksh2,000.00 from JANE WANJIKU 0722000000 on 1/7/24 at 9:05 AM. New M-PESA balance is Ksh5,200.00.

some unrelated chatter

TFC3D4E5F6 Confirmed. Ksh450.00 paid to NAIVAS SUPERMARKET LTD. on 2/7/24 at 6:12 PM. New M-PESA balance is Ksh4,750.00.`;

    const parsed = parseMpesaSmsBatch(blob);
    expect(parsed.map((item) => item.kind)).toEqual(['send', 'receive', 'buygoods']);
  });

  it('parses every bundled sample message and gives each a unique code', () => {
    const parsed = parseMpesaSmsBatch(sampleMessages('2026-08'));
    expect(parsed).toHaveLength(8);
    expect(new Set(parsed.map((item) => item.code)).size).toBe(8);
    for (const transaction of parsed) {
      expect(transaction.code).toMatch(/^[A-Z0-9]{10}$/);
    }
  });
});

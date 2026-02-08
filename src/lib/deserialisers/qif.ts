import { Deserialiser, Transaction } from 'transaction-serde';

import { ENTRY_END, HEADER_VALUES } from '../../types/qif';
import type { Header } from '../../types/qif';
import { parseDateStrings } from '../../utilities/dates';

function isValidHeader(header: unknown): header is Header {
  return HEADER_VALUES.includes(header as Header);
}

const fieldMap: { [key: string]: keyof Transaction } = {
  D: 'date',
  T: 'amount',
  P: 'payee',
  M: 'description',
  L: 'category',
};

/**
 * Deserialises a QIF (Quicken Interchange Format) string to an array of transactions.
 *
 * Parses a QIF string into transaction objects. Supports standard QIF field indicators
 * (D for date, T for amount, P for payee, M for description, L for category).
 * Dates are automatically parsed from various string formats.
 *
 * @example
 * ```ts
 * import { deserialisers } from 'transaction-serde';
 *
 * const qif = '!Type:Bank\nD2024-01-15\nT100\nPStore\n^';
 * const transactions = deserialisers.qif(qif);
 * // => [{ date: Date, amount: 100, payee: 'Store' }]
 * ```
 *
 * @param input - A QIF string with a valid header.
 * @returns An array of parsed transaction objects.
 * @throws {Error} If the QIF header is unknown or invalid.
 */
const handler: Deserialiser = (input: string) => {
  const lines = input.trim().split('\n');
  const header = lines.shift();
  if (!isValidHeader(header)) throw Error('Unknown header: ' + header);
  const transactions: Transaction[] = [{}];
  const dates: { date: string; transaction: Transaction }[] = [];
  while (lines.length > 0) {
    const line = lines.shift();
    if (!line) continue;
    const indicator = line.charAt(0);
    if (indicator === ENTRY_END && lines.length > 0) {
      transactions.push({});
      continue;
    } else if (indicator === ENTRY_END) break;
    const transaction = transactions.at(-1) as Transaction;
    if (!(indicator in fieldMap)) continue;
    const fieldName = fieldMap[indicator];
    const fieldValue = line.substring(1);
    switch (fieldName) {
      case 'date':
        dates.push({ date: fieldValue, transaction });
        break;
      case 'amount': {
        const parsed = parseFloat(fieldValue);
        if (!Number.isFinite(parsed)) {
          throw new TypeError('Could not parse amount');
        }
        transaction.amount = parsed;
        break;
      }
      case 'payee':
      case 'description':
      case 'category':
        transaction[fieldName] = fieldValue;
        break;
    }
  }
  const parsedDates = parseDateStrings(dates.map((d) => d.date));
  parsedDates.forEach((date, i) => (dates[i].transaction.date = date));
  return transactions;
};
export default handler;

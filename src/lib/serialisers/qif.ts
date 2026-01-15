import { Serialiser, Transaction } from 'transaction-serde';

import { ENTRY_END, HEADER_VALUES, HEADERS } from '../../types/qif';
import { mergeOptions } from '../../utilities/options';

const fieldMap: { [key in keyof Transaction]: string } = {
  date: 'D',
  amount: 'T',
  payee: 'P',
  description: 'M',
  category: 'L',
};

type SerialiserOptions = {
  locale: string | string[];
  header: (typeof HEADER_VALUES)[number];
};

const defaultOptions: SerialiserOptions = {
  locale: 'en-US',
  header: HEADERS.BANK,
};

/**
 * Serialises an array of transactions to QIF (Quicken Interchange Format).
 *
 * Converts transaction objects to a QIF string. Each transaction is represented with
 * field indicators (D for date, T for amount, P for payee, M for description, L for category).
 * Transactions without valid dates or amounts are skipped.
 *
 * @example
 * ```ts
 * import { serialisers } from 'transaction-serde';
 *
 * const transactions = [
 *   { date: new Date('2024-01-15'), amount: 100, payee: 'Store' }
 * ];
 * const qif = serialisers.qif(transactions);
 * // => '!Type:Bank\nD2024-01-15\nT100\nPStore\n^'
 * ```
 *
 * @param input - Array of transaction objects to serialise.
 * @param options - Optional configuration for serialisation.
 * @param options.locale - Locale for number formatting (default: 'en-US').
 * @param options.header - QIF account type header (default: '!Type:Bank').
 * @returns A QIF string representation of the transactions.
 */
const handler: Serialiser<SerialiserOptions> = (input, options) => {
  const { locale, header } = mergeOptions(defaultOptions, options);
  const output: string[] = [header];
  for (const transaction of input) {
    const { date, amount } = transaction;
    if (
      !(date instanceof Date) ||
      Number.isNaN(date.getTime()) ||
      typeof amount !== 'number'
    )
      continue;
    Object.keys(transaction).forEach((key) => {
      const validKey = key as keyof Transaction;
      switch (validKey) {
        case 'date':
          output.push(fieldMap.date + date.toISOString().substring(0, 10));
          break;
        case 'amount':
          output.push(fieldMap.amount + amount.toLocaleString(locale));
          break;
        default:
          if (typeof transaction[validKey] === 'string') {
            const value = transaction[validKey] as string;
            output.push(fieldMap[validKey] + value);
          }
      }
    });
    output.push(ENTRY_END);
  }
  return output.join('\n');
};
export default handler;

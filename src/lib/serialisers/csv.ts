import { unparse } from 'papaparse';
import { Serialiser } from 'transaction-serde';

import { transactionKeys } from '../../types/common';

/**
 * Serialises an array of transactions to CSV format.
 *
 * Converts transaction objects to a CSV string with headers. Dates are formatted as ISO 8601
 * date strings (YYYY-MM-DD). String fields are quoted while numeric amounts are unquoted.
 * Transactions with invalid or missing dates are skipped.
 *
 * @example
 * ```ts
 * import { serialisers } from 'transaction-serde';
 *
 * const transactions = [
 *   { date: new Date('2024-01-15'), amount: 100, payee: 'Store' }
 * ];
 * const csv = serialisers.csv(transactions);
 * // => '"date",100,"Store"\n"2024-01-15",100,"Store"'
 * ```
 *
 * @param input - Array of transaction objects to serialise.
 * @returns A CSV string representation of the transactions with headers.
 */
const handler: Serialiser = (input) => {
  const output: { [key: string]: string | number }[] = [];
  for (const transaction of input) {
    const { date, ...rest } = transaction;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) continue;
    output.push({ date: date.toISOString().substring(0, 10), ...rest });
  }
  const quoteColumns = transactionKeys.map((key) =>
    key === 'amount' ? false : true
  );
  return unparse(output, {
    header: true,
    quotes: quoteColumns,
    newline: '\n',
  });
};
export default handler;

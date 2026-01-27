import { unparse } from 'papaparse';
import { Serialiser } from 'transaction-serde';

import { formatTimeString } from '../../utilities/times';

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
  const hasTimeData = input.some((t) => t.time !== undefined);
  const output: { [key: string]: string | number }[] = [];
  for (const transaction of input) {
    const { date, time, metadata, ...rest } = transaction;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) continue;
    const row: { [key: string]: string | number } = {
      date: date.toISOString().substring(0, 10),
      ...rest,
    };
    if (hasTimeData) {
      row.time = time !== undefined ? formatTimeString(time) : '';
    }
    if (metadata !== undefined) {
      row.metadata = JSON.stringify(metadata);
    }
    output.push(row);
  }
  // Get column order from all unique keys in output
  const columns = [
    ...new Set(output.flatMap((row) => Object.keys(row))),
  ] as string[];
  const quoteColumns = columns.map((key) => key !== 'amount');
  return unparse(output, {
    header: true,
    quotes: quoteColumns,
    columns,
    newline: '\n',
  });
};
export default handler;

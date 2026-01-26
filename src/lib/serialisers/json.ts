import { Serialiser } from 'transaction-serde';

/**
 * Serialises an array of transactions to JSON format.
 *
 * Converts transaction objects to a JSON string with dates formatted as ISO 8601 date strings (YYYY-MM-DD).
 * Transactions with invalid or missing dates are skipped.
 *
 * @example
 * ```ts
 * import { serialisers } from 'transaction-serde';
 *
 * const transactions = [
 *   { date: new Date('2024-01-15'), amount: 100, payee: 'Store' }
 * ];
 * const json = serialisers.json(transactions);
 * // => '[{"date":"2024-01-15","amount":100,"payee":"Store"}]'
 * ```
 *
 * @param input - Array of transaction objects to serialise.
 * @returns A JSON string representation of the transactions.
 */
const handler: Serialiser = (input) => {
  const output: {
    [key: string]: string | number | Record<string, unknown>;
  }[] = [];
  for (const transaction of input) {
    const { date, ...rest } = transaction;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) continue;
    output.push({ date: date.toISOString().substring(0, 10), ...rest });
  }
  return JSON.stringify(output);
};
export default handler;

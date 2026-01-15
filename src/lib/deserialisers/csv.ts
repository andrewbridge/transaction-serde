import { parse } from 'papaparse';
import { Deserialiser, Transaction, TransactionLike } from 'transaction-serde';

import { transactionKeys } from '../../types/common';
import { parseDateStrings } from '../../utilities/dates';
import { mergeOptions } from '../../utilities/options';

type DeserialiserOptions = {
  headers: boolean;

  map: (object: Record<string, unknown>) => TransactionLike | null;
};

const defaultOptions: DeserialiserOptions = {
  headers: true,
  map: (object) => {
    const transaction: TransactionLike = {};
    if (typeof object !== 'object' || object === null) return null;
    transactionKeys.forEach((key) => {
      const value = object[key];
      if (typeof value === 'string') {
        transaction[key] = value;
      }
    });
    return transaction;
  },
};

/**
 * Deserialises a CSV string to an array of transactions.
 *
 * Parses a CSV string with headers into transaction objects. Dates are automatically
 * parsed from various string formats. Rows missing required fields (date, amount)
 * are skipped. A custom mapping function can be provided to handle non-standard CSV formats.
 *
 * @example
 * ```ts
 * import { deserialisers } from 'transaction-serde';
 *
 * const csv = 'date,amount,payee\n2024-01-15,100,Store';
 * const transactions = deserialisers.csv(csv);
 * // => [{ date: Date, amount: 100, payee: 'Store' }]
 * ```
 *
 * @example
 * ```ts
 * // Custom mapping for non-standard CSV headers
 * const csv = 'Date,Value,Merchant\n2024-01-15,100,Store';
 * const transactions = deserialisers.csv(csv, {
 *   map: (row) => ({
 *     date: row.Date,
 *     amount: row.Value,
 *     payee: row.Merchant
 *   })
 * });
 * ```
 *
 * @param input - A CSV string with headers.
 * @param options - Optional configuration for parsing.
 * @param options.headers - Whether the CSV has headers (default: true).
 * @param options.map - Custom function to map CSV rows to transaction-like objects.
 * @returns An array of parsed transaction objects.
 * @throws {Error} If the CSV data is invalid.
 * @throws {TypeError} If an amount cannot be parsed as a number.
 */
const handler: Deserialiser<DeserialiserOptions> = (input, options) => {
  const { headers, map } = mergeOptions(defaultOptions, options);
  const objects = parse(input.trim(), { header: headers });
  if (objects.errors.length > 0) {
    console.debug(objects.errors);
  }
  if (objects.errors.length > 0 && objects.data.length === 0) {
    throw new Error('Invalid CSV data');
  }
  /*   const objects: TransactionLike[] = await new Promise((resolve, reject) => {
    const rows: TransactionLike[] = [];
    parseString<Record<string, unknown>, Transaction>(input, { headers })
      .transform(map)
      .on('data', (row: TransactionLike) => rows.push(row))
      .on('error', (error) => reject(error))
      .on('end', () => resolve(rows));
  }); */
  const transactions: Transaction[] = [];
  const dates: { date: string; transaction: Transaction }[] = [];
  objects.data.forEach((object) => {
    const transactionLike = map(object as Record<string, unknown>);
    if (transactionLike === null) return; // Exit early for invalid objects
    if (
      typeof transactionLike.date !== 'string' ||
      transactionLike.date.length === 0 ||
      typeof transactionLike.amount !== 'string' ||
      transactionLike.amount.length === 0
    )
      return; // Exit early for objects without critical data items
    const transaction: Transaction = {};
    const dateString = transactionLike.date;
    Object.keys(transactionLike).forEach((key) => {
      switch (key) {
        case 'date':
          dates.push({ date: dateString, transaction });
          break;
        case 'amount':
          if (typeof transactionLike.amount === 'string') {
            transaction.amount = parseFloat(transactionLike.amount);
            if (!Number.isFinite(transaction.amount)) {
              throw new TypeError('Could not parse amount');
            }
          }
          break;
        case 'payee':
        case 'description':
        case 'category':
          if (typeof transactionLike[key] === 'string') {
            transaction[key] = transactionLike[key] as string;
          }
          break;
      }
    });
    transactions.push(transaction);
  });
  const parsedDates = parseDateStrings(dates.map((d) => d.date));
  parsedDates.forEach((date, i) => (dates[i].transaction.date = date));
  return transactions;
};
export default handler;

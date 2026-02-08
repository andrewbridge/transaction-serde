import { parse } from 'papaparse';
import { Deserialiser, Transaction, TransactionLike } from 'transaction-serde';

import { parseDateStrings } from '../../utilities/dates';
import { defaultFieldMapper } from '../../utilities/fieldMapper';
import { mergeOptions } from '../../utilities/options';
import { parseMetadata } from '../../utilities/parse';
import { parseTimeStrings } from '../../utilities/times';

type DeserialiserOptions = {
  headers: boolean;
  skipRows: number;

  map: (object: Record<string, unknown>) => TransactionLike | null;
};

const defaultOptions: DeserialiserOptions = {
  headers: true,
  skipRows: 0,
  map: defaultFieldMapper,
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
const handler: Deserialiser<Partial<DeserialiserOptions>> = (
  input,
  options
) => {
  const { headers, skipRows, map } = mergeOptions(defaultOptions, options);
  const objects = parse(input.trim(), {
    header: headers,
    skipFirstNLines: skipRows,
  });
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
  const times: { time: string; transaction: Transaction }[] = [];
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
        case 'time':
          if (
            typeof transactionLike.time === 'string' &&
            transactionLike.time.length > 0
          ) {
            times.push({ time: transactionLike.time, transaction });
          }
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
        case 'metadata': {
          const metadata = parseMetadata(transactionLike.metadata);
          if (metadata !== undefined) {
            transaction.metadata = metadata;
          }
          break;
        }
      }
    });
    transactions.push(transaction);
  });
  const parsedDates = parseDateStrings(dates.map((d) => d.date));
  parsedDates.forEach((date, i) => (dates[i].transaction.date = date));
  if (times.length > 0) {
    const parsedTimes = parseTimeStrings(times.map((t) => t.time));
    parsedTimes.forEach((time, i) => (times[i].transaction.time = time));
  }
  return transactions;
};
export default handler;

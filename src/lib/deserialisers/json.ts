import { Deserialiser, Transaction, TransactionLike } from 'transaction-serde';

import { parseDateStrings } from '../../utilities/dates';
import { defaultFieldMapper } from '../../utilities/fieldMapper';
import { mergeOptions } from '../../utilities/options';
import { parseMetadata } from '../../utilities/parse';
import { parseTimeStrings } from '../../utilities/times';

type DeserialiserOptions = {
  map: (object: Record<string, unknown>) => TransactionLike | null;
};

const defaultOptions: DeserialiserOptions = {
  map: defaultFieldMapper,
};

/**
 * Deserialises a JSON string to an array of transactions.
 *
 * Parses a JSON string containing an array of transaction objects. Dates are automatically
 * parsed from various string formats. Transactions missing required fields (date, amount)
 * are skipped. A custom mapping function can be provided to handle non-standard JSON formats.
 *
 * @example
 * ```ts
 * import { deserialisers } from 'transaction-serde';
 *
 * const json = '[{"date":"2024-01-15","amount":100,"payee":"Store"}]';
 * const transactions = deserialisers.json(json);
 * // => [{ date: Date, amount: 100, payee: 'Store' }]
 * ```
 *
 * @example
 * ```ts
 * // Custom mapping for non-standard JSON fields
 * const json = '[{"transactionDate":"2024-01-15","value":100,"merchant":"Store"}]';
 * const transactions = deserialisers.json(json, {
 *   map: (row) => ({
 *     date: row.transactionDate,
 *     amount: row.value,
 *     payee: row.merchant
 *   })
 * });
 * ```
 *
 * @param input - A JSON string containing an array of transaction objects.
 * @param options - Optional configuration for parsing.
 * @param options.map - Custom function to map JSON objects to transaction-like objects.
 * @returns An array of parsed transaction objects.
 * @throws {Error} If the input is not valid JSON.
 * @throws {Error} If the input is not an array.
 * @throws {TypeError} If an amount cannot be parsed as a number.
 */
const handler: Deserialiser<DeserialiserOptions> = (input, options) => {
  const { map } = mergeOptions(defaultOptions, options);
  let objects: { [key: string]: unknown }[] = [];
  try {
    objects = JSON.parse(input);
  } catch {
    throw Error('Input is not valid JSON');
  }
  if (!Array.isArray(objects)) {
    throw Error('Input is not an array');
  }
  const transactions: Transaction[] = [];
  const dates: { date: string; transaction: Transaction }[] = [];
  const times: { time: string; transaction: Transaction }[] = [];
  objects.forEach((object) => {
    const transactionLike = map(object as Record<string, unknown>);
    if (transactionLike === null) return;
    if (
      typeof transactionLike.date !== 'string' ||
      transactionLike.date.length === 0 ||
      typeof transactionLike.amount !== 'string' ||
      transactionLike.amount.length === 0
    )
      return;
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

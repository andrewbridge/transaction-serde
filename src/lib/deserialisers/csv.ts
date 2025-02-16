import { parseString } from '@fast-csv/parse';
import { Deserialiser, Transaction, TransactionLike } from 'transaction-serde';

import { transactionKeys } from '../../types/common';
import { parseDateStrings } from '../../utilities/dates';
import { mergeOptions } from '../../utilities/options';

type DeserialiserOptions = {
  headers: boolean;

  map: (object: Record<string, unknown>) => TransactionLike;
};

const defaultOptions: DeserialiserOptions = {
  headers: true,
  map: (object) => {
    const transaction: TransactionLike = {};
    if (typeof object !== 'object' || object === null) return transaction;
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
 * Multiplies a value by 2. (Also a full example of TypeDoc's functionality.)
 *
 * ### Example (es module)
 * ```js
 * import { double } from 'typescript-starter'
 * console.log(double(4))
 * // => 8
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * var double = require('typescript-starter').double;
 * console.log(double(4))
 * // => 8
 * ```
 *
 * @param value - Comment describing the `value` parameter.
 * @returns Comment describing the return type.
 * @anotherNote Some other value.
 */
const handler: Deserialiser<DeserialiserOptions> = async (input, options) => {
  const { headers, map } = mergeOptions(defaultOptions, options);
  const objects: TransactionLike[] = await new Promise((resolve, reject) => {
    const rows: TransactionLike[] = [];
    parseString<Record<string, unknown>, Transaction>(input, { headers })
      .transform(map)
      .on('data', (row: TransactionLike) => rows.push(row))
      .on('error', (error) => reject(error))
      .on('end', () => resolve(rows));
  });
  const transactions: Transaction[] = [];
  const dates: { date: string; transaction: Transaction }[] = [];
  while (objects.length > 0) {
    const object = objects.shift();
    if (!object) continue;
    if (
      typeof object.date !== 'string' ||
      object.date.length === 0 ||
      typeof object.amount !== 'string' ||
      object.amount.length === 0
    )
      continue;
    const transaction: Transaction = {};
    const dateString = object.date;
    Object.keys(object).forEach((key) => {
      switch (key) {
        case 'date':
          dates.push({ date: dateString, transaction });
          break;
        case 'amount':
          if (typeof object.amount === 'string') {
            transaction.amount = parseFloat(object.amount);
            if (!Number.isFinite(transaction.amount)) {
              throw new TypeError('Could not parse amount');
            }
          }
          break;
        case 'payee':
        case 'description':
        case 'category':
          if (typeof object[key] === 'string') {
            transaction[key] = object[key] as string;
          }
          break;
      }
    });
    transactions.push(transaction);
  }
  const parsedDates = parseDateStrings(dates.map((d) => d.date));
  parsedDates.forEach((date, i) => (dates[i].transaction.date = date));
  return transactions;
};
export default handler;

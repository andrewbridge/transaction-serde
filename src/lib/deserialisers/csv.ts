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
const handler: Deserialiser<DeserialiserOptions> = (input, options) => {
  const { headers, map } = mergeOptions(defaultOptions, options);
  const objects = parse(input, { header: headers });
  if (objects.errors.length > 0) {
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

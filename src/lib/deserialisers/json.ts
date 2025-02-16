import { Deserialiser, Transaction } from 'transaction-serde';

import { parseDateStrings } from '../../utilities/dates';

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
const handler: Deserialiser = (input: string) => {
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
  while (objects.length > 0) {
    const object = objects.shift();
    if (!object) continue;
    if (
      typeof object.date !== 'string' ||
      object.date.length === 0 ||
      !['number', 'string'].includes(typeof object.amount) ||
      String(object.amount).length === 0
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
          if (typeof object.amount === 'number') {
            transaction.amount = object.amount;
          } else if (typeof object.amount === 'string') {
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

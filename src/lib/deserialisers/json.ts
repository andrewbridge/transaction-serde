import { Deserialiser, Transaction } from 'transaction-serde';

import { parseDateStrings } from '../../utilities/dates';

/**
 * Deserialises a JSON string to an array of transactions.
 *
 * Parses a JSON string containing an array of transaction objects. Dates are automatically
 * parsed from various string formats. Transactions missing required fields (date, amount)
 * are skipped.
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
 * @param input - A JSON string containing an array of transaction objects.
 * @returns An array of parsed transaction objects.
 * @throws {Error} If the input is not valid JSON.
 * @throws {Error} If the input is not an array.
 * @throws {TypeError} If an amount cannot be parsed as a number.
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

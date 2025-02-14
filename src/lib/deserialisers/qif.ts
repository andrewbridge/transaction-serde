import { Deserialiser, Transaction } from 'transaction-serde';

import { ENTRY_END, HEADER_VALUES } from '../../types/qif';
import type { Header } from '../../types/qif';
import { parseDateStrings } from '../../utilities/dates';

function isValidHeader(header: unknown): header is Header {
  return HEADER_VALUES.includes(header as Header);
}

const fieldMap: { [key: string]: keyof Transaction } = {
  D: 'date',
  T: 'amount',
  P: 'payee',
  M: 'description',
  L: 'category',
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
const handler: Deserialiser = (input: string) => {
  const lines = input.trim().split('\n');
  const header = lines.shift();
  if (!isValidHeader(header)) throw Error('Unknown header: ' + header);
  const transactions: Transaction[] = [{}];
  const dates: { date: string; transaction: Transaction }[] = [];
  while (lines.length > 0) {
    const line = lines.shift();
    if (!line) continue;
    const indicator = line.charAt(0);
    if (indicator === ENTRY_END && lines.length > 0) {
      transactions.push({});
      continue;
    } else if (indicator === ENTRY_END) break;
    const transaction = transactions.at(-1) as Transaction;
    if (!(indicator in fieldMap)) continue;
    const fieldName = fieldMap[indicator];
    const fieldValue = line.substring(1);
    switch (fieldName) {
      case 'date':
        dates.push({ date: fieldValue, transaction });
        break;
      case 'amount':
        transaction.amount = parseFloat(fieldValue);
        break;
      default:
        transaction[fieldName] = fieldValue;
    }
  }
  const parsedDates = parseDateStrings(dates.map((d) => d.date));
  parsedDates.forEach((date, i) => (dates[i].transaction.date = date));
  return transactions;
};
export default handler;

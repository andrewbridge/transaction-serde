import { Serialiser, Transaction } from 'transaction-serde';

import { ENTRY_END, HEADER_VALUES, HEADERS } from '../../types/qif';
import { mergeOptions } from '../../utilities/options';

const fieldMap: { [key in keyof Transaction]: string } = {
  date: 'D',
  amount: 'T',
  payee: 'P',
  description: 'M',
  category: 'L',
};

type SerialiserOptions = {
  locale: string | string[];
  header: (typeof HEADER_VALUES)[number];
};

const defaultOptions: SerialiserOptions = {
  locale: 'en-US',
  header: HEADERS.BANK,
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
const handler: Serialiser<SerialiserOptions> = (input, options) => {
  const { locale, header } = mergeOptions(defaultOptions, options);
  const output: string[] = [header];
  for (const transaction of input) {
    const { date, amount } = transaction;
    if (
      !(date instanceof Date) ||
      Number.isNaN(date.getTime()) ||
      typeof amount !== 'number'
    )
      continue;
    Object.keys(transaction).forEach((key) => {
      const validKey = key as keyof Transaction;
      switch (validKey) {
        case 'date':
          output.push(fieldMap.date + date.toISOString().substring(0, 10));
          break;
        case 'amount':
          output.push(fieldMap.amount + amount.toLocaleString(locale));
          break;
        default:
          if (typeof transaction[validKey] === 'string') {
            const value = transaction[validKey] as string;
            output.push(fieldMap[validKey] + value);
          }
      }
    });
    output.push(ENTRY_END);
  }
  return output.join('\n');
};
export default handler;

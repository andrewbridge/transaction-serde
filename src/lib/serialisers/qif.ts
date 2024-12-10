import { Serialiser, Transaction } from "transaction-serde";
import { ENTRY_END, HEADERS, HEADER_VALUES } from "../../types/qif";
import { mergeOptions } from "../../utilities/options";

const fieldMap: { [key in keyof Transaction]: string } = {
    date: 'D',
    amount: 'T',
    payee: 'P',
    description: 'M',
    category: 'L'
};

type SerialiserOptions = {
    locale: string | string[],
    header: typeof HEADER_VALUES[number]
}

const defaultOptions: SerialiserOptions = {
    locale: 'en-US',
    header: HEADERS.BANK
}

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
        Object.keys(transaction).forEach(key => {
            const validKey = key as keyof Transaction;
            switch(validKey) {
                case 'date':
                    if (transaction.date instanceof Date) {
                        output.push(fieldMap.date + transaction.date.toISOString().substring(0, 10));
                    }
                    break;
                case 'amount':
                    if (typeof transaction.amount === 'number') {
                        output.push(fieldMap.amount + transaction.amount.toLocaleString(locale))
                    }
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
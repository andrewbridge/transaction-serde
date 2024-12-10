import { Serialiser } from "transaction-serde";

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
const handler: Serialiser = (input) => {
    const output: { [key: string]: string | number }[] = [];
    for (const transaction of input) {
        const { date, ...rest } = transaction;
        if (!(date instanceof Date)) continue;
        output.push({ date: date.toISOString().substring(0, 10), ...rest });
    }
    return JSON.stringify(output);
};
export default handler;
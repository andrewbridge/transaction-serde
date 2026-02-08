import { InspectOptions, InspectResult } from 'transaction-serde';

import { detectFormat, parseCsv, parseJson } from './parse';

const defaultOptions: Required<InspectOptions> = {
  sampleSize: 3,
  skipRows: 0,
};

/**
 * Inspects input data and returns a uniform report with headers and sample records.
 *
 * Parses CSV or JSON data and returns metadata about the structure, including
 * field names, a sample of records, and the total record count.
 *
 * @example
 * ```ts
 * import { utils } from 'transaction-serde';
 *
 * const csv = 'Date,Amount,Merchant\n2024-01-15,100,Store\n2024-01-16,50,Shop';
 * const report = utils.inspect(csv);
 * // => {
 * //   format: 'csv',
 * //   fields: ['Date', 'Amount', 'Merchant'],
 * //   sample: [{ Date: '2024-01-15', Amount: '100', Merchant: 'Store' }, ...],
 * //   recordCount: 2
 * // }
 * ```
 *
 * @param input - The CSV or JSON string to inspect.
 * @param options - Optional configuration.
 * @param options.sampleSize - Number of sample records to return (default: 3).
 * @returns An InspectResult with format, fields, sample records, and record count.
 */
export function inspect(
  input: string,
  options?: InspectOptions
): InspectResult {
  const { sampleSize, skipRows } = {
    ...defaultOptions,
    ...options,
  };
  const format = detectFormat(input);

  let records: Record<string, unknown>[];
  let fields: string[];

  if (format === 'json') {
    const result = parseJson(input);
    records = result.data;
    fields = result.fields;
  } else {
    const result = parseCsv(input, true, skipRows);
    records = result.data;
    fields = result.fields;
  }

  const sample = records.slice(0, sampleSize).map((record) => ({ ...record }));

  return {
    format,
    fields,
    sample,
    recordCount: records.length,
  };
}

import { InspectOptions, InspectResult } from 'transaction-serde';

import { parseDateStrings } from './dates';
import { detectFormat, parseCsv, parseJson, tryParseNumber } from './parse';

const defaultOptions: Required<InspectOptions> = {
  sampleSize: 3,
  attemptParsing: true,
  skipRows: 0,
};

/**
 * Attempts to parse a value as a date, returning an ISO date string if successful.
 */
function tryParseDate(value: string): string | null {
  try {
    const [parsed] = parseDateStrings([value]);
    if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // Not a valid date
  }
  return null;
}

/**
 * Attempts to parse a value as a number or date, falling back to the raw value.
 */
function tryParseValue(value: unknown): unknown {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  // Try parsing as number
  const asNumber = tryParseNumber(value);
  if (asNumber !== null) {
    return asNumber;
  }

  // Try parsing as date
  const parsedDate = tryParseDate(value);
  if (parsedDate !== null) {
    return parsedDate;
  }

  return value;
}

/**
 * Inspects input data and returns a uniform report with headers and sample records.
 *
 * Parses CSV or JSON data and returns metadata about the structure, including
 * field names, a sample of records, and the total record count. Optionally
 * attempts to parse dates and numbers in the sample.
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
 * //   sample: [{ Date: '2024-01-15', Amount: 100, Merchant: 'Store' }, ...],
 * //   recordCount: 2
 * // }
 * ```
 *
 * @param input - The CSV or JSON string to inspect.
 * @param options - Optional configuration.
 * @param options.sampleSize - Number of sample records to return (default: 3).
 * @param options.attemptParsing - Whether to attempt parsing dates and numbers (default: true).
 * @returns An InspectResult with format, fields, sample records, and record count.
 */
export function inspect(
  input: string,
  options?: InspectOptions
): InspectResult {
  const { sampleSize, attemptParsing, skipRows } = {
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

  // Build sample with optional parsing
  const sample = records.slice(0, sampleSize).map((record) => {
    if (!attemptParsing) return { ...record };

    const parsed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      parsed[key] = tryParseValue(value);
    }
    return parsed;
  });

  return {
    format,
    fields,
    sample,
    recordCount: records.length,
  };
}

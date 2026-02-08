import { parse } from 'papaparse';

/**
 * Result of parsing a CSV string into records.
 */
export type CsvParseResult = {
  /** The parsed records as key-value objects */
  data: Record<string, unknown>[];
  /** The field names/headers from the CSV */
  fields: string[];
  /** Any parsing errors encountered */
  errors: { message: string }[];
};

/**
 * Result of parsing a JSON string into records.
 */
export type JsonParseResult = {
  /** The parsed records as key-value objects */
  data: Record<string, unknown>[];
  /** All unique field names found across records */
  fields: string[];
};

/**
 * Parses a CSV string into an array of records.
 *
 * @param input - The CSV string to parse.
 * @param headers - Whether the CSV has headers (default: true).
 * @returns The parsed records, field names, and any errors.
 */
export function parseCsv(
  input: string,
  headers = true,
  skipRows = 0
): CsvParseResult {
  const result = parse(input.trim(), {
    header: headers,
    skipFirstNLines: skipRows,
  });
  return {
    data: result.data as Record<string, unknown>[],
    fields: result.meta.fields || [],
    errors: result.errors.map((e) => ({ message: e.message })),
  };
}

/**
 * Parses a JSON string into an array of records.
 *
 * @param input - The JSON string to parse.
 * @returns The parsed records and all unique field names.
 * @throws {Error} If the input is not valid JSON.
 * @throws {Error} If the input is not an array.
 */
export function parseJson(input: string): JsonParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.trim());
  } catch {
    throw new Error('Input is not valid JSON');
  }

  const arr = Array.isArray(parsed) ? parsed : [parsed];
  const data = arr.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
  );

  // Collect all unique field names from all records
  const fieldSet = new Set<string>();
  data.forEach((record) => {
    Object.keys(record).forEach((key) => fieldSet.add(key));
  });

  return {
    data,
    fields: Array.from(fieldSet),
  };
}

/**
 * Detects whether the input is JSON or CSV format.
 *
 * @param input - The string to detect format of.
 * @returns 'json' if the input parses as valid JSON, 'csv' otherwise.
 */
export function detectFormat(input: string): 'csv' | 'json' {
  const trimmed = input.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Fall through to CSV
    }
  }
  return 'csv';
}

/**
 * Attempts to parse a string as a number, starting from the first numeric character.
 * Validates that the number consumes the numeric portion completely (allowing trailing
 * non-numeric text like currency codes).
 *
 * @param value - The string to parse.
 * @returns The parsed number, or null if parsing failed.
 */
export function tryParseNumber(value: string): number | null {
  const match = value.match(/[-.\d]/);
  if (!match || match.index === undefined) {
    return null;
  }

  const numericPart = value.slice(match.index);
  const parsed = parseFloat(numericPart);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  // Verify the parse consumed all the numeric content
  // parseFloat("2024-01-15") returns 2024, but "2024" !== "2024-01-15"
  // parseFloat("100 USD") returns 100, and "100".length < "100 USD".length is ok
  // because the remainder is non-numeric
  const parsedStr = String(parsed);
  const remainder = numericPart.slice(parsedStr.length);

  // If remainder starts with numeric-like characters, parseFloat didn't consume all numbers
  // This catches dates like "2024-01-15" where remainder is "-01-15"
  if (remainder.length > 0 && /^[-.\d]/.test(remainder)) {
    return null;
  }

  return parsed;
}

/**
 * Parses metadata from a string or object value.
 *
 * Accepts either a JSON string (which will be parsed) or an object (which will
 * be passed through). Returns undefined if the value is invalid or unparseable.
 *
 * @param value - The metadata value to parse (string or object).
 * @returns A Record object if valid, undefined otherwise.
 */
export function parseMetadata(
  value: string | Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (typeof value === 'object' && value !== null) {
    return value;
  }
  return undefined;
}

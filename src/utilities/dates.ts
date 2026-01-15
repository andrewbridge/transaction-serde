import { UTCDateMini } from '@date-fns/utc';
import { parse } from 'date-fns/parse';

/**
 * Default date formats supported for parsing.
 *
 * Includes variations with `/`, `-`, and no separators for each base pattern.
 * Supports both numeric formats (e.g., 2024/01/15) and text formats (e.g., 15 January 2024).
 *
 * @internal
 */
const defaultFormats = [
  'yyyy/MM/dd',
  'yyyy/M/d',
  'dd/MM/yyyy',
  'd/M/yyyy',
  'MM/dd/yyyy',
  'M/d/yyyy',
  'd MMMM yyyy',
  'dd MMM yyyy',
  'MMMM d yyyy',
  'MMM dd yyyy',
].flatMap((pattern) => [
  pattern,
  pattern.replaceAll('/', '-'),
  pattern.replaceAll('/', ''),
]);

/**
 * Parses an array of date strings into Date objects.
 *
 * Attempts to parse all dates using a consistent format. If all dates in the array
 * can be parsed using the same format, returns an array of UTC Date objects.
 * This ensures consistent timezone handling across different environments.
 *
 * @param dates - The date strings to parse.
 * @param formats - Optional array of date-fns format patterns to try, in order of preference.
 *                  Defaults to common numeric and text date formats.
 * @returns An array of UTC Date objects corresponding to the input date strings.
 * @throws {Error} If the dates cannot be parsed using any of the provided formats.
 *
 * @example
 * ```ts
 * const dates = parseDateStrings(['2024-01-15', '2024-02-20']);
 * // => [Date('2024-01-15'), Date('2024-02-20')]
 * ```
 *
 * @example
 * ```ts
 * // With custom formats
 * const dates = parseDateStrings(['15/01/2024'], ['dd/MM/yyyy']);
 * ```
 */
export const parseDateStrings = (
  dates: string[],
  formats = defaultFormats
): Date[] => {
  for (const format of formats) {
    const parsedDates: Date[] = [];
    for (const date of dates) {
      const parsed = parse(date, format, new Date());
      if (Number.isNaN(parsed.getTime())) break;
      parsedDates.push(
        new UTCDateMini(
          parsed.getFullYear(),
          parsed.getMonth(),
          parsed.getDate()
        )
      );
    }
    if (parsedDates.length === dates.length) return parsedDates;
  }
  throw new Error('Could not parse dates');
};

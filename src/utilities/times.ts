import { parse } from 'date-fns/parse';

/**
 * Default time formats supported for parsing.
 *
 * Includes 12-hour and 24-hour formats with various separators and optional components.
 * Supports formats with and without seconds, with different am/pm notations.
 *
 * @internal
 */
const defaultFormats = [
  // 24-hour formats
  'HH:mm:ss',
  'HH:mm',
  'HHmmss',
  'HHmm',
  'HH.mm.ss',
  'HH.mm',
  // 12-hour formats with am/pm
  'hh:mm:ss a',
  'hh:mm a',
  'h:mm:ss a',
  'h:mm a',
  'hh:mm:ssa',
  'hh:mma',
  'h:mm:ssa',
  'h:mma',
  // 12-hour formats with period separator
  'hh.mm.ss a',
  'hh.mm a',
  'h.mm a',
];

/**
 * Represents parsed time components.
 */
export interface ParsedTime {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Parses an array of time strings into ParsedTime objects.
 *
 * Attempts to parse all times using a consistent format. If all times in the array
 * can be parsed using the same format, returns an array of ParsedTime objects.
 *
 * @param times - The time strings to parse.
 * @param formats - Optional array of date-fns format patterns to try, in order of preference.
 *                  Defaults to common 12-hour and 24-hour time formats.
 * @returns An array of ParsedTime objects corresponding to the input time strings.
 * @throws {Error} If the times cannot be parsed using any of the provided formats.
 *
 * @example
 * ```ts
 * const times = parseTimeStrings(['14:30:00', '09:15:00']);
 * // => [{ hours: 14, minutes: 30, seconds: 0 }, { hours: 9, minutes: 15, seconds: 0 }]
 * ```
 *
 * @example
 * ```ts
 * // With 12-hour format
 * const times = parseTimeStrings(['2:30 PM', '9:15 AM']);
 * // => [{ hours: 14, minutes: 30, seconds: 0 }, { hours: 9, minutes: 15, seconds: 0 }]
 * ```
 *
 * @example
 * ```ts
 * // With custom formats
 * const times = parseTimeStrings(['14h30m', '09h15m'], ['HH\'h\'mm\'m\'']);
 * ```
 */
export const parseTimeStrings = (
  times: string[],
  formats = defaultFormats
): ParsedTime[] => {
  for (const format of formats) {
    const parsedTimes: ParsedTime[] = [];
    for (const time of times) {
      const parsed = parse(time, format, new Date(0));
      if (Number.isNaN(parsed.getTime())) break;
      parsedTimes.push({
        hours: parsed.getHours(),
        minutes: parsed.getMinutes(),
        seconds: parsed.getSeconds(),
      });
    }
    if (parsedTimes.length === times.length) return parsedTimes;
  }
  throw new Error('Could not parse times');
};

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
export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

/**
 * Parses an array of time strings into milliseconds since midnight.
 *
 * Attempts to parse all times using a consistent format. If all times in the array
 * can be parsed using the same format, returns an array of milliseconds since midnight.
 *
 * @param times - The time strings to parse.
 * @param formats - Optional array of date-fns format patterns to try, in order of preference.
 *                  Defaults to common 12-hour and 24-hour time formats.
 * @returns An array of milliseconds since midnight corresponding to the input time strings.
 * @throws {Error} If the times cannot be parsed using any of the provided formats.
 *
 * @example
 * ```ts
 * const times = parseTimeStrings(['14:30:00', '09:15:00']);
 * // => [52200000, 33300000]
 * ```
 *
 * @example
 * ```ts
 * // With 12-hour format
 * const times = parseTimeStrings(['2:30 PM', '9:15 AM']);
 * // => [52200000, 33300000]
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
): number[] => {
  for (const format of formats) {
    const parsedTimes: number[] = [];
    for (const time of times) {
      const parsed = parse(time, format, new Date(0));
      if (Number.isNaN(parsed.getTime())) break;
      const ms =
        parsed.getHours() * 3600000 +
        parsed.getMinutes() * 60000 +
        parsed.getSeconds() * 1000 +
        parsed.getMilliseconds();
      parsedTimes.push(ms);
    }
    if (parsedTimes.length === times.length) return parsedTimes;
  }
  throw new Error('Could not parse times');
};

/**
 * Converts milliseconds since midnight to time components.
 *
 * @param ms - Milliseconds since midnight.
 * @returns An object with hours, minutes, seconds, and milliseconds.
 *
 * @example
 * ```ts
 * const components = toTimeComponents(52200000);
 * // => { hours: 14, minutes: 30, seconds: 0, milliseconds: 0 }
 * ```
 */
export const toTimeComponents = (ms: number): TimeComponents => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return { hours, minutes, seconds, milliseconds };
};

/**
 * Formats milliseconds since midnight to a time string.
 *
 * @param ms - Milliseconds since midnight.
 * @returns A formatted time string in HH:mm:ss format.
 *
 * @example
 * ```ts
 * formatTimeString(52200000);
 * // => '14:30:00'
 * ```
 */
export const formatTimeString = (ms: number): string => {
  const { hours, minutes, seconds } = toTimeComponents(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Converts time components to milliseconds since midnight.
 *
 * This is the inverse of toTimeComponents. All parameters default to 0.
 *
 * @param hours - Hours (0-23). Defaults to 0.
 * @param minutes - Minutes (0-59). Defaults to 0.
 * @param seconds - Seconds (0-59). Defaults to 0.
 * @param milliseconds - Milliseconds (0-999). Defaults to 0.
 * @returns Milliseconds since midnight.
 *
 * @example
 * ```ts
 * toMs(14, 30);
 * // => 52200000
 * ```
 *
 * @example
 * ```ts
 * toMs();
 * // => 0
 * ```
 *
 * @example
 * ```ts
 * toMs(23, 59, 59, 999);
 * // => 86399999
 * ```
 */
export const toMs = (
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0
): number => hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;

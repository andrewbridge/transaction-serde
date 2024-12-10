import { parse } from 'date-fns/parse';

import { UTCDateMini } from '@date-fns/utc';

const defaultFormats = [
    "yyyy/MM/dd",
    "yyyy/M/d",
    "dd/MM/yyyy",
    "d/M/yyyy",
    "MM/dd/yyyy",
    "M/d/yyyy",
    "d MMMM yyyy",
    "dd MMM yyyy",
    "MMMM d yyyy",
    "MMM dd yyyy"
].flatMap(pattern => [pattern, pattern.replaceAll('/', '-'), pattern.replaceAll('/', '')]);
/**
 * Parse a set of date strings that could be one of many formats to a set of Date objects.
 * 
 * @param dates The date strings to parse
 * @param formats The formats to try parsing the dates with, in order of preference. Optional; defaults to standard numeric
 * @throws if the date strings were not parsable using any of the formats
 * @returns An array of date objects representing the same dates as the date strings provided
 */
export const parseDateStrings = (dates: string[], formats = defaultFormats): Date[] => {
    for (const format of formats) {
        const parsedDates: Date[] = [];
        for (const date of dates) {
            const parsed = parse(date, format, new Date());
            if (Number.isNaN(parsed.getTime())) break;
            parsedDates.push(new UTCDateMini(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
        }
        if (parsedDates.length === dates.length) return parsedDates;
    }
    throw new Error('Could not parse dates');
}
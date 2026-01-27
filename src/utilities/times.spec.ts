import test from 'ava';

import {
  formatTimeString,
  parseTimeStrings,
  toMs,
  toTimeComponents,
} from './times';

const TIMES_24H_COLON = [
  '00:00:00',
  '01:30:00',
  '09:15:30',
  '12:00:00',
  '14:30:00',
  '18:45:15',
  '23:59:59',
];

const TIMES_24H_NO_SECONDS = [
  '00:00',
  '01:30',
  '09:15',
  '12:00',
  '14:30',
  '18:45',
  '23:59',
];

const TIMES_24H_NO_SEP = [
  '000000',
  '013000',
  '091530',
  '120000',
  '143000',
  '184515',
  '235959',
];

const TIMES_24H_NO_SEP_NO_SECONDS = [
  '0000',
  '0130',
  '0915',
  '1200',
  '1430',
  '1845',
  '2359',
];

const TIMES_24H_DOT = [
  '00.00.00',
  '01.30.00',
  '09.15.30',
  '12.00.00',
  '14.30.00',
  '18.45.15',
  '23.59.59',
];

const TIMES_12H_UPPER = [
  '12:00:00 AM',
  '01:30:00 AM',
  '09:15:30 AM',
  '12:00:00 PM',
  '02:30:00 PM',
  '06:45:15 PM',
  '11:59:59 PM',
];

const TIMES_12H_LOWER = [
  '12:00:00 am',
  '01:30:00 am',
  '09:15:30 am',
  '12:00:00 pm',
  '02:30:00 pm',
  '06:45:15 pm',
  '11:59:59 pm',
];

const TIMES_12H_NO_SECONDS = [
  '12:00 AM',
  '01:30 AM',
  '09:15 AM',
  '12:00 PM',
  '02:30 PM',
  '06:45 PM',
  '11:59 PM',
];

const TIMES_12H_NO_SPACE = [
  '12:00:00AM',
  '01:30:00AM',
  '09:15:30AM',
  '12:00:00PM',
  '02:30:00PM',
  '06:45:15PM',
  '11:59:59PM',
];

const TIMES_12H_SINGLE_DIGIT = [
  '1:30 AM',
  '2:45 AM',
  '9:15 AM',
  '1:00 PM',
  '2:30 PM',
  '6:45 PM',
  '11:59 PM',
];

const EXPECTED_HOURS = [0, 1, 9, 12, 14, 18, 23];
const EXPECTED_MINUTES = [0, 30, 15, 0, 30, 45, 59];
const EXPECTED_SECONDS_FULL = [0, 0, 30, 0, 0, 15, 59];

const EXPECTED_12H_HOURS = [0, 1, 9, 12, 14, 18, 23];
const EXPECTED_12H_MINUTES = [0, 30, 15, 0, 30, 45, 59];
const EXPECTED_12H_SECONDS = [0, 0, 30, 0, 0, 15, 59];

const EXPECTED_SINGLE_DIGIT_HOURS = [1, 2, 9, 13, 14, 18, 23];
const EXPECTED_SINGLE_DIGIT_MINUTES = [30, 45, 15, 0, 30, 45, 59];

const VALID_STRINGS = [
  {
    times: TIMES_24H_COLON,
    hours: EXPECTED_HOURS,
    minutes: EXPECTED_MINUTES,
    seconds: EXPECTED_SECONDS_FULL,
  },
  {
    times: TIMES_24H_NO_SECONDS,
    hours: EXPECTED_HOURS,
    minutes: EXPECTED_MINUTES,
    seconds: [0, 0, 0, 0, 0, 0, 0],
  },
  {
    times: TIMES_24H_NO_SEP,
    hours: EXPECTED_HOURS,
    minutes: EXPECTED_MINUTES,
    seconds: EXPECTED_SECONDS_FULL,
  },
  {
    times: TIMES_24H_NO_SEP_NO_SECONDS,
    hours: EXPECTED_HOURS,
    minutes: EXPECTED_MINUTES,
    seconds: [0, 0, 0, 0, 0, 0, 0],
  },
  {
    times: TIMES_24H_DOT,
    hours: EXPECTED_HOURS,
    minutes: EXPECTED_MINUTES,
    seconds: EXPECTED_SECONDS_FULL,
  },
  {
    times: TIMES_12H_UPPER,
    hours: EXPECTED_12H_HOURS,
    minutes: EXPECTED_12H_MINUTES,
    seconds: EXPECTED_12H_SECONDS,
  },
  {
    times: TIMES_12H_LOWER,
    hours: EXPECTED_12H_HOURS,
    minutes: EXPECTED_12H_MINUTES,
    seconds: EXPECTED_12H_SECONDS,
  },
  {
    times: TIMES_12H_NO_SECONDS,
    hours: EXPECTED_12H_HOURS,
    minutes: EXPECTED_12H_MINUTES,
    seconds: [0, 0, 0, 0, 0, 0, 0],
  },
  {
    times: TIMES_12H_NO_SPACE,
    hours: EXPECTED_12H_HOURS,
    minutes: EXPECTED_12H_MINUTES,
    seconds: EXPECTED_12H_SECONDS,
  },
  {
    times: TIMES_12H_SINGLE_DIGIT,
    hours: EXPECTED_SINGLE_DIGIT_HOURS,
    minutes: EXPECTED_SINGLE_DIGIT_MINUTES,
    seconds: [0, 0, 0, 0, 0, 0, 0],
  },
];

const INVALID_STRINGS = [
  '25:00:00',
  '12:60:00',
  '12:00:60',
  'noon',
  '1pm',
  'morning',
];

test('parsing 24-hour times with colons and seconds', (t) => {
  const result = parseTimeStrings(TIMES_24H_COLON);
  t.is(result.length, 7);
  t.is(result[0], 0); // 00:00:00 = 0ms
  t.is(result[6], toMs(23, 59, 59)); // 23:59:59
});

test('parsing various time formats', (t) => {
  VALID_STRINGS.forEach(({ times, hours, minutes, seconds }) => {
    const result = parseTimeStrings(times);
    t.log(times[0], result[0]);
    t.is(result.length, times.length);
    result.forEach((ms, i) => {
      const expected = toMs(hours[i], minutes[i], seconds[i]);
      t.is(ms, expected, `ms mismatch at index ${i} for ${times[i]}`);
    });
  });
});

test('throws on invalid time strings', (t) => {
  t.throws(() => parseTimeStrings(INVALID_STRINGS));
});

test('custom format support', (t) => {
  const times = ['14h30m', '09h15m'];
  const result = parseTimeStrings(times, ["HH'h'mm'm'"]);
  t.is(result.length, 2);
  t.is(result[0], toMs(14, 30, 0));
  t.is(result[1], toMs(9, 15, 0));
});

test('toTimeComponents converts ms to components', (t) => {
  t.deepEqual(toTimeComponents(0), {
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  t.deepEqual(toTimeComponents(toMs(14, 30, 0)), {
    hours: 14,
    minutes: 30,
    seconds: 0,
    milliseconds: 0,
  });
  t.deepEqual(toTimeComponents(toMs(23, 59, 59) + 999), {
    hours: 23,
    minutes: 59,
    seconds: 59,
    milliseconds: 999,
  });
  t.deepEqual(toTimeComponents(43200000), {
    hours: 12,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  }); // noon
});

test('formatTimeString formats ms to HH:mm:ss', (t) => {
  t.is(formatTimeString(0), '00:00:00');
  t.is(formatTimeString(toMs(14, 30, 0)), '14:30:00');
  t.is(formatTimeString(toMs(9, 5, 3)), '09:05:03');
  t.is(formatTimeString(toMs(23, 59, 59)), '23:59:59');
});

test('toMs converts time components to ms since midnight', (t) => {
  t.is(toMs(), 0);
  t.is(toMs(0, 0, 0, 0), 0);
  t.is(toMs(1), 3600000);
  t.is(toMs(0, 1), 60000);
  t.is(toMs(0, 0, 1), 1000);
  t.is(toMs(0, 0, 0, 1), 1);
  t.is(toMs(12), 43200000); // noon
  t.is(toMs(14, 30), 52200000);
  t.is(toMs(23, 59, 59), 86399000);
  t.is(toMs(23, 59, 59, 999), 86399999);
});

test('toMs and toTimeComponents are inverses', (t) => {
  const testCases = [
    [0, 0, 0],
    [12, 0, 0],
    [14, 30, 0],
    [23, 59, 59],
    [9, 5, 3],
  ] as const;

  for (const [h, m, s] of testCases) {
    const ms = toMs(h, m, s);
    const components = toTimeComponents(ms);
    t.is(components.hours, h);
    t.is(components.minutes, m);
    t.is(components.seconds, s);
    t.is(components.milliseconds, 0);
  }
});

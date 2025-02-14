import test from 'ava';

import { parseDateStrings } from './dates';

const ISO_DATES = [
  '2024-04-01',
  '2024-04-02',
  '2024-04-03',
  '2024-04-04',
  '2024-04-05',
  '2024-04-06',
  '2024-04-07',
  '2024-04-08',
  '2024-04-09',
  '2024-04-10',
  '2024-04-11',
  '2024-04-12',
  '2024-04-13',
];

const NUMERIC_DATES = [
  '20240401',
  '20240402',
  '20240403',
  '20240404',
  '20240405',
  '20240406',
  '20240407',
  '20240408',
  '20240409',
  '20240410',
  '20240411',
  '20240412',
  '20240413',
];

const EN_UK = [
  '01/04/2024',
  '02/04/2024',
  '03/04/2024',
  '04/04/2024',
  '05/04/2024',
  '06/04/2024',
  '07/04/2024',
  '08/04/2024',
  '09/04/2024',
  '10/04/2024',
  '11/04/2024',
  '12/04/2024',
  '13/04/2024',
];

const EN_US = [
  '04/01/2024',
  '04/02/2024',
  '04/03/2024',
  '04/04/2024',
  '04/05/2024',
  '04/06/2024',
  '04/07/2024',
  '04/08/2024',
  '04/09/2024',
  '04/10/2024',
  '04/11/2024',
  '04/12/2024',
  '04/13/2024',
];

const LONG_DATE_STRINGS = [
  '1 April 2024',
  '2 April 2024',
  '3 April 2024',
  '4 April 2024',
  '5 April 2024',
  '6 April 2024',
  '7 April 2024',
  '8 April 2024',
  '9 April 2024',
  '10 April 2024',
  '11 April 2024',
  '12 April 2024',
  '13 April 2024',
];

const SHORT_DATE_STRINGS = [
  '01 Apr 2024',
  '02 Apr 2024',
  '03 Apr 2024',
  '04 Apr 2024',
  '05 Apr 2024',
  '06 Apr 2024',
  '07 Apr 2024',
  '08 Apr 2024',
  '09 Apr 2024',
  '10 Apr 2024',
  '11 Apr 2024',
  '12 Apr 2024',
  '13 Apr 2024',
];

const VALID_STRINGS = [
  ISO_DATES,
  NUMERIC_DATES,
  EN_UK,
  EN_US,
  LONG_DATE_STRINGS,
  SHORT_DATE_STRINGS,
];

const INVALID_STRINGS = ['1 April', '2024', '1/4/2024', '1/4/24', '24/04/01'];

const comparisonDate = Date.UTC(2024, 3, 13);

test('deserialising dates', (t) => {
  VALID_STRINGS.forEach((dateStrings) => {
    const result = parseDateStrings(dateStrings);
    t.log(dateStrings[12], result[12]);
    t.is(result.length, 13);
    t.true(result[12] instanceof Date);
    t.is((result[12] as Date).getTime(), comparisonDate);
  });
  t.throws(() => parseDateStrings(INVALID_STRINGS));
});

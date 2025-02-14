import { UTCDateMini } from '@date-fns/utc';
import test from 'ava';

import csv from './csv';

const DATA = [
  {
    date: new UTCDateMini(2024, 3, 1),
    amount: 134.99,
    payee: 'Acme',
    description: 'Acme Salary April',
    category: 'Income',
  },
  {
    date: new UTCDateMini(2024, 3, 2),
    amount: -34.99,
    payee: 'Internet',
    description: 'INET12345678-0',
    category: 'Bills',
  },
  {
    date: new UTCDateMini(2024, 3, 2),
    amount: -100,
    payee: 'Energy',
    description: 'A-0A00AA00-001',
    category: 'Bills',
  },
];

test('serialising csv', async (t) => {
  t.is(
    await csv(DATA),
    '"date","amount","payee","description","category"\n' +
      '"2024-04-01",134.99,"Acme","Acme Salary April","Income"\n' +
      '"2024-04-02",-34.99,"Internet","INET12345678-0","Bills"\n' +
      '"2024-04-02",-100,"Energy","A-0A00AA00-001","Bills"'
  );
});

import { UTCDateMini } from '@date-fns/utc';
import test from 'ava';

import json from './json';

const DATA = [
  {
    date: new UTCDateMini(2024, 3, 1),
    amount: 134.99,
    payee: 'Acme',
    category: 'Income',
    description: 'Acme Salary April',
  },
  {
    date: new UTCDateMini(2024, 3, 2),
    amount: -34.99,
    payee: 'Internet',
    category: 'Bills',
    description: 'INET12345678-0',
  },
  {
    date: new UTCDateMini(2024, 3, 2),
    amount: -100,
    payee: 'Energy',
    category: 'Bills',
    description: 'A-0A00AA00-001',
  },
];

const PARTIALLY_INVALID_DATA = [
  {
    date: new UTCDateMini(2024, 3, 1),
    amount: 134.99,
    payee: 'Acme',
    category: 'Income',
    description: 'Acme Salary April',
  },
  {
    date: undefined,
    amount: -34.99,
    payee: 'Internet',
    category: 'Bills',
    description: 'INET12345678-0',
  },
  {
    date: new Date('Not a real date'),
    amount: -100,
    payee: 'Energy',
    category: 'Bills',
    description: 'A-0A00AA00-001',
  },
];

test('serialising json', (t) => {
  t.is(
    json(DATA),
    '[' +
      '{"date":"2024-04-01","amount":134.99,"payee":"Acme","category":"Income","description":"Acme Salary April"},' +
      '{"date":"2024-04-02","amount":-34.99,"payee":"Internet","category":"Bills","description":"INET12345678-0"},' +
      '{"date":"2024-04-02","amount":-100,"payee":"Energy","category":"Bills","description":"A-0A00AA00-001"}' +
      ']'
  );
});

test('json serialiser will ignore items with invalid dates', async (t) => {
  t.is(
    await json(PARTIALLY_INVALID_DATA),
    '[' +
      '{"date":"2024-04-01","amount":134.99,"payee":"Acme","category":"Income","description":"Acme Salary April"}' +
      ']'
  );
});

import { UTCDateMini } from '@date-fns/utc';
import test from 'ava';

import json from './json';

const DATA = `[
    {
        "date": "2024-04-01",
        "amount": 134.99,
        "payee": "Acme",
        "description": "Acme Salary April",
        "category": "Income"
    },
    {
        "date": "2024-04-02",
        "amount": -34.99,
        "payee": "Internet",
        "description": "INET12345678-0",
        "category": "Bills"
    },
    {
        "date": "2024-04-02",
        "amount": -100,
        "payee": "Energy",
        "description": "A-0A00AA00-001",
        "category": "Bills"
    }
]`;

test('deserialising json', (t) => {
  t.deepEqual(json(DATA), [
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
  ]);
});

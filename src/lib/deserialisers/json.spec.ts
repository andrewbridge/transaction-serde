import { UTCDateMini } from '@date-fns/utc';
import test from 'ava';
import { Transaction } from 'transaction-serde';

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

const PARTIALLY_INVALID_DATA = `[
    {
        "date": "2024-04-01",
        "amount": 134.99,
        "payee": "Acme",
        "description": "Acme Salary April",
        "category": "Income"
    },
    {
        "date": 20240402,
        "amount": -34.99,
        "payee": "Internet",
        "description": "INET12345678-0",
        "category": "Bills"
    },
    {
        "date": "2024-04-02",
        "amount": false,
        "payee": "Energy",
        "description": "A-0A00AA00-001",
        "category": "Bills"
    }
]`;

const INVALID_AMOUNT_DATA = `[
    {
        "date": "2024-04-02",
        "amount": "$100",
        "payee": "Energy",
        "description": "A-0A00AA00-001",
        "category": "Bills"
    }
]`;

const INVALID_OPTIONAL_DATA = `[
    {
        "date": "2024-04-01",
        "amount": 134.99,
        "payee": false,
        "description": "Acme Salary April",
        "category": "Income"
    },
    {
        "date": "2024-04-02",
        "amount": -34.99,
        "payee": "Internet",
        "description": 0,
        "category": "Bills"
    },
    {
        "date": "2024-04-02",
        "amount": -100,
        "payee": "Energy",
        "description": "A-0A00AA00-001",
        "category": null
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

test('json deserialiser throws on invalid data', (t) => {
  // Unparseable data
  t.throws(() => json('invalid'));
  // Not an array
  t.throws(() => json('{}'));
});

test('json deserialiser ignores items with invalid data types', (t) => {
  t.true((json(PARTIALLY_INVALID_DATA) as Transaction[]).length === 1);
});

test('json deserialiser should fail on invalid amount data', (t) => {
  t.throws(() => json(INVALID_AMOUNT_DATA));
});

test('json deserialiser ignores invalid optional transaction data', (t) => {
  t.deepEqual(json(INVALID_OPTIONAL_DATA), [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      description: 'Acme Salary April',
      category: 'Income',
    },
    {
      date: new UTCDateMini(2024, 3, 2),
      amount: -34.99,
      payee: 'Internet',
      category: 'Bills',
    },
    {
      date: new UTCDateMini(2024, 3, 2),
      amount: -100,
      payee: 'Energy',
      description: 'A-0A00AA00-001',
    },
  ]);
});

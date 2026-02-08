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
        "amount": "not a number",
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

test('json deserialiser handles currency-prefixed amounts', (t) => {
  const data = `[{
    "date": "2024-04-02",
    "amount": "$100",
    "payee": "Energy",
    "description": "A-0A00AA00-001",
    "category": "Bills"
  }]`;
  const result = json(data) as Transaction[];
  t.is(result.length, 1);
  t.is(result[0].amount, 100);
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

const CUSTOM_FIELDS_DATA = `[
    {
        "transactionDate": "2024-04-01",
        "value": 134.99,
        "merchant": "Acme",
        "notes": "Acme Salary April"
    },
    {
        "transactionDate": "2024-04-02",
        "value": -34.99,
        "merchant": "Internet",
        "notes": "INET12345678-0"
    }
]`;

test('json deserialiser with custom map function', (t) => {
  const result = json(CUSTOM_FIELDS_DATA, {
    map: (row) => ({
      date: row.transactionDate as string,
      amount: String(row.value),
      payee: row.merchant as string,
      description: row.notes as string,
    }),
  });
  t.deepEqual(result, [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      payee: 'Acme',
      description: 'Acme Salary April',
    },
    {
      date: new UTCDateMini(2024, 3, 2),
      amount: -34.99,
      payee: 'Internet',
      description: 'INET12345678-0',
    },
  ]);
});

test('json deserialiser map function can filter records', (t) => {
  const result = json(DATA, {
    map: (row) => {
      // Only include transactions with negative amounts
      if (typeof row.amount === 'number' && row.amount >= 0) {
        return null;
      }
      return {
        date: row.date as string,
        amount: String(row.amount),
        payee: row.payee as string,
      };
    },
  }) as Transaction[];
  t.is(result.length, 2);
  t.is(result[0].payee, 'Internet');
  t.is(result[1].payee, 'Energy');
});

const DATA_WITH_METADATA_OBJECT = `[
    {
        "date": "2024-04-01",
        "amount": 134.99,
        "payee": "Acme",
        "metadata": { "source": "bank-api", "id": 123 }
    }
]`;

const DATA_WITH_METADATA_STRING = `[
    {
        "date": "2024-04-01",
        "amount": 134.99,
        "payee": "Acme",
        "metadata": "{\\"source\\": \\"bank-api\\", \\"id\\": 123}"
    }
]`;

const DATA_WITH_INVALID_METADATA = `[
    {
        "date": "2024-04-01",
        "amount": 134.99,
        "payee": "Acme",
        "metadata": "not valid json"
    }
]`;

test('json deserialiser handles metadata as object', (t) => {
  const result = json(DATA_WITH_METADATA_OBJECT);
  t.deepEqual(result, [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      payee: 'Acme',
      metadata: { source: 'bank-api', id: 123 },
    },
  ]);
});

test('json deserialiser parses metadata from JSON string', (t) => {
  const result = json(DATA_WITH_METADATA_STRING);
  t.deepEqual(result, [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      payee: 'Acme',
      metadata: { source: 'bank-api', id: 123 },
    },
  ]);
});

test('json deserialiser ignores invalid metadata JSON string', (t) => {
  const result = json(DATA_WITH_INVALID_METADATA);
  t.deepEqual(result, [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      payee: 'Acme',
    },
  ]);
});

const DATA_WITH_TIME = `[
    {
        "date": "2024-04-01",
        "amount": 134.99,
        "payee": "Acme",
        "time": "14:30:00"
    },
    {
        "date": "2024-04-02",
        "amount": -34.99,
        "payee": "Internet",
        "time": "09:15:00"
    }
]`;

test('json deserialiser parses time field', (t) => {
  const result = json(DATA_WITH_TIME);
  t.deepEqual(result, [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      payee: 'Acme',
      time: 52200000, // 14:30:00
    },
    {
      date: new UTCDateMini(2024, 3, 2),
      amount: -34.99,
      payee: 'Internet',
      time: 33300000, // 09:15:00
    },
  ]);
});

import { UTCDateMini } from '@date-fns/utc';
import test from 'ava';
import { Transaction } from 'transaction-serde';

import csv from './csv';

const DATA = `"date","amount","payee","description","category"
"2024-04-01",134.99,"Acme","Acme Salary April","Income"
"2024-04-02",-34.99,"Internet","INET12345678-0","Bills"
"2024-04-02",-100,"Energy","A-0A00AA00-001","Bills"`;

// Invalid data taken from https://github.com/C2FO/fast-csv/blob/b569da018ccaaa7ad617708ca6273f8b12b6f37e/packages/parse/__tests__/parser/Parser.spec.ts#L277
const MALFORMED_DATA = `"First,""1""","Last,""1""","email1@email.com
"First,"",2""","Last""2""","email2@email.com"`;

const MISSING_DATE_COLUMN = `"amount","payee","description","category"
134.99,"Acme","Acme Salary April","Income"
-34.99,"Internet","INET12345678-0","Bills"
false,"Energy","A-0A00AA00-001","Bills"`;

const MISSING_AMOUNT_COLUMN = `"date","payee","description","category"
"2024-04-01","Acme","Acme Salary April","Income"
"2024-04-02","Internet","INET12345678-0","Bills"
"2024-04-02","Energy","A-0A00AA00-001","Bills"`;

// Row 1 is valid, row 2 has an empty date, row 3 has an empty amount
const EMPTY_DATA_ROWS = `"date","amount","payee","description","category"
"2024-04-01",134.99,"Acme","Acme Salary April","Income"
,-34.99,"Internet","INET12345678-0","Bills"
"2024-04-02",,"Energy","A-0A00AA00-001","Bills"`;

const INVALID_AMOUNT_ROW = `"date","amount","payee","description","category"
"2024-04-02",£34.99,"Energy","A-0A00AA00-001","Bills"`;

const INVALID_DATE_ROW = `"date","amount","payee","description","category"
"13th Smarch 1995",134.99,"Energy","A-0A00AA00-001","Bills"`;

const EMPTY_INPUT = '\n\n';

test('deserialising csv', (t) => {
  t.deepEqual(csv(DATA), [
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

test('csv deserialiser should fail on malformed data', (t) => {
  t.throws(() => csv(MALFORMED_DATA));
});

test('csv deserialiser should ignore invalid rows', (t) => {
  const transactions = csv(EMPTY_DATA_ROWS);
  t.deepEqual(transactions, [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      payee: 'Acme',
      description: 'Acme Salary April',
      category: 'Income',
    },
  ]);
});

test('csv deserialiser should ignore items with critical missing fields', (t) => {
  t.true((csv(MISSING_AMOUNT_COLUMN) as Transaction[]).length === 0);
  t.true((csv(MISSING_DATE_COLUMN) as Transaction[]).length === 0);
});

test('csv deserialiser should fail on invalid date data', (t) => {
  t.throws(() => csv(INVALID_DATE_ROW));
});

test('csv deserialiser should fail on invalid amount data', (t) => {
  t.throws(() => csv(INVALID_AMOUNT_ROW));
});

test('csv deserialiser throws when given empty rows', (t) => {
  t.throws(() => csv(EMPTY_INPUT));
});

const DATA_WITH_METADATA = `"date","amount","payee","metadata"
"2024-04-01",134.99,"Acme","{""source"": ""bank-api"", ""id"": 123}"`;

const DATA_WITH_INVALID_METADATA = `"date","amount","payee","metadata"
"2024-04-01",134.99,"Acme","not valid json"`;

test('csv deserialiser parses metadata from JSON string', (t) => {
  const result = csv(DATA_WITH_METADATA);
  t.deepEqual(result, [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      payee: 'Acme',
      metadata: { source: 'bank-api', id: 123 },
    },
  ]);
});

test('csv deserialiser ignores invalid metadata JSON', (t) => {
  const result = csv(DATA_WITH_INVALID_METADATA);
  t.deepEqual(result, [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      payee: 'Acme',
    },
  ]);
});

test('csv deserialiser handles metadata as object from custom mapper', (t) => {
  const data = `"date","amount","payee","extra"
"2024-04-01",134.99,"Acme","some-value"`;
  const result = csv(data, {
    headers: true,
    map: (row) => ({
      date: row.date as string,
      amount: String(row.amount),
      payee: row.payee as string,
      metadata: { extra: row.extra },
    }),
  });
  t.deepEqual(result, [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 134.99,
      payee: 'Acme',
      metadata: { extra: 'some-value' },
    },
  ]);
});

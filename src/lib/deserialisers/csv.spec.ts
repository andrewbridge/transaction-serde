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

test('deserialising csv', async (t) => {
  t.deepEqual(await csv(DATA), [
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

test('csv deserialiser should fail on malformed data', async (t) => {
  await t.throwsAsync(() => csv(MALFORMED_DATA) as Promise<Transaction[]>);
});

test('csv deserialiser should ignore invalid rows', async (t) => {
  const transactions = await csv(EMPTY_DATA_ROWS);
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

test('csv deserialiser should ignore items with critical missing fields', async (t) => {
  t.true((await csv(MISSING_AMOUNT_COLUMN)).length === 0);
  t.true((await csv(MISSING_DATE_COLUMN)).length === 0);
});

test('csv deserialiser should fail on invalid date data', async (t) => {
  await t.throwsAsync(() => csv(INVALID_DATE_ROW) as Promise<Transaction[]>);
});

test('csv deserialiser should fail on invalid amount data', async (t) => {
  await t.throwsAsync(() => csv(INVALID_AMOUNT_ROW) as Promise<Transaction[]>);
});

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

const PARTIALLY_INVALID_DATA = [
  {
    date: new UTCDateMini(2024, 3, 1),
    amount: 134.99,
    payee: 'Acme',
    description: 'Acme Salary April',
    category: 'Income',
  },
  {
    date: undefined,
    amount: -34.99,
    payee: 'Internet',
    description: 'INET12345678-0',
    category: 'Bills',
  },
  {
    date: new Date('Not a real date'),
    amount: -100,
    payee: 'Energy',
    description: 'A-0A00AA00-001',
    category: 'Bills',
  },
];

test('serialising csv', async (t) => {
  t.is(
    await csv(DATA),
    '"date",amount,"payee","description","category"\n' +
      '"2024-04-01",134.99,"Acme","Acme Salary April","Income"\n' +
      '"2024-04-02",-34.99,"Internet","INET12345678-0","Bills"\n' +
      '"2024-04-02",-100,"Energy","A-0A00AA00-001","Bills"'
  );
});

test('csv serialiser will ignore items with invalid dates', async (t) => {
  t.is(
    await csv(PARTIALLY_INVALID_DATA),
    '"date",amount,"payee","description","category"\n' +
      '"2024-04-01",134.99,"Acme","Acme Salary April","Income"'
  );
});

test('csv serialiser includes metadata as JSON string', async (t) => {
  const dataWithMetadata = [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 100,
      payee: 'Store',
      metadata: { source: 'bank-api', id: 123 },
    },
  ];
  t.is(
    await csv(dataWithMetadata),
    '"date",amount,"payee","metadata"\n' +
      '"2024-04-01",100,"Store","{""source"":""bank-api"",""id"":123}"'
  );
});

test('csv serialiser includes time when present', async (t) => {
  const dataWithTime = [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 100,
      payee: 'Store',
      time: 52200000, // 14:30:00
    },
  ];
  t.is(
    await csv(dataWithTime),
    '"date",amount,"payee","time"\n' + '"2024-04-01",100,"Store","14:30:00"'
  );
});

test('csv serialiser uses empty string for missing time when some have time', async (t) => {
  const mixedTimeData = [
    {
      date: new UTCDateMini(2024, 3, 1),
      amount: 100,
      payee: 'Store',
      time: 52200000, // 14:30:00
    },
    {
      date: new UTCDateMini(2024, 3, 2),
      amount: 50,
      payee: 'Shop',
      // no time
    },
  ];
  t.is(
    await csv(mixedTimeData),
    '"date",amount,"payee","time"\n' +
      '"2024-04-01",100,"Store","14:30:00"\n' +
      '"2024-04-02",50,"Shop",""'
  );
});

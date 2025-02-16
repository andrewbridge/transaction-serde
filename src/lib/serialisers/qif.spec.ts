import { UTCDateMini } from '@date-fns/utc';
import test from 'ava';
import { Transaction } from 'transaction-serde';

import qif from './qif';

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
    date: new UTCDateMini(2024, 3, 2),
    amount: undefined,
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

const INCORRECTLY_TYPED_DATA = [
  {
    date: new UTCDateMini(2024, 3, 1),
    amount: 134.99,
    payee: 'Acme',
    category: 'Income',
    description: null,
  } as unknown as Transaction,
];

test('serialising qif', (t) => {
  t.is(
    qif(DATA),
    `!Type:Bank
D2024-04-01
T134.99
PAcme
LIncome
MAcme Salary April
^
D2024-04-02
T-34.99
PInternet
LBills
MINET12345678-0
^
D2024-04-02
T-100
PEnergy
LBills
MA-0A00AA00-001
^`
  );
});

test('qif serialiser ignores invalid objects with date and amount data', (t) => {
  t.is(
    qif(PARTIALLY_INVALID_DATA),
    `!Type:Bank
D2024-04-01
T134.99
PAcme
LIncome
MAcme Salary April
^`
  );
});

test('qif serialiser ignores non-string optional data', (t) => {
  t.is(
    qif(INCORRECTLY_TYPED_DATA),
    `!Type:Bank
D2024-04-01
T134.99
PAcme
LIncome
^`
  );
});

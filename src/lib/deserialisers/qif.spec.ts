import { UTCDateMini } from '@date-fns/utc';
import test from 'ava';

import qif from './qif';

const DATA = `
!Type:Bank
D01/04/2024
T134.99
PAcme
LIncome
MAcme Salary April
^
D02/04/2024
T-34.99
PInternet
LBills
MINET12345678-0
^
D02/04/2024
T-100
PEnergy
LBills
MA-0A00AA00-001
^`;

test('deserialising qif', (t) => {
  t.deepEqual(qif(DATA), [
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

import test from 'ava';

import qif from './qif';
import { UTCDateMini } from '@date-fns/utc';

const DATA = [
    {
        date: new UTCDateMini(2024, 3, 1),
        amount: 134.99,
        payee: 'Acme',
        category: 'Income',
        description: 'Acme Salary April'
    },
    {
        date: new UTCDateMini(2024, 3, 2),
        amount: -34.99,
        payee: 'Internet',
        category: 'Bills',
        description: 'INET12345678-0'
    },
    {
        date: new UTCDateMini(2024, 3, 2),
        amount: -100,
        payee: 'Energy',
        category: 'Bills',
        description: 'A-0A00AA00-001'
    }
];

test('serialising qif', (t) => {
    t.is(qif(DATA), 
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
^`)
});
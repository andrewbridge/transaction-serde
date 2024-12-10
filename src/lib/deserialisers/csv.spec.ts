import test from 'ava';

import csv from './csv';
import { UTCDateMini } from '@date-fns/utc';

const DATA = `"date","amount","payee","description","category"
"2024-04-01",134.99,"Acme","Acme Salary April","Income"
"2024-04-02",-34.99,"Internet","INET12345678-0","Bills"
"2024-04-02",-100,"Energy","A-0A00AA00-001","Bills"`;

test('deserialising csv', async (t) => {
    t.deepEqual(await csv(DATA), [
        {
            date: new UTCDateMini(2024, 3, 1),
            amount: 134.99,
            payee: 'Acme',
            description: 'Acme Salary April',
            category: 'Income'
        },
        {
            date: new UTCDateMini(2024, 3, 2),
            amount: -34.99,
            payee: 'Internet',
            description: 'INET12345678-0',
            category: 'Bills'
        },
        {
            date: new UTCDateMini(2024, 3, 2),
            amount: -100,
            payee: 'Energy',
            description: 'A-0A00AA00-001',
            category: 'Bills'
        }
    ])
});
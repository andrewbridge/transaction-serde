import test from 'ava';

import { createFieldMapper } from './fieldMapper';

test('createFieldMapper handles simple string mappings', (t) => {
  const mapper = createFieldMapper({
    date: 'Date',
    amount: 'Value',
  });
  const result = mapper({ Date: '2024-01-01', Value: '100' });
  t.deepEqual(result, { date: '2024-01-01', amount: '100' });
});

test('createFieldMapper handles all transaction fields', (t) => {
  const mapper = createFieldMapper({
    date: 'Transaction Date',
    amount: 'Value',
    payee: 'Merchant',
    description: 'Notes',
    category: 'Type',
  });
  const result = mapper({
    'Transaction Date': '2024-01-15',
    Value: '99.99',
    Merchant: 'Coffee Shop',
    Notes: 'Morning coffee',
    Type: 'Food & Drink',
  });
  t.deepEqual(result, {
    date: '2024-01-15',
    amount: '99.99',
    payee: 'Coffee Shop',
    description: 'Morning coffee',
    category: 'Food & Drink',
  });
});

test('createFieldMapper handles custom transform functions', (t) => {
  const mapper = createFieldMapper({
    date: 'Date',
    amount: (row) => {
      const credit = parseFloat(row['Credit'] as string) || 0;
      const debit = parseFloat(row['Debit'] as string) || 0;
      return String(credit - debit);
    },
  });
  const result = mapper({ Date: '2024-01-01', Credit: '100', Debit: '50' });
  t.deepEqual(result, { date: '2024-01-01', amount: '50' });
});

test('createFieldMapper handles transform function returning combined fields', (t) => {
  const mapper = createFieldMapper({
    date: 'Date',
    amount: 'Amount',
    description: (row) => `${row['Reference']} - ${row['Notes']}`,
  });
  const result = mapper({
    Date: '2024-01-01',
    Amount: '50',
    Reference: 'REF123',
    Notes: 'Payment',
  });
  t.deepEqual(result, {
    date: '2024-01-01',
    amount: '50',
    description: 'REF123 - Payment',
  });
});

test('createFieldMapper returns null for null input', (t) => {
  const mapper = createFieldMapper({ date: 'Date' });
  t.is(mapper(null as unknown as Record<string, unknown>), null);
});

test('createFieldMapper returns null for non-object input', (t) => {
  const mapper = createFieldMapper({ date: 'Date' });
  t.is(mapper('string' as unknown as Record<string, unknown>), null);
  t.is(mapper(123 as unknown as Record<string, unknown>), null);
  t.is(mapper(undefined as unknown as Record<string, unknown>), null);
});

test('createFieldMapper handles missing source fields', (t) => {
  const mapper = createFieldMapper({
    date: 'Date',
    amount: 'Amount',
    payee: 'Merchant',
  });
  const result = mapper({ Date: '2024-01-01', Amount: '100' });
  t.deepEqual(result, { date: '2024-01-01', amount: '100' });
});

test('createFieldMapper skips empty string values', (t) => {
  const mapper = createFieldMapper({
    date: 'Date',
    amount: 'Amount',
    payee: 'Merchant',
  });
  const result = mapper({ Date: '2024-01-01', Amount: '100', Merchant: '' });
  t.deepEqual(result, { date: '2024-01-01', amount: '100' });
});

test('createFieldMapper converts non-string values to strings', (t) => {
  const mapper = createFieldMapper({
    date: 'Date',
    amount: 'Amount',
  });
  const result = mapper({ Date: '2024-01-01', Amount: 100 });
  t.deepEqual(result, { date: '2024-01-01', amount: '100' });
});

test('createFieldMapper skips fields with transform function errors', (t) => {
  const mapper = createFieldMapper({
    date: 'Date',
    amount: () => {
      throw new Error('Transform error');
    },
  });
  const result = mapper({ Date: '2024-01-01' });
  t.deepEqual(result, { date: '2024-01-01' });
});

test('createFieldMapper ignores unmapped fields in source', (t) => {
  const mapper = createFieldMapper({
    date: 'Date',
    amount: 'Amount',
  });
  const result = mapper({
    Date: '2024-01-01',
    Amount: '100',
    ExtraField: 'ignored',
    AnotherField: 'also ignored',
  });
  t.deepEqual(result, { date: '2024-01-01', amount: '100' });
});

test('createFieldMapper with empty mapping returns empty object', (t) => {
  const mapper = createFieldMapper({});
  const result = mapper({ Date: '2024-01-01', Amount: '100' });
  t.deepEqual(result, {});
});

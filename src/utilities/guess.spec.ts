import test from 'ava';

import { guess } from './guess';

// Exact field name matching
test('guess matches exact field names with high confidence', (t) => {
  const result = guess(['date', 'amount', 'payee']);
  t.is(result.guesses.length, 3);
  t.true(result.guesses.every((g) => g.confidence === 'high'));
});

test('guess matches case-insensitively', (t) => {
  const result = guess(['DATE', 'Amount', 'PAYEE']);
  t.is(result.mapping.date, 'DATE');
  t.is(result.mapping.amount, 'Amount');
  t.is(result.mapping.payee, 'PAYEE');
});

// Common variations
test('guess matches transaction date variations', (t) => {
  const result = guess(['Transaction Date']);
  t.is(result.mapping.date, 'Transaction Date');
  t.is(result.guesses[0].confidence, 'high');
});

test('guess matches posting date', (t) => {
  const result = guess(['Posting Date']);
  t.is(result.mapping.date, 'Posting Date');
});

test('guess matches value as amount', (t) => {
  const result = guess(['Value']);
  t.is(result.mapping.amount, 'Value');
  t.is(result.guesses[0].confidence, 'high');
});

test('guess matches merchant as payee', (t) => {
  const result = guess(['Merchant']);
  t.is(result.mapping.payee, 'Merchant');
});

test('guess matches memo as description', (t) => {
  const result = guess(['Memo']);
  t.is(result.mapping.description, 'Memo');
});

test('guess matches category exactly', (t) => {
  const result = guess(['Category']);
  t.is(result.mapping.category, 'Category');
});

// Medium confidence patterns
test('guess matches debit as amount with medium confidence', (t) => {
  const result = guess(['Debit']);
  t.is(result.mapping.amount, 'Debit');
  t.is(result.guesses[0].confidence, 'medium');
});

test('guess matches name as payee with medium confidence', (t) => {
  const result = guess(['Name']);
  t.is(result.mapping.payee, 'Name');
  t.is(result.guesses[0].confidence, 'medium');
});

test('guess matches type as category with medium confidence', (t) => {
  const result = guess(['Type']);
  t.is(result.mapping.category, 'Type');
  t.is(result.guesses[0].confidence, 'medium');
});

// Unmapped fields
test('guess reports unmapped fields', (t) => {
  const result = guess(['date', 'amount', 'random_field', 'unknown']);
  t.true(result.unmappedFields.includes('random_field'));
  t.true(result.unmappedFields.includes('unknown'));
});

test('guess returns empty unmapped when all fields match', (t) => {
  const result = guess(['date', 'amount']);
  t.deepEqual(result.unmappedFields, []);
});

// Minimum confidence filtering
test('guess respects minConfidence high', (t) => {
  const result = guess(['date', 'Debit'], { minConfidence: 'high' });
  // 'date' is high confidence, 'Debit' is medium
  t.is(result.guesses.length, 1);
  t.is(result.mapping.date, 'date');
  t.is(result.mapping.amount, undefined);
  t.true(result.unmappedFields.includes('Debit'));
});

test('guess includes medium confidence by default', (t) => {
  const result = guess(['Debit']);
  t.is(result.mapping.amount, 'Debit');
});

// No duplicate target mappings
test('guess does not create duplicate target mappings', (t) => {
  const result = guess(['date', 'transaction_date', 'posting_date']);
  const dateMappings = result.guesses.filter((g) => g.targetField === 'date');
  t.is(dateMappings.length, 1);
  t.is(dateMappings[0].sourceField, 'date'); // First match wins
});

test('guess maps each source to at most one target', (t) => {
  const result = guess(['Amount', 'Value']);
  // Both could match amount, but only one should
  const amountMappings = result.guesses.filter(
    (g) => g.targetField === 'amount'
  );
  t.is(amountMappings.length, 1);
});

// Value-based boosting
test('guess boosts confidence when sample values look like dates', (t) => {
  const result = guess(['When'], {
    sample: [{ When: '2024-01-15' }, { When: '2024-01-16' }],
  });
  t.is(result.mapping.date, 'When');
  t.is(result.guesses[0].confidence, 'high');
  t.true(result.guesses[0].reason.includes('boosted'));
});

test('guess boosts confidence when sample values look like amounts', (t) => {
  const result = guess(['Total'], {
    sample: [{ Total: '100.50' }, { Total: '-25.00' }],
  });
  t.is(result.mapping.amount, 'Total');
  t.is(result.guesses[0].confidence, 'high');
});

test('guess boosts confidence when sample values look like times', (t) => {
  const result = guess(['clock'], {
    sample: [{ clock: '14:30:00' }, { clock: '09:15:00' }],
  });
  t.is(result.mapping.time, 'clock');
  t.is(result.guesses[0].confidence, 'high');
  t.true(result.guesses[0].reason.includes('boosted'));
});

test('guess does not boost confidence when sample values are empty', (t) => {
  const result = guess(['When'], {
    sample: [{ When: '' }, { When: '' }],
  });
  t.is(result.mapping.date, 'When');
  t.is(result.guesses[0].confidence, 'medium');
});

test('guess does not boost confidence when sample values are not dates or amounts', (t) => {
  const result = guess(['When'], {
    sample: [{ When: 'hello' }, { When: 'world' }],
  });
  t.is(result.mapping.date, 'When');
  t.is(result.guesses[0].confidence, 'medium');
});

// Significance heuristic — embedded digits should not boost
test('guess does not boost text with embedded digits as amount', (t) => {
  const result = guess(['Total'], {
    sample: [
      { Total: 'CAFE*TH3 BREWHOUSE' },
      { Total: 'STARBUCKS*DRIVE THRU' },
    ],
  });
  t.is(result.mapping.amount, 'Total');
  t.is(result.guesses[0].confidence, 'medium');
});

test('guess boosts confidence when sample values have currency symbols', (t) => {
  const result = guess(['Total'], {
    sample: [{ Total: '$100.50' }, { Total: '-25.00' }],
  });
  t.is(result.mapping.amount, 'Total');
  t.is(result.guesses[0].confidence, 'high');
});

test('guess boosts confidence when sample values are already numbers', (t) => {
  const result = guess(['Total'], {
    sample: [{ Total: 100.5 }, { Total: -25 }],
  });
  t.is(result.mapping.amount, 'Total');
  t.is(result.guesses[0].confidence, 'high');
});

test('guess does not boost text with embedded digits as date', (t) => {
  const result = guess(['When'], {
    sample: [{ When: 'CAFE*TH3 BREWHOUSE' }],
  });
  t.is(result.mapping.date, 'When');
  t.is(result.guesses[0].confidence, 'medium');
});

// Full workflow scenarios
test('guess handles typical bank export headers', (t) => {
  const result = guess([
    'Transaction Date',
    'Value',
    'Merchant Name',
    'Description',
    'Category',
  ]);
  t.is(result.mapping.date, 'Transaction Date');
  t.is(result.mapping.amount, 'Value');
  t.is(result.mapping.payee, 'Merchant Name');
  t.is(result.mapping.description, 'Description');
  t.is(result.mapping.category, 'Category');
  t.deepEqual(result.unmappedFields, []);
});

test('guess handles minimal headers', (t) => {
  const result = guess(['Date', 'Amount']);
  t.is(result.mapping.date, 'Date');
  t.is(result.mapping.amount, 'Amount');
  t.is(Object.keys(result.mapping).length, 2);
});

test('guess returns empty mapping for unrecognized fields', (t) => {
  const result = guess(['foo', 'bar', 'baz']);
  t.deepEqual(result.mapping, {});
  t.deepEqual(result.guesses, []);
  t.deepEqual(result.unmappedFields, ['foo', 'bar', 'baz']);
});

// Edge cases
test('guess handles empty fields array', (t) => {
  const result = guess([]);
  t.deepEqual(result.mapping, {});
  t.deepEqual(result.guesses, []);
  t.deepEqual(result.unmappedFields, []);
});

test('guess handles fields with special characters', (t) => {
  const result = guess(['Transaction Date (UTC)', 'Amount ($)']);
  // These don't match patterns, should be unmapped
  t.true(result.unmappedFields.includes('Transaction Date (UTC)'));
  t.true(result.unmappedFields.includes('Amount ($)'));
});

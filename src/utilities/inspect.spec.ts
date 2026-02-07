import test from 'ava';

import { inspect } from './inspect';

// CSV format detection and parsing
test('inspect detects CSV format', (t) => {
  const csv = 'date,amount,payee\n2024-01-01,100,Store';
  const result = inspect(csv);
  t.is(result.format, 'csv');
});

test('inspect extracts CSV headers as fields', (t) => {
  const csv = 'Date,Amount,Merchant,Description\n2024-01-01,100,Store,Purchase';
  const result = inspect(csv);
  t.deepEqual(result.fields, ['Date', 'Amount', 'Merchant', 'Description']);
});

test('inspect returns correct record count for CSV', (t) => {
  const csv = 'a,b\n1,2\n3,4\n5,6\n7,8\n9,10';
  const result = inspect(csv);
  t.is(result.recordCount, 5);
});

// JSON format detection and parsing
test('inspect detects JSON array format', (t) => {
  const json = '[{"date":"2024-01-01","amount":100}]';
  const result = inspect(json);
  t.is(result.format, 'json');
});

test('inspect detects JSON object format', (t) => {
  const json = '{"date":"2024-01-01","amount":100}';
  const result = inspect(json);
  t.is(result.format, 'json');
});

test('inspect extracts JSON fields from all records', (t) => {
  const json = '[{"a":1,"b":2},{"a":1,"c":3}]';
  const result = inspect(json);
  t.deepEqual(result.fields.sort(), ['a', 'b', 'c']);
});

test('inspect returns correct record count for JSON', (t) => {
  const json = '[{"a":1},{"a":2},{"a":3},{"a":4}]';
  const result = inspect(json);
  t.is(result.recordCount, 4);
});

// Sample size limiting
test('inspect respects sampleSize option', (t) => {
  const csv = 'a\n1\n2\n3\n4\n5';
  const result = inspect(csv, { sampleSize: 2 });
  t.is(result.sample.length, 2);
  t.is(result.recordCount, 5);
});

test('inspect returns all records if less than sampleSize', (t) => {
  const csv = 'a\n1\n2';
  const result = inspect(csv, { sampleSize: 5 });
  t.is(result.sample.length, 2);
});

test('inspect defaults to 3 sample records', (t) => {
  const csv = 'a\n1\n2\n3\n4\n5';
  const result = inspect(csv);
  t.is(result.sample.length, 3);
});

// Value parsing
test('inspect parses numeric values when attemptParsing is true', (t) => {
  const csv = 'amount\n100\n-50.25';
  const result = inspect(csv, { attemptParsing: true });
  t.is(result.sample[0].amount, 100);
  t.is(result.sample[1].amount, -50.25);
});

test('inspect parses values with currency prefix', (t) => {
  const csv = 'amount\n$100\n£50.25';
  const result = inspect(csv, { attemptParsing: true });
  t.is(result.sample[0].amount, 100);
  t.is(result.sample[1].amount, 50.25);
});

test('inspect parses values with currency suffix', (t) => {
  const csv = 'amount\n100 USD\n50.25 EUR';
  const result = inspect(csv, { attemptParsing: true });
  t.is(result.sample[0].amount, 100);
  t.is(result.sample[1].amount, 50.25);
});

test('inspect parses ISO date values', (t) => {
  const csv = 'date\n2024-01-15';
  const result = inspect(csv, { attemptParsing: true });
  t.is(result.sample[0].date, '2024-01-15');
});

test('inspect returns raw strings when attemptParsing is false', (t) => {
  const csv = 'amount,date\n100,2024-01-15';
  const result = inspect(csv, { attemptParsing: false });
  t.is(result.sample[0].amount, '100');
  t.is(result.sample[0].date, '2024-01-15');
});

test('inspect preserves non-parseable strings', (t) => {
  const csv = 'name\nCoffee Shop';
  const result = inspect(csv, { attemptParsing: true });
  t.is(result.sample[0].name, 'Coffee Shop');
});

test('inspect preserves text with embedded digits', (t) => {
  const csv = 'description\nCAFE*TH3 BREWHOUSE';
  const result = inspect(csv, { attemptParsing: true });
  t.is(result.sample[0].description, 'CAFE*TH3 BREWHOUSE');
});

// Edge cases
test('inspect handles whitespace in CSV', (t) => {
  const csv = '  date,amount\n  2024-01-01,100  ';
  const result = inspect(csv);
  t.is(result.format, 'csv');
  t.is(result.recordCount, 1);
});

test('inspect handles whitespace around JSON', (t) => {
  const json = '  [{"a":1}]  ';
  const result = inspect(json);
  t.is(result.format, 'json');
  t.is(result.recordCount, 1);
});

test('inspect falls back to CSV for invalid JSON', (t) => {
  const invalid = '[invalid json';
  const result = inspect(invalid);
  t.is(result.format, 'csv');
});

test('inspect handles empty values', (t) => {
  const csv = 'a,b\n1,\n,2';
  const result = inspect(csv);
  t.is(result.sample.length, 2);
});

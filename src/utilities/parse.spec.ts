import test from 'ava';

import {
  detectFormat,
  parseCsv,
  parseJson,
  parseMetadata,
  tryParseDate,
  tryParseNumber,
} from './parse';

// detectFormat tests
test('detectFormat detects JSON array', (t) => {
  t.is(detectFormat('[{"a":1}]'), 'json');
});

test('detectFormat detects JSON object', (t) => {
  t.is(detectFormat('{"a":1}'), 'json');
});

test('detectFormat detects CSV', (t) => {
  t.is(detectFormat('a,b\n1,2'), 'csv');
});

test('detectFormat returns csv for invalid JSON starting with [', (t) => {
  t.is(detectFormat('[invalid'), 'csv');
});

test('detectFormat handles whitespace', (t) => {
  t.is(detectFormat('  [{"a":1}]  '), 'json');
});

// parseCsv tests
test('parseCsv parses simple CSV', (t) => {
  const result = parseCsv('a,b\n1,2');
  t.deepEqual(result.fields, ['a', 'b']);
  t.is(result.data.length, 1);
  t.deepEqual(result.data[0], { a: '1', b: '2' });
});

test('parseCsv extracts fields', (t) => {
  const result = parseCsv('Date,Amount,Payee\n2024-01-01,100,Store');
  t.deepEqual(result.fields, ['Date', 'Amount', 'Payee']);
});

test('parseCsv handles multiple rows', (t) => {
  const result = parseCsv('a\n1\n2\n3');
  t.is(result.data.length, 3);
});

test('parseCsv trims input', (t) => {
  const result = parseCsv('  a\n1  ');
  t.deepEqual(result.fields, ['a']);
  t.is(result.data.length, 1);
});

test('parseCsv skips rows before headers with skipRows', (t) => {
  const input = 'junk line\nanother junk line\na,b\n1,2\n3,4';
  const result = parseCsv(input, true, 2);
  t.deepEqual(result.fields, ['a', 'b']);
  t.is(result.data.length, 2);
  t.deepEqual(result.data[0], { a: '1', b: '2' });
  t.deepEqual(result.data[1], { a: '3', b: '4' });
});

test('parseCsv with skipRows 0 does not skip any rows', (t) => {
  const input = 'a,b\n1,2';
  const result = parseCsv(input, true, 0);
  t.deepEqual(result.fields, ['a', 'b']);
  t.is(result.data.length, 1);
});

// parseJson tests
test('parseJson parses JSON array', (t) => {
  const result = parseJson('[{"a":1},{"b":2}]');
  t.is(result.data.length, 2);
  t.deepEqual(result.data[0], { a: 1 });
  t.deepEqual(result.data[1], { b: 2 });
});

test('parseJson wraps single object in array', (t) => {
  const result = parseJson('{"a":1}');
  t.is(result.data.length, 1);
  t.deepEqual(result.data[0], { a: 1 });
});

test('parseJson extracts all unique fields', (t) => {
  const result = parseJson('[{"a":1,"b":2},{"a":1,"c":3}]');
  t.deepEqual(result.fields.sort(), ['a', 'b', 'c']);
});

test('parseJson filters non-objects from array', (t) => {
  const result = parseJson('[{"a":1},null,"string",123]');
  t.is(result.data.length, 1);
});

test('parseJson throws for invalid JSON', (t) => {
  t.throws(() => parseJson('invalid'), { message: 'Input is not valid JSON' });
});

test('parseJson trims input', (t) => {
  const result = parseJson('  [{"a":1}]  ');
  t.is(result.data.length, 1);
});

// tryParseNumber tests
test('tryParseNumber parses simple integers', (t) => {
  t.is(tryParseNumber('100'), 100);
  t.is(tryParseNumber('0'), 0);
});

test('tryParseNumber parses negative numbers', (t) => {
  t.is(tryParseNumber('-50'), -50);
  t.is(tryParseNumber('-100.25'), -100.25);
});

test('tryParseNumber parses decimals', (t) => {
  t.is(tryParseNumber('99.99'), 99.99);
  t.is(tryParseNumber('.5'), 0.5);
  t.is(tryParseNumber('100.50'), 100.5);
  t.is(tryParseNumber('-25.00'), -25);
});

test('tryParseNumber handles currency prefix', (t) => {
  t.is(tryParseNumber('$100'), 100);
  t.is(tryParseNumber('£50.25'), 50.25);
  t.is(tryParseNumber('€99'), 99);
});

test('tryParseNumber handles currency suffix', (t) => {
  t.is(tryParseNumber('100 USD'), 100);
  t.is(tryParseNumber('50.25 EUR'), 50.25);
});

test('tryParseNumber returns null for non-numeric strings', (t) => {
  t.is(tryParseNumber('abc'), null);
  t.is(tryParseNumber('Coffee Shop'), null);
});

test('tryParseNumber returns null for date-like strings', (t) => {
  t.is(tryParseNumber('2024-01-15'), null);
  t.is(tryParseNumber('2024.01.15'), null);
});

test('tryParseNumber returns null for Infinity', (t) => {
  t.is(tryParseNumber('Infinity'), null);
  t.is(tryParseNumber('-Infinity'), null);
});

test('tryParseNumber returns null for empty string', (t) => {
  t.is(tryParseNumber(''), null);
});

test('tryParseNumber handles whitespace', (t) => {
  t.is(tryParseNumber('  100  '), 100);
});

// parseMetadata tests
test('parseMetadata parses valid JSON string', (t) => {
  t.deepEqual(parseMetadata('{"key": "value"}'), { key: 'value' });
});

test('parseMetadata passes through object directly', (t) => {
  const obj = { key: 'value', nested: { a: 1 } };
  t.deepEqual(parseMetadata(obj), obj);
});

test('parseMetadata returns undefined for invalid JSON string', (t) => {
  t.is(parseMetadata('not valid json'), undefined);
});

test('parseMetadata returns undefined for undefined input', (t) => {
  t.is(parseMetadata(undefined), undefined);
});

// tryParseDate tests
test('tryParseDate parses ISO date', (t) => {
  t.is(tryParseDate('2024-01-15'), '2024-01-15');
});

test('tryParseDate parses DD/MM/YYYY date', (t) => {
  const result = tryParseDate('15/01/2024');
  t.is(typeof result, 'string');
  t.truthy(result);
});

test('tryParseDate returns null for non-date strings', (t) => {
  t.is(tryParseDate('Coffee Shop'), null);
  t.is(tryParseDate('CAFE*TH3 BREWHOUSE'), null);
  t.is(tryParseDate('100.50'), null);
});

test('tryParseDate returns null for empty string', (t) => {
  t.is(tryParseDate(''), null);
});

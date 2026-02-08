# transaction-serde

A TypeScript library for serialising and deserialising financial transaction data between JSON, CSV, and QIF formats.

[![npm version](https://img.shields.io/npm/v/transaction-serde.svg)](https://www.npmjs.com/package/transaction-serde)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Multi-format support**: Convert between JSON, CSV, and QIF (Quicken Interchange Format)
- **Automatic date parsing**: Handles multiple date formats automatically
- **TypeScript support**: Full type definitions included
- **Flexible CSV handling**: Custom mapping functions for non-standard CSV formats
- **Data inspection**: Inspect unknown data to see headers and sample records
- **Field guessing**: Heuristics to automatically guess field mappings for bank exports
- **Browser & Node.js**: Works in both environments

## Installation

```bash
npm install transaction-serde
```

## Quick Start

```typescript
import { serialisers, deserialisers } from 'transaction-serde';

// Parse transactions from CSV
const csv = `date,amount,payee,description,category
2024-01-15,100.00,Salary,Monthly salary,Income
2024-01-16,-25.50,Coffee Shop,Morning coffee,Food & Drink`;

const transactions = deserialisers.csv(csv);

// Convert to JSON
const json = serialisers.json(transactions);

// Convert to QIF
const qif = serialisers.qif(transactions);
```

### Working with Unknown Data

When you have a bank export with non-standard column names, use the utilities to inspect and guess mappings:

```typescript
import { deserialisers, utils } from 'transaction-serde';

// Inspect unknown CSV to see its structure
const bankExport = `Transaction Date,Value,Merchant,Notes
2024-01-15,100,Employer,Monthly salary
2024-01-16,-25.50,Coffee Shop,Morning coffee`;

const report = utils.inspect(bankExport);
// => { format: 'csv', fields: ['Transaction Date', 'Value', 'Merchant', 'Notes'], ... }

// Guess field mappings from headers
const guessed = utils.guess(report.fields, { sample: report.sample });
// => { mapping: { date: 'Transaction Date', amount: 'Value', payee: 'Merchant', ... } }

// Create a mapper and parse
const mapper = utils.createFieldMapper(guessed.mapping);
const transactions = deserialisers.csv(bankExport, { map: mapper });
```

## API

### Transaction Type

All functions work with the `Transaction` type:

```typescript
type Transaction = Partial<{
  date: Date;        // Transaction date
  amount: number;    // Amount (positive for income, negative for expenses)
  payee: string;     // Payee or merchant name
  description: string; // Transaction description/memo
  category: string;  // Category classification
}>;
```

### Deserialisers

#### `deserialisers.json(input: string): Transaction[]`

Parses a JSON string containing an array of transaction objects.

```typescript
const json = '[{"date":"2024-01-15","amount":100,"payee":"Store"}]';
const transactions = deserialisers.json(json);
```

#### `deserialisers.csv(input: string, options?): Transaction[]`

Parses a CSV string with headers into transactions.

```typescript
// Standard CSV with matching headers
const transactions = deserialisers.csv(csvString);

// Custom mapping for non-standard headers
const transactions = deserialisers.csv(csvString, {
  headers: true,
  map: (row) => ({
    date: row.Date,
    amount: row.Value,
    payee: row.Merchant
  })
});
```

**Options:**
- `headers` (boolean): Whether the CSV has headers. Default: `true`
- `skipRows` (number): Number of rows to skip before the header row. Default: `0`
- `map` (function): Custom function to map CSV rows to transaction fields

#### `deserialisers.qif(input: string): Transaction[]`

Parses a QIF string into transactions.

```typescript
const qif = `!Type:Bank
D2024-01-15
T100
PStore
^`;
const transactions = deserialisers.qif(qif);
```

### Serialisers

#### `serialisers.json(transactions: Transaction[]): string`

Converts transactions to a JSON string with ISO date format.

```typescript
const json = serialisers.json(transactions);
// '[{"date":"2024-01-15","amount":100,"payee":"Store"}]'
```

#### `serialisers.csv(transactions: Transaction[]): string`

Converts transactions to a CSV string with headers.

```typescript
const csv = serialisers.csv(transactions);
// 'date,amount,payee,description,category\n"2024-01-15",100,"Store",...'
```

#### `serialisers.qif(transactions: Transaction[], options?): string`

Converts transactions to QIF format.

```typescript
const qif = serialisers.qif(transactions);

// With options
const qif = serialisers.qif(transactions, {
  locale: 'en-GB',
  header: '!Type:CCard'
});
```

**Options:**
- `locale` (string | string[]): Locale for number formatting. Default: `'en-US'`
- `header` (string): QIF account type header. Default: `'!Type:Bank'`

**Available headers:**
- `!Type:Bank` - Bank account
- `!Type:Cash` - Cash account
- `!Type:CCard` - Credit card
- `!Type:Oth A` - Other assets
- `!Type:Oth L` - Liabilities

### Utilities

#### `utils.inspect(input: string, options?): InspectResult`

Inspects CSV or JSON data to extract field names and sample records.

```typescript
const report = utils.inspect(csvOrJsonString);
// => {
//   format: 'csv',
//   fields: ['Date', 'Amount', 'Merchant'],
//   sample: [{ Date: '2024-01-15', Amount: '100', Merchant: 'Store' }],
//   recordCount: 100
// }
```

**Options:**
- `sampleSize` (number): Number of sample records to return. Default: `3`
- `skipRows` (number): Number of rows to skip before the column headers (CSV only). Default: `0`

#### `utils.guess(fields: string[], options?): GuessResult`

Uses heuristics to guess field mappings from header names.

```typescript
const result = utils.guess(['Transaction Date', 'Value', 'Merchant']);
// => {
//   mapping: { date: 'Transaction Date', amount: 'Value', payee: 'Merchant' },
//   guesses: [{ sourceField: 'Transaction Date', targetField: 'date', confidence: 'high', ... }],
//   unmappedFields: []
// }
```

**Options:**
- `minConfidence` ('high' | 'medium'): Minimum confidence to include. Default: `'medium'`
- `sample` (Record[]): Sample records to analyze for value-based heuristics

Recognises `amount_inflow` and `amount_outflow` targets for bank exports with separate credit/debit columns (e.g. "Paid In", "Debit", "Credit"). Use a custom transform with `createFieldMapper` to combine them into `amount`.

#### `utils.createFieldMapper(mapping): MapFunction`

Creates a map function from a simple field mapping configuration.

```typescript
// Simple string mappings
const mapper = utils.createFieldMapper({
  date: 'Transaction Date',
  amount: 'Value',
  payee: 'Merchant'
});

// With custom transform functions
const mapper = utils.createFieldMapper({
  date: 'Date',
  amount: (row) => {
    const debit = parseFloat(row['Debit'] as string) || 0;
    const credit = parseFloat(row['Credit'] as string) || 0;
    return String(credit - debit);
  },
  payee: 'Merchant'
});

const transactions = deserialisers.csv(csv, { map: mapper });
```

## Date Handling

The library automatically parses dates in many common formats:

- ISO format: `2024-01-15`, `2024/01/15`
- UK format: `15/01/2024`, `15-01-2024`
- US format: `01/15/2024`, `01-15-2024`
- Text formats: `15 January 2024`, `Jan 15 2024`

All dates are converted to UTC to ensure consistent handling across timezones.

## Error Handling

The library throws errors for invalid input:

```typescript
try {
  const transactions = deserialisers.json('not valid json');
} catch (error) {
  // Error: Input is not valid JSON
}

try {
  const transactions = deserialisers.qif('invalid header\ndata');
} catch (error) {
  // Error: Unknown header: invalid header
}
```

## Browser Usage

The library is available as an ES module and IIFE bundle for browser use:

```html
<!-- ES Module -->
<script type="module">
  import { serialisers, deserialisers } from 'transaction-serde';
</script>

<!-- IIFE Bundle -->
<script src="node_modules/transaction-serde/build/browser/index.iife.js"></script>
<script>
  const { serialisers, deserialisers } = transactionSerde;
</script>
```

## Documentation

- [API Reference](docs/api.md) - Detailed API documentation
- [Format Specifications](docs/formats.md) - Details on supported file formats

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)

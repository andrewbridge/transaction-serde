# API Reference

Complete API documentation for transaction-serde.

## Table of Contents

- [Types](#types)
  - [Transaction](#transaction)
  - [TransactionLike](#transactionlike)
  - [Deserialiser](#deserialiser)
  - [Serialiser](#serialiser)
- [Deserialisers](#deserialisers)
  - [deserialisers.json](#deserialisersjson)
  - [deserialisers.csv](#deserialiserscsv)
  - [deserialisers.qif](#deserialisersqif)
- [Serialisers](#serialisers)
  - [serialisers.json](#serialisersjson)
  - [serialisers.csv](#serialiserscsv)
  - [serialisers.qif](#serialisersqif)
- [Utilities](#utilities)
  - [utils.inspect](#utilsinspect)
  - [utils.guess](#utilsguess)
  - [utils.createFieldMapper](#utilscreatefieldmapper)

---

## Types

### Transaction

```typescript
type Transaction = Partial<{
  date: Date;
  amount: number;
  payee: string;
  description: string;
  category: string;
}>;
```

Represents a financial transaction. All fields are optional to allow partial data during parsing, but most operations require at least `date` and `amount` to be present.

| Property | Type | Description |
|----------|------|-------------|
| `date` | `Date` | The date the transaction occurred |
| `amount` | `number` | Transaction amount. Positive for income, negative for expenses |
| `payee` | `string` | Name of the payee, merchant, or counterparty |
| `description` | `string` | Additional description or memo for the transaction |
| `category` | `string` | Category or classification of the transaction |

**Example:**

```typescript
const transaction: Transaction = {
  date: new Date('2024-01-15'),
  amount: -42.50,
  payee: 'Grocery Store',
  description: 'Weekly groceries',
  category: 'Food & Groceries'
};
```

### TransactionLike

```typescript
type TransactionLike = {
  [K in keyof Transaction]: string;
};
```

An intermediate representation where all transaction fields are strings. Used internally during deserialisation before values are parsed to their proper types.

### Deserialiser

```typescript
type Deserialiser<Options = never> = (
  input: string,
  options?: Options
) => Transaction[] | Promise<Transaction[]>;
```

Function signature for all deserialiser functions. Takes a string input and optional configuration, returns an array of transactions.

### Serialiser

```typescript
type Serialiser<Options = never> = (
  object: Transaction[],
  options?: Options
) => string | Promise<string>;
```

Function signature for all serialiser functions. Takes an array of transactions and optional configuration, returns a string.

---

## Deserialisers

Functions that convert string data into `Transaction[]`.

### deserialisers.json

```typescript
function json(input: string): Transaction[]
```

Parses a JSON string containing an array of transaction objects.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | JSON string to parse |

**Returns:** `Transaction[]` - Array of parsed transactions

**Throws:**
- `Error` - If input is not valid JSON
- `Error` - If input is not an array
- `TypeError` - If an amount cannot be parsed as a number

**Example:**

```typescript
import { deserialisers } from 'transaction-serde';

const json = `[
  {"date": "2024-01-15", "amount": 100, "payee": "Employer"},
  {"date": "2024-01-16", "amount": -25.50, "payee": "Coffee Shop"}
]`;

const transactions = deserialisers.json(json);
// Returns:
// [
//   { date: Date(2024-01-15), amount: 100, payee: 'Employer' },
//   { date: Date(2024-01-16), amount: -25.50, payee: 'Coffee Shop' }
// ]
```

**Notes:**
- Transactions without `date` or `amount` fields are skipped
- Dates are parsed from string format using automatic format detection
- Amounts can be provided as numbers or numeric strings

---

### deserialisers.csv

```typescript
function csv(input: string, options?: DeserialiserOptions): Transaction[]
```

Parses a CSV string with headers into transaction objects.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | CSV string to parse |
| `options` | `DeserialiserOptions` | Optional configuration |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headers` | `boolean` | `true` | Whether the CSV has a header row |
| `map` | `function` | (see below) | Custom function to map CSV rows to transaction fields |

The default `map` function extracts fields that match transaction property names:

```typescript
(object) => {
  const transaction = {};
  ['date', 'amount', 'payee', 'description', 'category'].forEach(key => {
    if (typeof object[key] === 'string') {
      transaction[key] = object[key];
    }
  });
  return transaction;
}
```

**Returns:** `Transaction[]` - Array of parsed transactions

**Throws:**
- `Error` - If the CSV data is invalid
- `TypeError` - If an amount cannot be parsed as a number

**Example - Standard CSV:**

```typescript
import { deserialisers } from 'transaction-serde';

const csv = `date,amount,payee,description,category
2024-01-15,100,Employer,Monthly salary,Income
2024-01-16,-25.50,Coffee Shop,Morning coffee,Food & Drink`;

const transactions = deserialisers.csv(csv);
```

**Example - Custom mapping:**

```typescript
// CSV with non-standard column names
const csv = `Transaction Date,Value,Merchant,Notes
2024-01-15,100,Employer,Monthly salary
2024-01-16,-25.50,Coffee Shop,Morning coffee`;

const transactions = deserialisers.csv(csv, {
  map: (row) => ({
    date: row['Transaction Date'],
    amount: row['Value'],
    payee: row['Merchant'],
    description: row['Notes']
  })
});
```

---

### deserialisers.qif

```typescript
function qif(input: string): Transaction[]
```

Parses a QIF (Quicken Interchange Format) string into transaction objects.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | QIF string to parse |

**Returns:** `Transaction[]` - Array of parsed transactions

**Throws:**
- `Error` - If the QIF header is unknown or invalid

**Supported QIF Field Indicators:**

| Indicator | Transaction Field |
|-----------|-------------------|
| `D` | `date` |
| `T` | `amount` |
| `P` | `payee` |
| `M` | `description` |
| `L` | `category` |

**Example:**

```typescript
import { deserialisers } from 'transaction-serde';

const qif = `!Type:Bank
D2024-01-15
T100
PEmployer
MMonthly salary
LIncome
^
D2024-01-16
T-25.50
PCoffee Shop
MMorning coffee
LFood & Drink
^`;

const transactions = deserialisers.qif(qif);
```

---

## Serialisers

Functions that convert `Transaction[]` into string formats.

### serialisers.json

```typescript
function json(input: Transaction[]): string
```

Serialises an array of transactions to JSON format.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Transaction[]` | Transactions to serialise |

**Returns:** `string` - JSON string representation

**Example:**

```typescript
import { serialisers } from 'transaction-serde';

const transactions = [
  { date: new Date('2024-01-15'), amount: 100, payee: 'Employer' }
];

const json = serialisers.json(transactions);
// '[{"date":"2024-01-15","amount":100,"payee":"Employer"}]'
```

**Notes:**
- Dates are formatted as ISO 8601 date strings (YYYY-MM-DD)
- Transactions with invalid or missing dates are skipped

---

### serialisers.csv

```typescript
function csv(input: Transaction[]): string
```

Serialises an array of transactions to CSV format.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Transaction[]` | Transactions to serialise |

**Returns:** `string` - CSV string with headers

**Example:**

```typescript
import { serialisers } from 'transaction-serde';

const transactions = [
  { date: new Date('2024-01-15'), amount: 100, payee: 'Employer' }
];

const csv = serialisers.csv(transactions);
// "date","amount","payee","description","category"
// "2024-01-15",100,"Employer",,
```

**Notes:**
- Includes a header row with all transaction fields
- String values are quoted, numeric values (amount) are not
- Dates are formatted as ISO 8601 date strings (YYYY-MM-DD)
- Transactions with invalid or missing dates are skipped

---

### serialisers.qif

```typescript
function qif(input: Transaction[], options?: SerialiserOptions): string
```

Serialises an array of transactions to QIF format.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Transaction[]` | Transactions to serialise |
| `options` | `SerialiserOptions` | Optional configuration |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `locale` | `string \| string[]` | `'en-US'` | Locale for number formatting |
| `header` | `string` | `'!Type:Bank'` | QIF account type header |

**Available Headers:**

| Constant | Value | Description |
|----------|-------|-------------|
| `HEADERS.BANK` | `'!Type:Bank'` | Bank account |
| `HEADERS.CASH` | `'!Type:Cash'` | Cash account |
| `HEADERS.CREDIT_CARD` | `'!Type:CCard'` | Credit card account |
| `HEADERS.ASSETS` | `'!Type:Oth A'` | Other assets |
| `HEADERS.LIABILITIES` | `'!Type:Oth L'` | Liabilities |

**Returns:** `string` - QIF formatted string

**Example:**

```typescript
import { serialisers } from 'transaction-serde';

const transactions = [
  { date: new Date('2024-01-15'), amount: 100, payee: 'Employer' }
];

// Default options
const qif = serialisers.qif(transactions);
// !Type:Bank
// D2024-01-15
// T100
// PEmployer
// ^

// Custom options
const qifCredit = serialisers.qif(transactions, {
  locale: 'de-DE',
  header: '!Type:CCard'
});
```

**Notes:**
- Transactions without valid dates or amounts are skipped
- The locale option affects number formatting (e.g., decimal separators)

---

## Utilities

Functions for inspecting data, guessing field mappings, and creating mappers.

### utils.inspect

```typescript
function inspect(input: string, options?: InspectOptions): InspectResult
```

Inspects CSV or JSON data and returns a uniform report with headers and sample records. Useful for previewing unknown data before parsing.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | CSV or JSON string to inspect |
| `options` | `InspectOptions` | Optional configuration |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sampleSize` | `number` | `3` | Number of sample records to return |

**Returns:** `InspectResult`

```typescript
type InspectResult = {
  format: 'csv' | 'json';           // Detected format
  fields: string[];                  // Field names/headers
  sample: Record<string, unknown>[]; // Sample records
  recordCount: number;               // Total number of records
};
```

**Example:**

```typescript
import { utils } from 'transaction-serde';

const csv = `Date,Amount,Merchant
2024-01-15,100,Store
2024-01-16,-50,Coffee Shop`;

const report = utils.inspect(csv);
// {
//   format: 'csv',
//   fields: ['Date', 'Amount', 'Merchant'],
//   sample: [
//     { Date: '2024-01-15', Amount: '100', Merchant: 'Store' },
//     { Date: '2024-01-16', Amount: '-50', Merchant: 'Coffee Shop' }
//   ],
//   recordCount: 2
// }
```

**Notes:**
- Automatically detects JSON vs CSV format
- Sample values are returned as raw strings from the source data

---

### utils.guess

```typescript
function guess(fields: string[], options?: GuessOptions): GuessResult
```

Uses heuristics to guess field mappings from header names. Matches common patterns like "Transaction Date", "Amount", "Merchant", etc.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `fields` | `string[]` | Array of field names to match |
| `options` | `GuessOptions` | Optional configuration |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minConfidence` | `'high' \| 'medium'` | `'medium'` | Minimum confidence to include a mapping |
| `sample` | `Record<string, unknown>[]` | `[]` | Sample records for value-based heuristics |

**Returns:** `GuessResult`

```typescript
type GuessResult = {
  guesses: FieldGuess[];                           // Individual field guesses
  unmappedFields: string[];                        // Fields that couldn't be mapped
  mapping: Partial<Record<TransactionKey, string>>; // Ready-to-use mapping object
};

type FieldGuess = {
  sourceField: string;           // Original field name
  targetField: TransactionKey;   // Matched transaction field
  confidence: 'high' | 'medium'; // Confidence level
  reason: string;                // Explanation for the match
};
```

**High Confidence Patterns:**

| Target Field | Matches |
|--------------|---------|
| `date` | date, transaction date, posting date, value date, effective date |
| `amount` | amount, value, transaction amount |
| `payee` | payee, merchant, vendor, recipient, beneficiary |
| `description` | description, memo, note, narrative |
| `category` | category, classification |

**Medium Confidence Patterns:**

| Target Field | Matches |
|--------------|---------|
| `date` | *date (suffix), when, timestamp |
| `amount` | debit, credit, sum, total, price |
| `payee` | name, counterparty, store |
| `description` | details, reference, particulars |
| `category` | type, class, group, tag |

**Example:**

```typescript
import { utils } from 'transaction-serde';

const result = utils.guess(['Transaction Date', 'Value', 'Merchant', 'Notes', 'ID']);
// {
//   guesses: [
//     { sourceField: 'Transaction Date', targetField: 'date', confidence: 'high', ... },
//     { sourceField: 'Value', targetField: 'amount', confidence: 'high', ... },
//     { sourceField: 'Merchant', targetField: 'payee', confidence: 'high', ... },
//     { sourceField: 'Notes', targetField: 'description', confidence: 'high', ... }
//   ],
//   unmappedFields: ['ID'],
//   mapping: {
//     date: 'Transaction Date',
//     amount: 'Value',
//     payee: 'Merchant',
//     description: 'Notes'
//   }
// }

// With value-based boosting
const boosted = utils.guess(['When', 'Total'], {
  sample: [{ When: '2024-01-15', Total: '100.50' }]
});
// 'When' and 'Total' get boosted to high confidence based on value patterns
```

**Notes:**
- Each target field is mapped at most once (first match wins)
- Fields that don't match any pattern are listed in `unmappedFields`
- Providing sample data can boost medium confidence matches to high

---

### utils.createFieldMapper

```typescript
function createFieldMapper(mapping: FieldMapping): MapFunction
```

Creates a map function compatible with the CSV deserializer's `map` option from a simple field mapping configuration.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mapping` | `FieldMapping` | Object mapping transaction keys to source field names or transform functions |

**FieldMapping Type:**

```typescript
type FieldMapping = Partial<Record<
  TransactionKey,
  string | ((row: Record<string, unknown>) => string)
>>;
```

**Returns:** `MapFunction` - A function compatible with `deserialisers.csv()`'s `map` option

**Example - Simple String Mapping:**

```typescript
import { deserialisers, utils } from 'transaction-serde';

const csv = `Transaction Date,Value,Merchant
2024-01-15,100,Store`;

const mapper = utils.createFieldMapper({
  date: 'Transaction Date',
  amount: 'Value',
  payee: 'Merchant'
});

const transactions = deserialisers.csv(csv, { map: mapper });
```

**Example - Custom Transform Functions:**

```typescript
// Handle separate debit/credit columns
const mapper = utils.createFieldMapper({
  date: 'Date',
  amount: (row) => {
    const debit = parseFloat(row['Debit'] as string) || 0;
    const credit = parseFloat(row['Credit'] as string) || 0;
    return String(credit - debit);
  },
  payee: 'Merchant',
  description: (row) => `${row['Reference']} - ${row['Notes']}`
});
```

**Example - Full Workflow:**

```typescript
import { deserialisers, utils } from 'transaction-serde';

// 1. Inspect the data
const report = utils.inspect(bankExportCsv);

// 2. Guess mappings
const guessed = utils.guess(report.fields, { sample: report.sample });

// 3. Review and optionally adjust the mapping
const mapping = {
  ...guessed.mapping,
  description: 'Notes'  // Override if needed
};

// 4. Create mapper and parse
const mapper = utils.createFieldMapper(mapping);
const transactions = deserialisers.csv(bankExportCsv, { map: mapper });
```

**Notes:**
- String values map directly from the source field name
- Function values receive the entire row and must return a string
- Missing or empty values are omitted from the result
- Transform function errors are caught and the field is skipped

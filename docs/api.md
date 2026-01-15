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

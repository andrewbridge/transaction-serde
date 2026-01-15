# Format Specifications

This document describes the file formats supported by transaction-serde and how the library handles them.

## Table of Contents

- [JSON Format](#json-format)
- [CSV Format](#csv-format)
- [QIF Format](#qif-format)
- [Date Formats](#date-formats)

---

## JSON Format

### Structure

Transactions are represented as a JSON array of objects:

```json
[
  {
    "date": "2024-01-15",
    "amount": 100.00,
    "payee": "Employer",
    "description": "Monthly salary",
    "category": "Income"
  },
  {
    "date": "2024-01-16",
    "amount": -25.50,
    "payee": "Coffee Shop",
    "description": "Morning coffee",
    "category": "Food & Drink"
  }
]
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | Yes* | Date in any supported format |
| `amount` | number or string | Yes* | Transaction amount |
| `payee` | string | No | Payee or merchant name |
| `description` | string | No | Transaction description |
| `category` | string | No | Category classification |

*Transactions without both `date` and `amount` are skipped during deserialisation.

### Serialisation Output

When serialising to JSON:
- Dates are formatted as ISO 8601 date strings (`YYYY-MM-DD`)
- The time portion is stripped
- Numbers are serialised as-is (no string conversion)

**Example output:**
```json
[{"date":"2024-01-15","amount":100,"payee":"Employer"}]
```

---

## CSV Format

### Structure

Standard CSV with a header row:

```csv
date,amount,payee,description,category
2024-01-15,100,Employer,Monthly salary,Income
2024-01-16,-25.50,Coffee Shop,Morning coffee,Food & Drink
```

### Header Names

By default, the library expects these exact header names (case-sensitive):

| Header | Transaction Field |
|--------|-------------------|
| `date` | `date` |
| `amount` | `amount` |
| `payee` | `payee` |
| `description` | `description` |
| `category` | `category` |

### Custom Column Mapping

For CSV files with different column names, use the `map` option:

```typescript
deserialisers.csv(input, {
  map: (row) => ({
    date: row['Transaction Date'],
    amount: row['Amount (GBP)'],
    payee: row['Merchant'],
    description: row['Reference'],
    category: row['Category']
  })
});
```

### Serialisation Output

When serialising to CSV:
- String fields are quoted with double quotes
- The `amount` field is not quoted (numeric)
- Dates are formatted as ISO 8601 date strings (`YYYY-MM-DD`)
- Uses Unix line endings (`\n`)
- Column order: `date`, `amount`, `payee`, `description`, `category`

**Example output:**
```csv
"date","amount","payee","description","category"
"2024-01-15",100,"Employer","Monthly salary","Income"
```

---

## QIF Format

QIF (Quicken Interchange Format) is a plain text format originally developed by Intuit for Quicken software.

### Structure

```
!Type:Bank
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
^
```

### Header Types

Each QIF file must begin with a header indicating the account type:

| Header | Description |
|--------|-------------|
| `!Type:Bank` | Bank account |
| `!Type:Cash` | Cash account |
| `!Type:CCard` | Credit card |
| `!Type:Oth A` | Other assets |
| `!Type:Oth L` | Liabilities |

### Field Indicators

Each line in a transaction starts with a single character indicating the field:

| Indicator | Field | Description |
|-----------|-------|-------------|
| `D` | Date | Transaction date |
| `T` | Amount | Transaction amount |
| `P` | Payee | Payee or merchant name |
| `M` | Memo | Transaction description |
| `L` | Category | Category/classification |
| `^` | End | End of transaction record |

### Transaction Separators

Each transaction ends with a caret (`^`) on its own line.

### Serialisation Options

When serialising to QIF:

**Locale**: Affects number formatting. For example:
- `en-US`: `1,234.56`
- `de-DE`: `1.234,56`

**Header**: Sets the account type header at the start of the file.

---

## Date Formats

### Supported Input Formats

The library automatically detects and parses dates in these formats:

#### Numeric Formats (with `/`, `-`, or no separator)

| Format | Example |
|--------|---------|
| `yyyy/MM/dd` | `2024/01/15` |
| `yyyy/M/d` | `2024/1/5` |
| `dd/MM/yyyy` | `15/01/2024` |
| `d/M/yyyy` | `5/1/2024` |
| `MM/dd/yyyy` | `01/15/2024` |
| `M/d/yyyy` | `1/15/2024` |

Each numeric format also works with dashes (`-`) or no separators:
- `2024-01-15`
- `20240115`
- `15-01-2024`
- `15012024`

#### Text Formats

| Format | Example |
|--------|---------|
| `d MMMM yyyy` | `15 January 2024` |
| `dd MMM yyyy` | `15 Jan 2024` |
| `MMMM d yyyy` | `January 15 2024` |
| `MMM dd yyyy` | `Jan 15 2024` |

### Output Format

All serialisers output dates in ISO 8601 format: `YYYY-MM-DD`

### Timezone Handling

All dates are converted to UTC during parsing to ensure consistent behaviour across different timezones. The library uses [date-fns](https://date-fns.org/) with the `@date-fns/utc` extension for date handling.

### Date Parsing Strategy

When parsing dates:
1. The library attempts to parse all dates in the input using the same format
2. It tries each supported format in order until one successfully parses all dates
3. If no format works for all dates, an error is thrown

This ensures consistent date interpretation within a single file (e.g., `01/02/2024` will be interpreted the same way for all dates in the file).

---

## Format Conversion Examples

### JSON to CSV

```typescript
const json = '[{"date":"2024-01-15","amount":100,"payee":"Store"}]';
const transactions = deserialisers.json(json);
const csv = serialisers.csv(transactions);
```

### CSV to QIF

```typescript
const csv = 'date,amount,payee\n2024-01-15,100,Store';
const transactions = deserialisers.csv(csv);
const qif = serialisers.qif(transactions);
```

### QIF to JSON

```typescript
const qif = '!Type:Bank\nD2024-01-15\nT100\nPStore\n^';
const transactions = deserialisers.qif(qif);
const json = serialisers.json(transactions);
```

### Bank Statement CSV to QIF

```typescript
// Bank exports with custom column names
const bankCsv = `Date,Amount,Description
15/01/2024,100.00,SALARY PAYMENT
16/01/2024,-25.50,COFFEE SHOP`;

const transactions = deserialisers.csv(bankCsv, {
  map: (row) => ({
    date: row.Date,
    amount: row.Amount,
    description: row.Description
  })
});

const qif = serialisers.qif(transactions, {
  header: '!Type:Bank'
});
```

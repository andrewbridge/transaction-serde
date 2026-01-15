# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [Unreleased]

### Features

* **utils:** add inspect, guess, and createFieldMapper utilities

  Add a new `utils` namespace with three utilities for working with unknown bank export data:

  - `utils.inspect(input, options?)` - Parse CSV/JSON and return a uniform report with field names, sample records (default 3), and total record count. Optionally attempts to parse dates and numbers in the sample.

  - `utils.guess(fields, options?)` - Use heuristics to guess field mappings from header names. Matches common patterns like "Transaction Date", "Amount", "Merchant", etc. with high/medium confidence levels. Optionally boosts confidence based on sample value analysis.

  - `utils.createFieldMapper(mapping)` - Create a map function compatible with the CSV/JSON deserializers from a simple field mapping configuration. Supports both string mappings and custom transform functions for complex cases like separate debit/credit columns.

  These utilities enable a streamlined workflow for handling unknown bank exports:
  1. Inspect the data to understand its structure
  2. Guess field mappings from headers
  3. Review and adjust the mapping if needed
  4. Create a mapper and parse

  ```typescript
  import { deserialisers, utils } from 'transaction-serde';

  const report = utils.inspect(bankExportCsv);
  const guessed = utils.guess(report.fields, { sample: report.sample });
  const mapper = utils.createFieldMapper(guessed.mapping);
  const transactions = deserialisers.csv(bankExportCsv, { map: mapper });
  ```

* **json:** add `map` option to JSON deserializer

  The JSON deserializer now supports the same `map` option as the CSV deserializer, allowing custom field mapping for non-standard JSON formats:

  ```typescript
  const transactions = deserialisers.json(jsonData, {
    map: (row) => ({
      date: row.transactionDate,
      amount: row.value,
      payee: row.merchant
    })
  });
  ```

## [2.2.1](https://github.com/andrewbridge/transaction-serde/compare/v2.2.0...v2.2.1)

* docs: fix JSDoc comments and add comprehensive documentation

## [2.2.0](https://github.com/andrewbridge/transaction-serde/compare/v2.1.0...v2.2.0)

### Features

* feat: log CSV errors but only throw an error if no data is parsed

### Bug Fixes

* fix: trim whitespace from CSV input to stop papaparse from complaining about empty rows

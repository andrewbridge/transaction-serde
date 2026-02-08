# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [4.0.1](https://github.com/andrewbridge/transaction-serde/compare/v4.0.0...v4.0.1) (2026-02-08)

## [4.0.0](https://github.com/andrewbridge/transaction-serde/compare/v3.0.0...v4.0.0) (2026-02-08)


### ⚠ BREAKING CHANGES

* `attemptParsing` option removed from `inspect()`.
Sample values are now always raw strings from the source data.

* chore: add tests to hit 100% coverage

Add test for tryParseNumber rejecting date-like strings (e.g. "2024-01-15").
Add istanbul ignore for unreachable defensive guard in tryParseNumber
where numericLiteral regex can't fail if parseFloat already succeeded.

### Features

* add `skipRows` option to CSV deserialisation and inspection ([#3](https://github.com/andrewbridge/transaction-serde/pull/3)) ([d433b48](https://github.com/andrewbridge/transaction-serde/commit/d433b481e0a768e99849035b3de83c7056f75fde)) — thanks [@Domoconnor](https://github.com/Domoconnor)
* add `amount_inflow` and `amount_outflow` field mapping ([#3](https://github.com/andrewbridge/transaction-serde/pull/3)) ([d433b48](https://github.com/andrewbridge/transaction-serde/commit/d433b481e0a768e99849035b3de83c7056f75fde))

### Bug Fixes

* move value parsing out of inspect into guess and deserialisers ([#4](https://github.com/andrewbridge/transaction-serde/issues/4)) ([98ebc4c](https://github.com/andrewbridge/transaction-serde/commit/98ebc4ca67c162e76e06571d792da972cf386e6e))

## [3.0.0](https://github.com/andrewbridge/transaction-serde/compare/v2.5.0...v3.0.0) (2026-01-27)


### ⚠ BREAKING CHANGES

* parseTimeStrings now returns number[] instead of ParsedTime[].

### Features

* add optional time field to Transaction type ([04f0c1f](https://github.com/andrewbridge/transaction-serde/commit/04f0c1f26049eca211cedf346a89b284fb13deed))

## [2.5.0](https://github.com/andrewbridge/transaction-serde/compare/v2.4.0...v2.5.0) (2026-01-26)


### Features

* add time parsing utility ([e6706b5](https://github.com/andrewbridge/transaction-serde/commit/e6706b53e87261e30c3a20d6ab19b6f6a387e761))

## [2.4.0](https://github.com/andrewbridge/transaction-serde/compare/v2.3.0...v2.4.0) (2026-01-26)


### Features

* add optional metadata field to Transaction type ([c24dbf9](https://github.com/andrewbridge/transaction-serde/commit/c24dbf9995df741f9e1fe118969580d9a193dc99))

## [2.3.0](https://github.com/andrewbridge/transaction-serde/compare/v2.2.1...v2.3.0) (2026-01-15)


### Features

* add inspect, guess, and field mapper utilities ([d62ac92](https://github.com/andrewbridge/transaction-serde/commit/d62ac92a521a36ddf9b2e02dbc23b18972471cc3))
* **json:** add map option to JSON deserializer ([792bd23](https://github.com/andrewbridge/transaction-serde/commit/792bd230c778bba7269b71a71cfd0c774fc0a275))

## [2.2.1](https://github.com/andrewbridge/transaction-serde/compare/v2.2.0...v2.2.1)

* docs: fix JSDoc comments and add comprehensive documentation

## [2.2.0](https://github.com/andrewbridge/transaction-serde/compare/v2.1.0...v2.2.0)

### Features

* feat: log CSV errors but only throw an error if no data is parsed

### Bug Fixes

* fix: trim whitespace from CSV input to stop papaparse from complaining about empty rows

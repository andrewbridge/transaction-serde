# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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

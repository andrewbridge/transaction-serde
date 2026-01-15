# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.2.1](https://github.com/andrewbridge/transaction-serde/compare/v2.2.0...v2.2.1) (2026-01-15)

## [2.2.0](https://github.com/andrewbridge/transaction-serde/compare/v2.1.2...v2.2.0) (2025-05-16)


### Features

* log CSV errors but only throw an error if no data is parsed ([e3b1013](https://github.com/andrewbridge/transaction-serde/commit/e3b10138da66aea380ac950612f07d94859112a0))


### Bug Fixes

* trim whitespace from CSV input to stop papaparse from complaining about empty rows ([5b84a40](https://github.com/andrewbridge/transaction-serde/commit/5b84a405a69bb105fac09a02c5517af6b87fd24d))

### [2.1.2](https://github.com/andrewbridge/transaction-serde/compare/v2.1.1...v2.1.2) (2025-02-17)

### [2.1.1](https://github.com/andrewbridge/transaction-serde/compare/v2.1.0...v2.1.1) (2025-02-17)

## [2.1.0](https://github.com/andrewbridge/transaction-serde/compare/v2.0.0...v2.1.0) (2025-02-17)


### Features

* add browser compatible builds of the library ([12ed6e9](https://github.com/andrewbridge/transaction-serde/commit/12ed6e942f96a46481972e12aa92990c03e6324f))

## [2.0.0](https://github.com/andrewbridge/transaction-serde/compare/v1.1.0...v2.0.0) (2025-02-16)


### ⚠ BREAKING CHANGES

* You must now import a level deeper, either choosing deserialiser or serialiser

* export serialisers and deserialisers as named objects ([1ae7218](https://github.com/andrewbridge/transaction-serde/commit/1ae7218bf34d720b6626e4caa41bca2dda9c67e0))

## 1.1.0 (2025-02-16)


### Features

* add further testing to get full line coverage for CSV deserialiser ([39824e8](https://github.com/andrewbridge/transaction-serde/commit/39824e88cc84c73739506a4624f661ea5ddbb764))
* add further testing to get full line coverage for JSON deserialiser ([792d56d](https://github.com/andrewbridge/transaction-serde/commit/792d56dd3e837cda74b2fdfa3fd359a59e108733))
* add library code with tests ([78550c7](https://github.com/andrewbridge/transaction-serde/commit/78550c7603cf4e3e198734b4c3e5a196af278ebd))
* export JSON and CSV serdes ([b6b4fd9](https://github.com/andrewbridge/transaction-serde/commit/b6b4fd9c735cb1ad874d455d3e9edbb920da80ca))
* improve deserialiser tests and coverage ([92b9262](https://github.com/andrewbridge/transaction-serde/commit/92b92626dc3d4b2380e3164ae1d6744adea9b7a1))
* improve serialiser tests and coverage ([c02979f](https://github.com/andrewbridge/transaction-serde/commit/c02979fbdc40c89a121df2ec460e7858f037cc0d))
* upgrade dependencies and remove example code ([4eed400](https://github.com/andrewbridge/transaction-serde/commit/4eed400da7dc7f72a0cb48c88592aadd1e08f005))


### Bug Fixes

* remove unrecognised typedoc options ([4976fd2](https://github.com/andrewbridge/transaction-serde/commit/4976fd21fe81ed349a27e2930dc87641f955f391))

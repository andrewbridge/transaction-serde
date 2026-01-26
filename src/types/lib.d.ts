/**
 * Type definitions for transaction-serde.
 *
 * This module declares the core types used throughout the library for
 * representing financial transactions and the functions that transform them.
 *
 * @packageDocumentation
 */
declare module 'transaction-serde' {
  /**
   * Represents a financial transaction.
   *
   * All fields are optional to allow partial transaction data during parsing.
   * However, most operations require at least `date` and `amount` to be present.
   *
   * @example
   * ```ts
   * const transaction: Transaction = {
   *   date: new Date('2024-01-15'),
   *   amount: -50.00,
   *   payee: 'Coffee Shop',
   *   description: 'Morning coffee',
   *   category: 'Food & Drink',
   *   metadata: { originalId: 'TXN-12345', source: 'bank-api' }
   * };
   * ```
   */
  type Transaction = Partial<{
    /** The date of the transaction */
    date: Date;
    /** The transaction amount (positive for income, negative for expenses) */
    amount: number;
    /** The name of the payee or merchant */
    payee: string;
    /** A description or memo for the transaction */
    description: string;
    /** The category or classification of the transaction */
    category: string;
    /** Additional data that persists through the library without direct mapping */
    metadata: Record<string, unknown>;
  }>;

  /**
   * A transaction-like object where all values are strings.
   *
   * Used as an intermediate representation during deserialisation before
   * values are parsed into their proper types. Metadata can be either a string
   * (JSON) or an object that will be passed through directly.
   */
  type TransactionLike = {
    [K in keyof Omit<Transaction, 'metadata'>]: string;
  } & {
    metadata?: string | Record<string, unknown>;
  };

  /**
   * A function that converts a string into an array of transactions.
   *
   * @typeParam Options - Optional configuration type for the deserialiser.
   * @param input - The string to deserialise (JSON, CSV, or QIF format).
   * @param options - Optional configuration for the deserialisation process.
   * @returns An array of transactions, or a Promise resolving to an array.
   */
  type Deserialiser<Options = never> = (
    input: string,
    options?: Options
  ) => Transaction[] | Promise<Transaction[]>;

  /**
   * A function that converts an array of transactions into a string.
   *
   * @typeParam Options - Optional configuration type for the serialiser.
   * @param object - The transactions to serialise.
   * @param options - Optional configuration for the serialisation process.
   * @returns A string representation of the transactions, or a Promise resolving to a string.
   */
  type Serialiser<Options = never> = (
    object: Transaction[],
    options?: Options
  ) => string | Promise<string>;
}

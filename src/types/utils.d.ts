/**
 * Type definitions for transaction-serde utilities.
 *
 * This module declares types for the inspect, guess, and field mapping utilities.
 *
 * @packageDocumentation
 */
declare module 'transaction-serde' {
  /**
   * Valid keys for a Transaction object.
   */
  type TransactionKey =
    | 'date'
    | 'time'
    | 'amount'
    | 'payee'
    | 'description'
    | 'category'
    | 'metadata';

  /**
   * Result of inspecting a data source.
   */
  type InspectResult = {
    /** The detected format of the input */
    format: 'csv' | 'json';
    /** Field names/headers found in the data */
    fields: string[];
    /** Sample of first N records, with values as raw strings */
    sample: Record<string, unknown>[];
    /** Total number of records detected */
    recordCount: number;
  };

  /**
   * Options for the inspect function.
   */
  type InspectOptions = {
    /** Number of sample records to return (default: 3) */
    sampleSize?: number;
  };

  /**
   * Confidence level for a field mapping guess.
   */
  type GuessConfidence = 'high' | 'medium';

  /**
   * A single field mapping guess.
   */
  type FieldGuess = {
    /** The source field name from the data */
    sourceField: string;
    /** The target transaction field */
    targetField: TransactionKey;
    /** Confidence level of this guess */
    confidence: GuessConfidence;
    /** Reason for the guess */
    reason: string;
  };

  /**
   * Result of guessing field mappings.
   */
  type GuessResult = {
    /** Array of field mapping guesses */
    guesses: FieldGuess[];
    /** Fields that could not be mapped */
    unmappedFields: string[];
    /** Mapping object ready for use with createFieldMapper */
    mapping: Partial<Record<TransactionKey, string>>;
  };

  /**
   * Options for the guess function.
   */
  type GuessOptions = {
    /** Minimum confidence to include a mapping (default: 'medium') */
    minConfidence?: GuessConfidence;
    /** Sample records to analyze for value-based heuristics */
    sample?: Record<string, unknown>[];
  };

  /**
   * A field mapping configuration.
   * Maps transaction keys to either source field names or custom transform functions.
   */
  type FieldMapping = Partial<
    Record<TransactionKey, string | ((row: Record<string, unknown>) => string)>
  >;

  /**
   * The map function signature used by the CSV deserializer.
   */
  type MapFunction = (
    object: Record<string, unknown>
  ) => TransactionLike | null;
}

import {
  FieldMapping,
  MapFunction,
  TransactionKey,
  TransactionLike,
} from 'transaction-serde';

import { transactionKeys } from '../types/common';

/**
 * Default map function that extracts transaction fields from an object.
 *
 * Looks for fields named 'date', 'amount', 'payee', 'description', and 'category'
 * and returns them as a TransactionLike object. Handles both string and number values
 * for the amount field.
 *
 * @param object - The source object to extract fields from.
 * @returns A TransactionLike object with extracted fields, or null if input is invalid.
 */
export function defaultFieldMapper(
  object: Record<string, unknown>
): TransactionLike | null {
  const transaction: TransactionLike = {};
  if (typeof object !== 'object' || object === null) return null;
  transactionKeys.forEach((key) => {
    const value = object[key];
    if (typeof value === 'string') {
      transaction[key as keyof TransactionLike] = value;
    } else if (key === 'amount' && typeof value === 'number') {
      transaction[key as keyof TransactionLike] = String(value);
    } else if (
      key === 'metadata' &&
      typeof value === 'object' &&
      value !== null
    ) {
      transaction.metadata = value as Record<string, unknown>;
    }
  });
  return transaction;
}

/**
 * Creates a map function compatible with the CSV deserializer's map option.
 *
 * Takes a simple field mapping configuration and returns a function that transforms
 * source records into TransactionLike objects. Supports both simple string mappings
 * (source field name) and custom transform functions for complex cases.
 *
 * @example
 * ```ts
 * import { utils, deserialisers } from 'transaction-serde';
 *
 * // Simple field name mapping
 * const mapper = utils.createFieldMapper({
 *   date: 'Transaction Date',
 *   amount: 'Value',
 *   payee: 'Merchant',
 *   description: 'Notes',
 * });
 *
 * const transactions = deserialisers.csv(csvData, { map: mapper });
 * ```
 *
 * @example
 * ```ts
 * // With custom transform functions
 * const mapper = utils.createFieldMapper({
 *   date: 'Date',
 *   amount: (row) => {
 *     // Combine debit and credit columns
 *     const debit = parseFloat(row['Debit'] as string) || 0;
 *     const credit = parseFloat(row['Credit'] as string) || 0;
 *     return String(credit - debit);
 *   },
 *   payee: 'Merchant Name',
 *   description: (row) => `${row['Reference']} - ${row['Notes']}`,
 * });
 * ```
 *
 * @param mapping - Object mapping transaction keys to source field names or transform functions.
 * @returns A map function that transforms source records to TransactionLike objects.
 */
export function createFieldMapper(mapping: FieldMapping): MapFunction {
  return (row: Record<string, unknown>): TransactionLike | null => {
    if (typeof row !== 'object' || row === null) {
      return null;
    }

    const transaction: TransactionLike = {};

    for (const key of transactionKeys) {
      const mappingValue = mapping[key as TransactionKey];

      if (mappingValue === undefined) {
        continue;
      }

      let value: string | undefined;

      if (typeof mappingValue === 'function') {
        // Custom transform function
        try {
          value = mappingValue(row);
        } catch {
          // Transform failed, skip this field
          continue;
        }
      } else if (typeof mappingValue === 'string') {
        // Simple field name mapping
        const sourceValue = row[mappingValue];
        if (typeof sourceValue === 'string') {
          value = sourceValue;
        } else if (sourceValue !== null && sourceValue !== undefined) {
          value = String(sourceValue);
        }
      }

      if (value !== undefined && value.length > 0) {
        transaction[key as keyof TransactionLike] = value;
      }
    }

    return transaction;
  };
}

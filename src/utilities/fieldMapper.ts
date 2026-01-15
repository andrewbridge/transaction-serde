import {
  FieldMapping,
  MapFunction,
  TransactionKey,
  TransactionLike,
} from 'transaction-serde';

import { transactionKeys } from '../types/common';

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

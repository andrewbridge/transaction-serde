/**
 * Valid keys for a Transaction object.
 *
 * Used internally to ensure consistent field handling across serialisers and deserialisers.
 * The order of keys determines column order in CSV output.
 */
export const transactionKeys = [
  'date',
  'amount',
  'payee',
  'description',
  'category',
] as const;

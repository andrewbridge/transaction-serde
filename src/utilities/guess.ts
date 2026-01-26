import {
  FieldGuess,
  GuessConfidence,
  GuessOptions,
  GuessResult,
  TransactionKey,
} from 'transaction-serde';

const defaultOptions: Required<GuessOptions> = {
  minConfidence: 'medium',
  sample: [],
};

/**
 * Heuristic patterns for matching field names to transaction keys.
 * Ordered by specificity - more specific patterns first.
 */
const fieldPatterns: Record<
  TransactionKey,
  { pattern: RegExp; confidence: GuessConfidence }[]
> = {
  date: [
    { pattern: /^date$/i, confidence: 'high' },
    { pattern: /^transaction[_\s-]?date$/i, confidence: 'high' },
    { pattern: /^trans[_\s-]?date$/i, confidence: 'high' },
    { pattern: /^posting[_\s-]?date$/i, confidence: 'high' },
    { pattern: /^value[_\s-]?date$/i, confidence: 'high' },
    { pattern: /^effective[_\s-]?date$/i, confidence: 'high' },
    { pattern: /^settlement[_\s-]?date$/i, confidence: 'medium' },
    { pattern: /date$/i, confidence: 'medium' },
    { pattern: /^when$/i, confidence: 'medium' },
    { pattern: /^timestamp$/i, confidence: 'medium' },
  ],
  amount: [
    { pattern: /^amount$/i, confidence: 'high' },
    { pattern: /^value$/i, confidence: 'high' },
    { pattern: /^transaction[_\s-]?amount$/i, confidence: 'high' },
    { pattern: /^trans[_\s-]?amount$/i, confidence: 'high' },
    { pattern: /^debit$/i, confidence: 'medium' },
    { pattern: /^credit$/i, confidence: 'medium' },
    { pattern: /^sum$/i, confidence: 'medium' },
    { pattern: /^total$/i, confidence: 'medium' },
    { pattern: /^price$/i, confidence: 'medium' },
    { pattern: /^cost$/i, confidence: 'medium' },
    { pattern: /amount$/i, confidence: 'medium' },
  ],
  payee: [
    { pattern: /^payee$/i, confidence: 'high' },
    { pattern: /^merchant$/i, confidence: 'high' },
    { pattern: /^vendor$/i, confidence: 'high' },
    { pattern: /^recipient$/i, confidence: 'high' },
    { pattern: /^beneficiary$/i, confidence: 'high' },
    { pattern: /^merchant[_\s-]?name$/i, confidence: 'high' },
    { pattern: /^payee[_\s-]?name$/i, confidence: 'high' },
    { pattern: /^name$/i, confidence: 'medium' },
    { pattern: /^counterparty$/i, confidence: 'medium' },
    { pattern: /^store$/i, confidence: 'medium' },
    { pattern: /^shop$/i, confidence: 'medium' },
  ],
  description: [
    { pattern: /^description$/i, confidence: 'high' },
    { pattern: /^memo$/i, confidence: 'high' },
    { pattern: /^note$/i, confidence: 'high' },
    { pattern: /^notes$/i, confidence: 'high' },
    { pattern: /^narrative$/i, confidence: 'high' },
    { pattern: /^transaction[_\s-]?description$/i, confidence: 'high' },
    { pattern: /^details$/i, confidence: 'medium' },
    { pattern: /^reference$/i, confidence: 'medium' },
    { pattern: /^particulars$/i, confidence: 'medium' },
    { pattern: /^comment$/i, confidence: 'medium' },
    { pattern: /^remarks$/i, confidence: 'medium' },
  ],
  category: [
    { pattern: /^category$/i, confidence: 'high' },
    { pattern: /^classification$/i, confidence: 'high' },
    { pattern: /^transaction[_\s-]?type$/i, confidence: 'medium' },
    { pattern: /^trans[_\s-]?type$/i, confidence: 'medium' },
    { pattern: /^type$/i, confidence: 'medium' },
    { pattern: /^class$/i, confidence: 'medium' },
    { pattern: /^group$/i, confidence: 'medium' },
    { pattern: /^tag$/i, confidence: 'medium' },
    { pattern: /^label$/i, confidence: 'medium' },
  ],
  metadata: [], // We do not guess metadata fields, it's an escape hatch for users to retain non-critical data
};

/**
 * Confidence level ordering for comparison.
 */
const confidenceOrder: Record<GuessConfidence, number> = {
  high: 2,
  medium: 1,
};

/**
 * Checks if confidence meets minimum threshold.
 */
function meetsConfidence(
  confidence: GuessConfidence,
  minConfidence: GuessConfidence
): boolean {
  return confidenceOrder[confidence] >= confidenceOrder[minConfidence];
}

/**
 * Date patterns for value-based heuristics.
 */
const datePatterns = [
  /^\d{4}-\d{2}-\d{2}$/, // ISO date
  /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
  /^\d{1,2}\s+\w+\s+\d{4}$/, // D Month YYYY
  /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
];

/**
 * Value-based heuristics to improve confidence or suggest type.
 */
function analyzeValues(values: unknown[]): {
  suggestedType: TransactionKey | null;
  boost: boolean;
} {
  const stringValues = values.filter(
    (v): v is string => typeof v === 'string' && v.length > 0
  );

  if (stringValues.length === 0) {
    return { suggestedType: null, boost: false };
  }

  // Check for date-like values
  const looksLikeDates = stringValues.every((v) =>
    datePatterns.some((p) => p.test(v))
  );
  if (looksLikeDates) {
    return { suggestedType: 'date', boost: true };
  }

  // Check for numeric/amount-like values (currency symbols, numbers with decimals)
  const looksLikeAmounts = stringValues.every((v) =>
    /^-?[\d,]+\.?\d*$/.test(v.replace(/[$£€]/g, '').trim())
  );
  if (looksLikeAmounts) {
    return { suggestedType: 'amount', boost: true };
  }

  return { suggestedType: null, boost: false };
}

/**
 * Guesses field mappings based on field names and optionally sample values.
 *
 * Uses heuristics to match source field names to transaction fields (date, amount,
 * payee, description, category). Returns only mappings that meet the confidence
 * threshold. Each target field is mapped at most once.
 *
 * @example
 * ```ts
 * import { utils } from 'transaction-serde';
 *
 * const fields = ['Transaction Date', 'Value', 'Merchant', 'Notes'];
 * const result = utils.guess(fields);
 * // => {
 * //   guesses: [
 * //     { sourceField: 'Transaction Date', targetField: 'date', confidence: 'high', ... },
 * //     { sourceField: 'Value', targetField: 'amount', confidence: 'high', ... },
 * //     ...
 * //   ],
 * //   unmappedFields: [],
 * //   mapping: { date: 'Transaction Date', amount: 'Value', payee: 'Merchant', ... }
 * // }
 * ```
 *
 * @param fields - Array of field names to match.
 * @param options - Optional configuration.
 * @param options.minConfidence - Minimum confidence to include a mapping (default: 'medium').
 * @param options.sample - Sample records to analyze for value-based heuristics.
 * @returns A GuessResult with guesses, unmapped fields, and a ready-to-use mapping object.
 */
export function guess(fields: string[], options?: GuessOptions): GuessResult {
  const { minConfidence, sample } = { ...defaultOptions, ...options };

  const guesses: FieldGuess[] = [];
  const usedTargets = new Set<TransactionKey>();
  const unmappedFields: string[] = [];

  for (const field of fields) {
    let bestMatch: FieldGuess | null = null;

    // Check each transaction key's patterns
    for (const [targetField, patterns] of Object.entries(fieldPatterns) as [
      TransactionKey,
      (typeof fieldPatterns)['date']
    ][]) {
      // Skip if this target is already mapped
      if (usedTargets.has(targetField)) continue;

      for (const { pattern, confidence } of patterns) {
        if (pattern.test(field)) {
          // Apply value-based analysis if sample provided
          let finalConfidence = confidence;
          let reason = `Field name "${field}" matches pattern for ${targetField}`;

          if (sample.length > 0) {
            const sampleValues = sample.map((r) => r[field]);
            const { suggestedType, boost } = analyzeValues(sampleValues);

            if (
              suggestedType === targetField &&
              boost &&
              confidence === 'medium'
            ) {
              finalConfidence = 'high';
              reason += ' (boosted by value analysis)';
            }
          }

          if (!meetsConfidence(finalConfidence, minConfidence)) continue;

          // Keep best match (highest confidence)
          if (
            !bestMatch ||
            confidenceOrder[finalConfidence] >
              confidenceOrder[bestMatch.confidence]
          ) {
            bestMatch = {
              sourceField: field,
              targetField,
              confidence: finalConfidence,
              reason,
            };
          }
          break; // Found a match for this pattern set
        }
      }
    }

    if (bestMatch) {
      guesses.push(bestMatch);
      usedTargets.add(bestMatch.targetField);
    } else {
      unmappedFields.push(field);
    }
  }

  // Build mapping object
  const mapping: Partial<Record<TransactionKey, string>> = {};
  for (const guess of guesses) {
    mapping[guess.targetField] = guess.sourceField;
  }

  return {
    guesses,
    unmappedFields,
    mapping,
  };
}

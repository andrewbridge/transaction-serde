import {
  FieldGuess,
  GuessConfidence,
  GuessOptions,
  GuessResult,
  TransactionKey,
} from 'transaction-serde';

import { tryParseDate, tryParseNumber } from './parse';

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
    { pattern: /^sum$/i, confidence: 'medium' },
    { pattern: /^total$/i, confidence: 'medium' },
    { pattern: /^price$/i, confidence: 'medium' },
    { pattern: /^cost$/i, confidence: 'medium' },
    { pattern: /amount$/i, confidence: 'medium' },
  ],
  amount_inflow: [
    { pattern: /^paid[_\s-]?in$/i, confidence: 'high' },
    { pattern: /^money[_\s-]?in$/i, confidence: 'high' },
    { pattern: /^credit$/i, confidence: 'medium' },
    { pattern: /^deposit$/i, confidence: 'medium' },
    { pattern: /^income$/i, confidence: 'medium' },
    { pattern: /inflow$/i, confidence: 'medium' },
  ],
  amount_outflow: [
    { pattern: /^paid[_\s-]?out$/i, confidence: 'high' },
    { pattern: /^money[_\s-]?out$/i, confidence: 'high' },
    { pattern: /^debit$/i, confidence: 'medium' },
    { pattern: /^withdrawal$/i, confidence: 'medium' },
    { pattern: /^expense$/i, confidence: 'medium' },
    { pattern: /outflow$/i, confidence: 'medium' },
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
  time: [
    { pattern: /^time$/i, confidence: 'high' },
    { pattern: /^transaction[_\s-]?time$/i, confidence: 'high' },
    { pattern: /^trans[_\s-]?time$/i, confidence: 'high' },
    { pattern: /time$/i, confidence: 'medium' },
    { pattern: /^clock$/i, confidence: 'medium' },
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
 * Time patterns for value-based heuristics.
 */
const timePatterns = [
  /^\d{1,2}:\d{2}(:\d{2})?$/, // HH:mm or HH:mm:ss
  /^\d{1,2}:\d{2}(:\d{2})?\s*[AaPp][Mm]$/, // 12-hour with AM/PM
  /^\d{1,2}\.\d{2}(\.\d{2})?$/, // HH.mm or HH.mm.ss
];

/**
 * Checks whether a parsed number is a significant portion of the original string,
 * using tiered thresholds based on whether letters are adjacent to the number.
 * Numbers embedded in words (e.g. "TH3") require higher significance than
 * numbers with non-letter prefixes (e.g. "$100").
 */
function isSignificantNumber(value: string, parsed: number): boolean {
  const match = value.match(/[-.\d]/);
  if (!match?.index && match?.index !== 0) return true;

  // Use a regex to find the numeric literal length, rather than String(parsed)
  // which strips trailing zeros (e.g. 100.5 → "100.5" but original was "100.50")
  const numericPart = value.slice(match.index);
  const numericLiteral = numericPart.match(/^-?(\d+\.?\d*|\.\d+)/);
  const literalLength = numericLiteral
    ? numericLiteral[0].length
    : String(parsed).length;

  const charBefore = match.index > 0 ? value[match.index - 1] : '';
  const remainder = value.slice(match.index + literalLength);
  const charAfter = remainder.length > 0 ? remainder[0] : '';
  const hasLetterBefore = /[a-zA-Z]/.test(charBefore);
  const hasLetterAfter = /[a-zA-Z]/.test(charAfter);

  const significance = literalLength / value.trim().length;
  let threshold = 0.1;
  if (hasLetterBefore && hasLetterAfter) threshold = 0.5;
  else if (hasLetterBefore || hasLetterAfter) threshold = 0.25;

  return significance >= threshold;
}

/**
 * Value-based heuristics to improve confidence or suggest type.
 */
function analyzeValues(values: unknown[]): {
  suggestedType: TransactionKey | null;
  boost: boolean;
} {
  // Filter to meaningful values: non-empty strings or finite numbers
  const meaningfulValues = values.filter(
    (v) =>
      (typeof v === 'string' && v.length > 0) ||
      (typeof v === 'number' && Number.isFinite(v))
  );

  if (meaningfulValues.length === 0) {
    return { suggestedType: null, boost: false };
  }

  // Date and time checks only apply when all values are strings
  const stringValues = meaningfulValues.filter(
    (v): v is string => typeof v === 'string'
  );

  if (stringValues.length === meaningfulValues.length) {
    // Check for date-like values: pattern match + tryParseDate gate
    const looksLikeDates = stringValues.every(
      (v) => datePatterns.some((p) => p.test(v)) && tryParseDate(v) !== null
    );
    if (looksLikeDates) {
      return { suggestedType: 'date', boost: true };
    }

    // Check for time-like values
    const looksLikeTimes = stringValues.every((v) =>
      timePatterns.some((p) => p.test(v))
    );
    if (looksLikeTimes) {
      return { suggestedType: 'time', boost: true };
    }
  }

  // Check for numeric/amount-like values:
  // Values already typed as numbers are strong evidence for amount.
  // String values need: tryParseNumber gate + regex pattern + significance heuristic.
  const looksLikeAmounts = meaningfulValues.every((v) => {
    if (typeof v === 'number') return true;
    const s = v as string;
    const parsed = tryParseNumber(s);
    if (parsed === null) return false;
    if (!/^-?[\d,]+\.?\d*$/.test(s.replace(/[$£€]/g, '').trim())) return false;
    return isSignificantNumber(s, parsed);
  });
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

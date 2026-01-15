/**
 * QIF account type headers.
 *
 * These headers indicate the type of account the transactions belong to.
 * Each QIF file must start with one of these headers.
 *
 * @see https://en.wikipedia.org/wiki/Quicken_Interchange_Format
 */
export const HEADERS = {
  /** Bank account transactions */
  BANK: '!Type:Bank',
  /** Cash transactions */
  CASH: '!Type:Cash',
  /** Credit card transactions */
  CREDIT_CARD: '!Type:CCard',
  // INVESTMENTS: '!Type:Invst',
  /** Other asset account transactions */
  ASSETS: '!Type:Oth A',
  /** Liability account transactions */
  LIABILITIES: '!Type:Oth L',
  // ACCOUNTS: '!Account',
  // CATEGORIES: '!Type:Cat',
  // CLASS: '!Type:Class',
  // MEMORIZED: '!Type:Memorized'
} as const;

/**
 * Array of all valid QIF header values.
 */
export const HEADER_VALUES = Object.values(HEADERS);

/**
 * Type representing a valid QIF header string.
 */
export type Header = (typeof HEADER_VALUES)[number];

/**
 * QIF entry terminator character.
 *
 * Each transaction entry in a QIF file ends with this character on its own line.
 */
export const ENTRY_END = '^';

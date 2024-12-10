export const HEADERS = {
    BANK: '!Type:Bank',
    CASH: '!Type:Cash',
    CREDIT_CARD: '!Type:CCard',
    // INVESTMENTS: '!Type:Invst',
    ASSETS: '!Type:Oth A',
    LIABILITIES: '!Type:Oth L',
    // ACCOUNTS: '!Account',
    // CATEGORIES: '!Type:Cat',
    // CLASS: '!Type:Class',
    // MEMORIZED: '!Type:Memorized'
} as const;

export const HEADER_VALUES = Object.values(HEADERS);

export type Header = typeof HEADER_VALUES[number];

export const ENTRY_END = '^';
export const mergeOptions = <T>(
  defaults: T,
  ...overrides: (Partial<T> | undefined)[]
): T => Object.assign({}, defaults, ...overrides);

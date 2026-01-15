/**
 * Merges default options with one or more override objects.
 *
 * Creates a new options object by shallow-merging the defaults with any provided overrides.
 * Later overrides take precedence over earlier ones. Undefined values in overrides are ignored.
 *
 * @typeParam T - The type of the options object.
 * @param defaults - The default options to use as a base.
 * @param overrides - Zero or more partial option objects to merge over the defaults.
 * @returns A new options object with all overrides applied.
 *
 * @example
 * ```ts
 * const defaults = { locale: 'en-US', header: '!Type:Bank' };
 * const result = mergeOptions(defaults, { locale: 'en-GB' });
 * // => { locale: 'en-GB', header: '!Type:Bank' }
 * ```
 */
export const mergeOptions = <T>(
  defaults: T,
  ...overrides: (Partial<T> | undefined)[]
): T => Object.assign({}, defaults, ...overrides);

/**
 * If you import a dependency which does not include its own type definitions,
 * TypeScript will try to find a definition for it by following the `typeRoots`
 * compiler option in tsconfig.json. For this project, we've configured it to
 * fall back to this folder if nothing is found in node_modules/@types.
 *
 * Often, you can install the DefinitelyTyped
 * (https://github.com/DefinitelyTyped/DefinitelyTyped) type definition for the
 * dependency in question. However, if no one has yet contributed definitions
 * for the package, you may want to declare your own. (If you're using the
 * `noImplicitAny` compiler options, you'll be required to declare it.)
 *
 * This is an example type definition which allows import from `transaction-serde`,
 * e.g.:
 * ```ts
 * import something from 'transaction-serde';
 * something();
 * ```
 */
declare module 'transaction-serde' {
  type Transaction = Partial<{
    date: Date,
    amount: number,
    payee: string,
    description: string,
    category: string
  }>;
  type TransactionLike = {
    [K in keyof Transaction]: string;
  };
  
  type Deserialiser<Options = never> = (input: string, options?: Options) => Transaction[] | Promise<Transaction[]>;
  type Serialiser<Options = never> = (object: Transaction[], options?: Options) => string | Promise<string>;
}

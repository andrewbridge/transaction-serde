import test from 'ava';

import { mergeOptions } from './options';

type TestOptions = {
  foo: string;
  bar: number;
  baz: boolean;
};

const DEFAULT_OPTIONS: TestOptions = {
  foo: 'default',
  bar: 42,
  baz: false,
};

const COMPLETE_OVERRIDE: TestOptions = {
  foo: 'override',
  bar: 24,
  baz: true,
};

const PARTIAL_OVERRIDE: Partial<TestOptions> = {
  bar: 100,
};

test('options handling', (t) => {
  t.deepEqual(mergeOptions(DEFAULT_OPTIONS), DEFAULT_OPTIONS);
  t.deepEqual(
    mergeOptions(DEFAULT_OPTIONS, COMPLETE_OVERRIDE),
    COMPLETE_OVERRIDE
  );
  t.deepEqual(mergeOptions(DEFAULT_OPTIONS, PARTIAL_OVERRIDE), {
    foo: DEFAULT_OPTIONS.foo,
    bar: PARTIAL_OVERRIDE.bar,
    baz: DEFAULT_OPTIONS.baz,
  });
  t.deepEqual(
    mergeOptions(DEFAULT_OPTIONS, COMPLETE_OVERRIDE, PARTIAL_OVERRIDE),
    {
      foo: COMPLETE_OVERRIDE.foo,
      bar: PARTIAL_OVERRIDE.bar,
      baz: COMPLETE_OVERRIDE.baz,
    }
  );
  t.deepEqual(
    mergeOptions(DEFAULT_OPTIONS, PARTIAL_OVERRIDE, COMPLETE_OVERRIDE),
    COMPLETE_OVERRIDE
  );
});

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'build/browser/index.iife.js',
      format: 'iife',
      name: 'TransactionSerde',
      sourcemap: true
    },
    {
      file: 'build/browser/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.browser.json',
      outputToFilesystem: true
    }),
    resolve(),
    commonjs(),
    terser()
  ]
};
